import { ref } from "vue";

import type { useEditorStore } from "@/stores/editor";
import type { DiagramDraft } from "@/features/drafts/types";

interface DraftRecoveryDeps {
  onRecovered: () => void;
}

/**
 * Crash-recovery draft flow: checking whether an unsaved draft
 * exists for the current diagram, and recovering or discarding it.
 */
export function useDraftRecovery(store: ReturnType<typeof useEditorStore>, deps: DraftRecoveryDeps) {
  const recoveryDraft = ref<DiagramDraft | null>(null);
  const isRecoveringDraft = ref(false);

  async function checkForRecoveryDraft(diagramId: string | null) {
    const draft = await store.findRecoveryDraft(diagramId);

    if (!draft) {
      return;
    }

    recoveryDraft.value = draft;
  }

  async function handleRecoverDraft() {
    const draft = recoveryDraft.value;

    if (!draft || isRecoveringDraft.value) {
      return;
    }

    isRecoveringDraft.value = true;

    try {
      const recovered = await store.recoverDraft(draft);

      if (recovered) {
        recoveryDraft.value = null;

        deps.onRecovered();
      }
    } finally {
      isRecoveringDraft.value = false;
    }
  }

  async function handleDiscardDraft() {
    const draft = recoveryDraft.value;

    if (!draft) {
      return;
    }

    const discarded = await store.discardDraft(draft);

    if (discarded) {
      recoveryDraft.value = null;
    }
  }

  return {
    recoveryDraft,
    isRecoveringDraft,
    checkForRecoveryDraft,
    handleRecoverDraft,
    handleDiscardDraft,
  };
}
