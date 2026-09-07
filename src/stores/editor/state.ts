import { computed, ref } from "vue";

import type { DiagramDocument, ParseError } from "@/features/diagram/types";

const INITIAL_SOURCE = `flowchart LR

Browser[Web Browser] -- HTTP request -> API[REST API]
API -- "SQL query" -> Database(PostgreSQL)
API -- 'cache lookup' -> Redis{Redis Cache}
`;

export function createEditorState() {
  const source = ref(INITIAL_SOURCE);

  const document = ref<DiagramDocument>({
    direction: "LR",
    nodes: [],
    edges: [],
    layout: {},
    sourceMap: {},
  });

  const errors = ref<ParseError[]>([]);

  const selectedNodeId = ref<string | null>(null);

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) {
      return null;
    }

    return document.value.nodes.find((node) => node.id === selectedNodeId.value) ?? null;
  });

  const hasErrors = computed(() => errors.value.length > 0);

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId;
  }

  return {
    source,
    document,
    errors,
    selectedNodeId,
    selectedNode,
    hasErrors,
    selectNode,
  };
}

export type EditorState = ReturnType<typeof createEditorState>;
