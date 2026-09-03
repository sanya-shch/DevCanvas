import { computed, ref } from "vue";

import { defineStore } from "pinia";

import { parseDiagram } from "@/features/diagram/parser";

import type { DiagramDocument, ParseError } from "@/features/diagram/types";

const DEFAULT_SOURCE = `// DevCanvas example

flowchart TD

Browser -> API
API -> Database
API -> Redis
`;

export const useEditorStore = defineStore("editor", () => {
  const source = ref(DEFAULT_SOURCE);

  const document = ref<DiagramDocument>({
    direction: "TD",
    nodes: [],
    edges: [],
  });

  const errors = ref<ParseError[]>([]);

  const zoom = ref(1);

  const offset = ref({
    x: 0,
    y: 0,
  });

  const selectedNodeId = ref<string | null>(null);

  const hasErrors = computed(() => errors.value.length > 0);

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) {
      return null;
    }

    return document.value.nodes.find((node) => node.id === selectedNodeId.value) ?? null;
  });

  function parse() {
    const result = parseDiagram(source.value);

    document.value = result.document;

    errors.value = result.errors;

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

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId;
  }

  function setZoom(value: number) {
    zoom.value = Math.min(Math.max(value, 0.2), 3);
  }

  function zoomIn() {
    setZoom(Number((zoom.value + 0.1).toFixed(2)));
  }

  function zoomOut() {
    setZoom(Number((zoom.value - 0.1).toFixed(2)));
  }

  function resetViewport() {
    zoom.value = 1;

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

  function updateViewport(
    nextZoom: number,
    nextOffset: {
      x: number;
      y: number;
    },
  ) {
    zoom.value = nextZoom;

    offset.value = nextOffset;
  }

  function fitToScreen(viewportWidth: number, viewportHeight: number) {
    const nodes = document.value.nodes;

    if (!nodes.length) {
      resetViewport();
      return;
    }

    const minX = Math.min(...nodes.map((node) => node.x));
    const minY = Math.min(...nodes.map((node) => node.y));

    const maxX = Math.max(...nodes.map((node) => node.x + node.width));
    const maxY = Math.max(...nodes.map((node) => node.y + node.height));

    const width = maxX - minX;
    const height = maxY - minY;

    const padding = 100;

    const scaleX = (viewportWidth - padding) / width;
    const scaleY = (viewportHeight - padding) / height;

    const nextZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.2), 2);

    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    const diagramCenterX = minX + width / 2;
    const diagramCenterY = minY + height / 2;

    const nextOffset = {
      x: centerX - diagramCenterX * nextZoom,
      y: centerY - diagramCenterY * nextZoom,
    };

    updateViewport(nextZoom, nextOffset);
  }

  function updateNodePosition(nodeId: string, x: number, y: number) {
    const node = document.value.nodes.find((item) => item.id === nodeId);

    if (!node) {
      return;
    }

    node.x = x;
    node.y = y;
  }

  function updateNode(
    nodeId: string,
    updates: Partial<{
      label: string;
      width: number;
      height: number;
    }>,
  ) {
    const node = document.value.nodes.find((item) => item.id === nodeId);

    if (!node) {
      return;
    }

    Object.assign(node, updates);
  }

  function deleteNode(nodeId: string) {
    document.value.nodes = document.value.nodes.filter((node) => node.id !== nodeId);

    document.value.edges = document.value.edges.filter(
      (edge) => edge.from !== nodeId && edge.to !== nodeId,
    );

    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null;
    }
  }

  parse();

  return {
    source,
    document,
    errors,
    zoom,
    offset,
    selectedNodeId,
    selectedNode,
    hasErrors,

    parse,
    setSource,
    selectNode,

    setZoom,
    zoomIn,
    zoomOut,

    resetViewport,
    setOffset,
    updateViewport,
    fitToScreen,

    updateNodePosition,
    updateNode,
    deleteNode,
  };
});
