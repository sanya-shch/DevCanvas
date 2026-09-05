import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { parseDiagram } from "@/features/diagram/parser";
import { serializeDiagram } from "@/features/diagram/serializer";
import { calculateNodeSize } from "@/features/diagram/nodeSizing";
import { History } from "@/features/diagram/history";
import { useDiagramsStore } from "./diagrams";
import { generateDiagramId } from "@/features/diagrams/diagramStorage";

import type {
  DiagramDocument,
  DiagramLayout,
  DiagramSourceMap,
  ParseError,
} from "@/features/diagram/types";
import type { SavedDiagram } from "@/features/diagrams/types";

const INITIAL_SOURCE = `flowchart LR

Browser[Web Browser] -- HTTP request -> API[REST API]
API -- "SQL query" -> Database(PostgreSQL)
API -- 'cache lookup' -> Redis{Redis Cache}
`;

const INITIAL_ZOOM = 1;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

const HISTORY_LIMIT = 100;

export const useEditorStore = defineStore("editor", () => {
  const diagramId = ref<string | null>(null);
  const diagramTitle = ref("Untitled Diagram");
  const isSaving = ref(false);
  const lastSavedAt = ref<number | null>(null);

  const diagramsStore = useDiagramsStore();

  function createNewDiagram(title = "Untitled Diagram") {
    diagramId.value = null;
    diagramTitle.value = title;
    lastSavedAt.value = null;

    source.value = `flowchart LR

A["Start"] -> B["End"]
`;

    document.value = {
      direction: "LR",
      nodes: [],
      edges: [],
      layout: {},
      sourceMap: {},
    };

    selectedNodeId.value = null;

    history.clear();
    notifyHistoryChange();

    parse();
  }

  async function saveDiagram() {
    if (isSaving.value) {
      return;
    }

    isSaving.value = true;

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
      };

      await diagramsStore.saveDiagram(diagram);

      diagramId.value = id;
      lastSavedAt.value = now;
    } finally {
      isSaving.value = false;
    }
  }

  function cloneLayout(layout: DiagramLayout): DiagramLayout {
    return Object.fromEntries(
      Object.entries(layout).map(([nodeId, value]) => [nodeId, { ...value }]),
    );
  }

  async function loadDiagram(id: string) {
    const saved = await diagramsStore.getById(id);

    if (!saved) {
      return false;
    }

    diagramId.value = saved.id;
    diagramTitle.value = saved.title;

    source.value = saved.source;

    const previousDocument: DiagramDocument = {
      direction: saved.direction,
      nodes: [],
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

    history.clear();
    notifyHistoryChange();

    lastSavedAt.value = saved.updatedAt;

    return true;
  }

  function cloneSourceMap(sourceMap: DiagramSourceMap): DiagramSourceMap {
    return {
      ...sourceMap,
    };
  }

  // ---------------------------------------------------------------------------
  // Document
  // ---------------------------------------------------------------------------

  const source = ref(INITIAL_SOURCE);

  const document = ref<DiagramDocument>({
    direction: "LR",
    nodes: [],
    edges: [],
    layout: {},
    sourceMap: {},
  });

  const errors = ref<ParseError[]>([]);

  // ---------------------------------------------------------------------------
  // Viewport
  // ---------------------------------------------------------------------------

  const zoom = ref(INITIAL_ZOOM);

  const offset = ref({
    x: 0,
    y: 0,
  });

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  const selectedNodeId = ref<string | null>(null);

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) {
      return null;
    }

    return document.value.nodes.find((node) => node.id === selectedNodeId.value) ?? null;
  });

  const hasErrors = computed(() => errors.value.length > 0);

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  const history = new History<DiagramDocument>(HISTORY_LIMIT);

  function cloneDocument(value: DiagramDocument): DiagramDocument {
    return JSON.parse(JSON.stringify(value)) as DiagramDocument;
  }

  function documentsEqual(first: DiagramDocument, second: DiagramDocument): boolean {
    return JSON.stringify(first) === JSON.stringify(second);
  }

  function commitDocument(mutate: () => void) {
    const previousDocument = cloneDocument(document.value);

    mutate();

    if (documentsEqual(previousDocument, document.value)) {
      return;
    }

    history.push(previousDocument);
    notifyHistoryChange();

    updateSourceFromDocument();
  }

  let historyTransaction: DiagramDocument | null = null;

  function beginHistoryTransaction() {
    if (historyTransaction !== null) {
      return;
    }

    historyTransaction = cloneDocument(document.value);
  }

  function endHistoryTransaction() {
    if (historyTransaction === null) {
      return;
    }

    const previousDocument = historyTransaction;

    historyTransaction = null;

    if (documentsEqual(previousDocument, document.value)) {
      return;
    }

    history.push(previousDocument);
    notifyHistoryChange();
  }

  // ---------------------------------------------------------------------------
  // Parsing
  // ---------------------------------------------------------------------------

  function parse() {
    const result = parseDiagram(source.value, document.value);

    /*
     * Do not replace the visual document with
     * a partially parsed invalid document.
     *
     * This makes typing in Monaco much nicer:
     * the canvas keeps the last valid state.
     */
    if (result.errors.length > 0) {
      errors.value = result.errors;

      return;
    }

    document.value = result.document;

    errors.value = [];

    if (
      selectedNodeId.value &&
      !result.document.nodes.some((node) => node.id === selectedNodeId.value)
    ) {
      selectedNodeId.value = null;
    }
  }

  function setSource(value: string) {
    source.value = value;
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId;
  }

  // ---------------------------------------------------------------------------
  // Zoom
  // ---------------------------------------------------------------------------

  function setZoom(value: number) {
    zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }

  function zoomIn() {
    setZoom(zoom.value + 0.1);
  }

  function zoomOut() {
    setZoom(zoom.value - 0.1);
  }

  // ---------------------------------------------------------------------------
  // Viewport
  // ---------------------------------------------------------------------------

  function resetViewport() {
    zoom.value = INITIAL_ZOOM;

    offset.value = {
      x: 0,
      y: 0,
    };
  }

  function setOffset(x: number, y: number) {
    offset.value = {
      x,
      y,
    };
  }

  function updateViewport(deltaX: number, deltaY: number) {
    offset.value = {
      x: offset.value.x + deltaX,
      y: offset.value.y + deltaY,
    };
  }

  function fitToScreen(width: number, height: number, padding = 80) {
    const nodes = document.value.nodes;

    if (!nodes.length) {
      resetViewport();
      return;
    }

    const layouts = nodes.map((node) => document.value.layout[node.id]).filter(Boolean);

    if (!layouts.length) {
      resetViewport();
      return;
    }

    const minX = Math.min(...layouts.map((layout) => layout.x));

    const minY = Math.min(...layouts.map((layout) => layout.y));

    const maxX = Math.max(...layouts.map((layout) => layout.x + layout.width));

    const maxY = Math.max(...layouts.map((layout) => layout.y + layout.height));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    if (contentWidth <= 0 || contentHeight <= 0) {
      resetViewport();
      return;
    }

    const availableWidth = Math.max(width - padding * 2, 1);

    const availableHeight = Math.max(height - padding * 2, 1);

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;

    const newZoom = Math.min(scaleX, scaleY, MAX_ZOOM);

    setZoom(Math.max(MIN_ZOOM, newZoom));

    const scaledWidth = contentWidth * zoom.value;
    const scaledHeight = contentHeight * zoom.value;

    offset.value = {
      x: (width - scaledWidth) / 2 - minX * zoom.value,

      y: (height - scaledHeight) / 2 - minY * zoom.value,
    };
  }

  // ---------------------------------------------------------------------------
  // Document → Source
  // ---------------------------------------------------------------------------

  function updateSourceFromDocument() {
    source.value = serializeDiagram(document.value);
  }

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  function updateNodePosition(nodeId: string, x: number, y: number) {
    const currentLayout = document.value.layout[nodeId];

    if (!currentLayout) {
      return;
    }

    document.value.layout[nodeId] = {
      ...currentLayout,
      x,
      y,
    };
  }

  // ---------------------------------------------------------------------------
  // Semantic node updates
  // ---------------------------------------------------------------------------

  function updateNodeLabel(nodeId: string, label: string) {
    const nextLabel = label.trim();

    if (!nextLabel) {
      return;
    }

    const node = document.value.nodes.find((item) => item.id === nodeId);

    if (!node || node.label === nextLabel) {
      return;
    }

    commitDocument(() => {
      node.label = nextLabel;

      const layout = document.value.layout[nodeId];

      if (!layout) {
        return;
      }

      const size = calculateNodeSize(nextLabel);

      layout.width = size.width;
      layout.height = size.height;
    });
  }

  // ---------------------------------------------------------------------------
  // Delete node
  // ---------------------------------------------------------------------------

  function deleteNode(nodeId: string) {
    const nodeExists = document.value.nodes.some((node) => node.id === nodeId);

    if (!nodeExists) {
      return;
    }

    commitDocument(() => {
      document.value.nodes = document.value.nodes.filter((node) => node.id !== nodeId);

      document.value.edges = document.value.edges.filter(
        (edge) => edge.from !== nodeId && edge.to !== nodeId,
      );

      delete document.value.layout[nodeId];

      for (const [sourceId, internalId] of Object.entries(document.value.sourceMap)) {
        if (internalId === nodeId) {
          delete document.value.sourceMap[sourceId];
        }
      }

      if (selectedNodeId.value === nodeId) {
        selectedNodeId.value = null;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Undo / Redo
  // ---------------------------------------------------------------------------

  function undo() {
    const currentDocument = cloneDocument(document.value);
    const previousDocument = history.undo(currentDocument);

    if (!previousDocument) {
      return;
    }

    document.value = previousDocument;

    updateSourceFromDocument();
    notifyHistoryChange();

    if (
      selectedNodeId.value &&
      !document.value.nodes.some((node) => node.id === selectedNodeId.value)
    ) {
      selectedNodeId.value = null;
    }

    errors.value = [];
  }

  function redo() {
    const currentDocument = cloneDocument(document.value);
    const nextDocument = history.redo(currentDocument);

    if (!nextDocument) {
      return;
    }

    document.value = nextDocument;

    updateSourceFromDocument();
    notifyHistoryChange();

    if (
      selectedNodeId.value &&
      !document.value.nodes.some((node) => node.id === selectedNodeId.value)
    ) {
      selectedNodeId.value = null;
    }

    errors.value = [];
  }

  const historyVersion = ref(0);

  function notifyHistoryChange() {
    historyVersion.value += 1;
  }

  const canUndo = computed(() => {
    historyVersion.value;

    return history.canUndo;
  });

  const canRedo = computed(() => {
    historyVersion.value;

    return history.canRedo;
  });

  return {
    // document
    source,
    document,
    errors,

    // viewport
    zoom,
    offset,

    // selection
    selectedNodeId,
    selectedNode,
    hasErrors,

    // parsing
    parse,
    setSource,

    // selection
    selectNode,

    // zoom
    setZoom,
    zoomIn,
    zoomOut,

    // viewport
    resetViewport,
    setOffset,
    updateViewport,
    fitToScreen,

    // document/source synchronization
    updateSourceFromDocument,

    // visual updates
    updateNodePosition,

    // semantic updates
    updateNodeLabel,

    // node management
    deleteNode,

    // history
    canUndo,
    canRedo,
    undo,
    redo,
    beginHistoryTransaction,
    endHistoryTransaction,

    diagramId,
    diagramTitle,
    isSaving,
    lastSavedAt,

    createNewDiagram,
    saveDiagram,
    loadDiagram,
  };
});
