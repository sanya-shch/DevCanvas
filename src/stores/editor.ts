import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { parseDiagram } from "@/features/diagram/parser";
import { serializeDiagram } from "@/features/diagram/serializer";
import { calculateNodeSize } from "@/features/diagram/nodeSizing";

import type { DiagramDocument, ParseError } from "@/features/diagram/types";

const INITIAL_SOURCE = `flowchart LR

Browser["Web Browser"] -- "HTTP request" -> API["REST API"]
API -- "SQL query" -> Database["PostgreSQL"]
API -- "cache lookup" -> Redis["Redis Cache"]
`;

const INITIAL_ZOOM = 1;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

export const useEditorStore = defineStore("editor", () => {
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
    const node = document.value.nodes.find((item) => item.id === nodeId);

    if (!node) {
      return;
    }

    const nextLabel = label.trim();

    if (!nextLabel) {
      return;
    }

    node.label = nextLabel;

    /*
     * Label changes automatically change
     * the node dimensions.
     *
     * Position remains untouched.
     */
    const layout = document.value.layout[nodeId];

    if (layout) {
      const size = calculateNodeSize(nextLabel);

      layout.width = size.width;

      layout.height = size.height;
    }

    updateSourceFromDocument();
  }

  // ---------------------------------------------------------------------------
  // Delete node
  // ---------------------------------------------------------------------------

  function deleteNode(nodeId: string) {
    document.value.nodes = document.value.nodes.filter((node) => node.id !== nodeId);

    document.value.edges = document.value.edges.filter(
      (edge) => edge.from !== nodeId && edge.to !== nodeId,
    );

    delete document.value.layout[nodeId];

    /*
     * Remove the source identifier
     * from sourceMap.
     */
    for (const [sourceId, internalId] of Object.entries(document.value.sourceMap)) {
      if (internalId === nodeId) {
        delete document.value.sourceMap[sourceId];
      }
    }

    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null;
    }

    updateSourceFromDocument();
  }

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
  };
});
