import { calculateNodeSize } from "@/features/diagram/nodeSizing";

import type { EditorState } from "./state";
import type { NodeShape } from "@/features/diagram/types";

interface DocumentEditingDeps {
  commitDocument: (mutate: () => void) => void;
}

export function useDocumentEditing(state: EditorState, deps: DocumentEditingDeps) {
  const { document, selectedNodeId } = state;
  const { commitDocument } = deps;

  function updateNodePosition(nodeId: string, x: number, y: number) {
    const currentLayout = document.value.layout[nodeId];

    if (!currentLayout) {
      return;
    }

    if (currentLayout.x === x && currentLayout.y === y) {
      return;
    }

    document.value.layout[nodeId] = {
      ...currentLayout,
      x,
      y,
    };
  }

  function updateNodeShape(nodeId: string, shape: NodeShape) {
    const node = document.value.nodes.find((item) => item.id === nodeId);

    if (!node || node.shape === shape) {
      return;
    }

    commitDocument(() => {
      node.shape = shape;

      const layout = document.value.layout[nodeId];

      if (!layout) {
        return;
      }

      const size = calculateNodeSize(node.label, shape);

      layout.width = size.width;
      layout.height = size.height;
    });
  }

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

      const size = calculateNodeSize(nextLabel, node.shape);

      if (node.shape === "circle") {
        const dimension = Math.max(size.width, size.height);

        layout.width = dimension;
        layout.height = dimension;
      } else {
        layout.width = size.width;
        layout.height = size.height;
      }
    });
  }

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

  return {
    updateNodePosition,
    updateNodeShape,
    updateNodeLabel,
    deleteNode,
  };
}

export type DocumentEditing = ReturnType<typeof useDocumentEditing>;
