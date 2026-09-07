import { ref, watch } from "vue";

import { parseDiagram } from "@/features/diagram/parser";
import { serializeDiagram } from "@/features/diagram/serializer";
import { useDiagramsStore } from "@/stores/diagrams";
import { generateDiagramId } from "@/features/diagrams/diagramStorage";
import {
  deleteDraft,
  getAllDrafts,
  saveDraft as saveDraftToStorage,
} from "@/features/drafts/draftRepository";
import { generateDraftId } from "@/features/drafts/draftStorage";

import { cloneDocument, cloneLayout, cloneSourceMap } from "./cloneHelpers";

import type { EditorState } from "./state";
import type { DiagramDraft } from "@/features/drafts/types";
import type { DiagramDocument } from "@/features/diagram/types";
import type { SavedDiagram } from "@/features/diagrams/types";

const AUTOSAVE_DELAY = 1200;

const NEW_DIAGRAM_SOURCE = `flowchart LR

A["Start"] -> B["End"]
`;

interface DiagramPersistenceDeps {
  resetViewport: () => void;
  parse: () => void;
  resetHistory: () => void;
}

export function useDiagramPersistence(state: EditorState, deps: DiagramPersistenceDeps) {
  const { source, document, selectedNodeId, errors } = state;
  const { resetViewport, parse, resetHistory } = deps;

  const diagramsStore = useDiagramsStore();

  const diagramId = ref<string | null>(null);
  const diagramTitle = ref("Untitled Diagram");

  const isSaving = ref(false);
  const lastSavedAt = ref<number | null>(null);

  const isDirty = ref(false);
  const autosaveError = ref<string | null>(null);

  let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let draftSaveTimeout: ReturnType<typeof setTimeout> | null = null;

  let changeVersion = 0;
  let lastSavedChangeVersion = -1;

  let saveQueued = false;
  let draftSaveQueued = false;
  let isSavingDraft = false;
  let draftId: string | null = null;

  let isHydrating = false;

  function ensureDraftId(): string {
    if (draftId === null) {
      draftId = generateDraftId();
    }

    return draftId;
  }

  function scheduleDraftSave() {
    if (draftSaveTimeout !== null) {
      clearTimeout(draftSaveTimeout);
    }

    draftSaveTimeout = setTimeout(() => {
      draftSaveTimeout = null;

      if (!isDirty.value) {
        return;
      }

      void saveDraft();
    }, AUTOSAVE_DELAY);
  }

  function cancelDraftSave() {
    if (draftSaveTimeout !== null) {
      clearTimeout(draftSaveTimeout);
      draftSaveTimeout = null;
    }
  }

  async function saveDraft() {
    if (isSavingDraft) {
      draftSaveQueued = true;
      return;
    }

    if (!isDirty.value) {
      return;
    }

    isSavingDraft = true;

    const versionAtStart = changeVersion;
    const currentDraftId = ensureDraftId();

    try {
      const draft: DiagramDraft = {
        id: currentDraftId,
        diagramId: diagramId.value,
        title: diagramTitle.value,
        source: source.value,
        document: cloneDocument(document.value),
        updatedAt: Date.now(),
      };

      await saveDraftToStorage(draft);

      if (changeVersion === versionAtStart && lastSavedChangeVersion >= versionAtStart) {
        await deleteDraft(currentDraftId);

        if (draftId === currentDraftId) {
          draftId = null;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to save draft:", error);
    } finally {
      isSavingDraft = false;

      if (draftSaveQueued) {
        draftSaveQueued = false;

        if (isDirty.value) {
          scheduleDraftSave();
        }
      }
    }
  }

  async function recoverDraft(draft: DiagramDraft): Promise<boolean> {
    try {
      loadDocument(draft.document, draft.title, draft.source);

      diagramId.value = draft.diagramId;

      draftId = draft.id;
      isDirty.value = true;
      changeVersion += 1;

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to recover draft:", error);
      return false;
    }
  }

  async function discardDraft(draft: DiagramDraft): Promise<boolean> {
    try {
      await deleteDraft(draft.id);

      if (draftId === draft.id) {
        draftId = null;
      }

      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to discard draft:", error);
      return false;
    }
  }

  async function findRecoveryDraft(targetDiagramId: string | null): Promise<DiagramDraft | null> {
    try {
      const drafts = await getAllDrafts();

      return drafts.find((draft) => draft.diagramId === targetDiagramId) ?? null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load drafts:", error);
      return null;
    }
  }

  function markDirty() {
    changeVersion += 1;
    isDirty.value = true;
    autosaveError.value = null;

    scheduleAutosave();
    scheduleDraftSave();
  }

  function scheduleAutosave() {
    if (autosaveTimeout !== null) {
      clearTimeout(autosaveTimeout);
    }

    autosaveTimeout = setTimeout(() => {
      autosaveTimeout = null;

      if (!isDirty.value) {
        return;
      }

      void saveDiagram();
    }, AUTOSAVE_DELAY);
  }

  function cancelAutosave() {
    if (autosaveTimeout !== null) {
      clearTimeout(autosaveTimeout);
      autosaveTimeout = null;
    }
  }

  function createNewDiagram(title = "Untitled Diagram") {
    cancelAutosave();
    cancelDraftSave();

    draftId = null;

    isHydrating = true;

    try {
      diagramId.value = null;
      diagramTitle.value = title;
      lastSavedAt.value = null;
      autosaveError.value = null;
      isDirty.value = false;

      source.value = NEW_DIAGRAM_SOURCE;

      document.value = {
        direction: "LR",
        nodes: [],
        edges: [],
        layout: {},
        sourceMap: {},
      };

      selectedNodeId.value = null;

      resetHistory();
      cancelAutosave();
      cancelDraftSave();
      draftId = null;

      parse();
    } finally {
      isHydrating = false;
    }
  }

  async function saveDiagram() {
    if (isSaving.value) {
      saveQueued = true;
      return;
    }

    isSaving.value = true;
    autosaveError.value = null;

    const versionAtStart = changeVersion;

    try {
      const now = Date.now();
      const id = diagramId.value ?? generateDiagramId();

      const existing = diagramId.value ? await diagramsStore.getById(id) : undefined;

      const diagram: SavedDiagram = {
        id,
        title: diagramTitle.value,
        source: source.value,
        direction: document.value.direction,
        sourceMap: cloneSourceMap(document.value.sourceMap),
        layout: cloneLayout(document.value.layout),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        nodes: document.value.nodes.map((node) => ({ ...node })),
      };

      await diagramsStore.saveDiagram(diagram);

      diagramId.value = id;
      lastSavedAt.value = now;

      if (changeVersion === versionAtStart) {
        lastSavedChangeVersion = versionAtStart;

        isDirty.value = false;
        cancelDraftSave();

        if (draftId !== null) {
          await deleteDraft(draftId);
          draftId = null;
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to save diagram:", error);
      autosaveError.value = "Failed to save diagram.";
    } finally {
      isSaving.value = false;

      if (saveQueued) {
        saveQueued = false;

        if (isDirty.value) {
          void saveDiagram();
        }
      }
    }
  }

  async function loadDiagram(id: string) {
    cancelAutosave();
    cancelDraftSave();

    draftId = null;

    const saved = await diagramsStore.getById(id);

    if (!saved) {
      return false;
    }

    isHydrating = true;

    try {
      diagramId.value = saved.id;
      diagramTitle.value = saved.title;

      source.value = saved.source;

      const previousDocument: DiagramDocument = {
        direction: saved.direction,
        nodes: saved.nodes ?? [],
        edges: [],
        layout: cloneLayout(saved.layout),
        sourceMap: cloneSourceMap(saved.sourceMap),
      };

      const result = parseDiagram(saved.source, previousDocument);

      if (result.errors.length > 0) {
        errors.value = result.errors;
        return false;
      }

      document.value = result.document;

      errors.value = [];
      selectedNodeId.value = null;

      resetHistory();

      lastSavedAt.value = saved.updatedAt;
      isDirty.value = false;
      autosaveError.value = null;

      return true;
    } finally {
      isHydrating = false;
    }
  }

  function loadDocument(
    nextDocument: DiagramDocument,
    title = "Untitled Diagram",
    nextSource?: string,
  ) {
    isHydrating = true;

    try {
      diagramId.value = null;
      diagramTitle.value = title;
      lastSavedAt.value = null;
      autosaveError.value = null;

      document.value = cloneDocument(nextDocument);

      source.value = nextSource ?? serializeDiagram(document.value);

      errors.value = [];
      selectedNodeId.value = null;

      resetHistory();

      resetViewport();

      cancelAutosave();
      cancelDraftSave();

      draftId = null;

      isDirty.value = false;
    } finally {
      isHydrating = false;
    }
  }

  function setDiagramTitle(value: string) {
    const title = value.trim();

    if (!title || diagramTitle.value === title) {
      return;
    }

    diagramTitle.value = title;
    markDirty();
  }

  watch(source, () => {
    if (isHydrating) {
      return;
    }

    markDirty();
  });

  return {
    diagramId,
    diagramTitle,
    isSaving,
    isDirty,
    autosaveError,
    lastSavedAt,
    setDiagramTitle,
    createNewDiagram,
    saveDiagram,
    loadDiagram,
    loadDocument,
    findRecoveryDraft,
    recoverDraft,
    discardDraft,
    markDirty,
  };
}

export type DiagramPersistence = ReturnType<typeof useDiagramPersistence>;
