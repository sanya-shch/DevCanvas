import { computed, ref } from "vue";
import { defineStore } from "pinia";

import { parseDiagram } from "@/features/diagram/parser";
import type { DiagramDocument, ParseError } from "@/features/diagram/types";

const DEFAULT_SOURCE = `// DevCanvas

Browser -> API
API -> Database
API -> Cache
`;

export const useEditorStore = defineStore("editor", () => {
  const source = ref(DEFAULT_SOURCE);

  const document = ref<DiagramDocument>({
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

  function parse() {
    const result = parseDiagram(source.value);

    document.value = result.document;
    errors.value = result.errors;
  }

  function setSource(value: string) {
    source.value = value;
    parse();
  }

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId;
  }

  function zoomIn() {
    zoom.value = Math.min(zoom.value + 0.1, 3);
  }

  function zoomOut() {
    zoom.value = Math.max(zoom.value - 0.1, 0.25);
  }

  function resetZoom() {
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

  parse();

  return {
    source,
    document,
    errors,
    zoom,
    offset,
    selectedNodeId,
    hasErrors,
    parse,
    setSource,
    selectNode,
    zoomIn,
    zoomOut,
    resetZoom,
    setOffset,
  };
});
