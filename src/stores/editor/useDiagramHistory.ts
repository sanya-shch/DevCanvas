import { cloneDocument, documentsEqual } from "./cloneHelpers";

import type { HistoryController } from "./useHistoryController";
import type { EditorState } from "./state";

interface DiagramHistoryDeps {
  markDirty: () => void;
  updateSourceFromDocument: () => void;
}

export function useDiagramHistory(
  state: EditorState,
  historyController: HistoryController,
  deps: DiagramHistoryDeps,
) {
  const { document, selectedNodeId, errors } = state;
  const { markDirty, updateSourceFromDocument } = deps;

  function commitDocument(mutate: () => void) {
    const previousDocument = cloneDocument(document.value);

    mutate();

    if (documentsEqual(previousDocument, document.value)) {
      return;
    }

    historyController.push(previousDocument);

    updateSourceFromDocument();
    markDirty();
  }

  let historyTransaction: ReturnType<typeof cloneDocument> | null = null;

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

    historyController.push(previousDocument);
    markDirty();
  }

  function clearSelectionIfMissing() {
    if (
      selectedNodeId.value &&
      !document.value.nodes.some((node) => node.id === selectedNodeId.value)
    ) {
      selectedNodeId.value = null;
    }
  }

  function undo() {
    const currentDocument = cloneDocument(document.value);

    const previousDocument = historyController.undo(currentDocument);

    if (!previousDocument) {
      return;
    }

    document.value = previousDocument;

    updateSourceFromDocument();
    markDirty();

    clearSelectionIfMissing();

    errors.value = [];
  }

  function redo() {
    const currentDocument = cloneDocument(document.value);

    const nextDocument = historyController.redo(currentDocument);

    if (!nextDocument) {
      return;
    }

    document.value = nextDocument;

    updateSourceFromDocument();
    markDirty();

    clearSelectionIfMissing();

    errors.value = [];
  }

  return {
    canUndo: historyController.canUndo,
    canRedo: historyController.canRedo,
    commitDocument,
    beginHistoryTransaction,
    endHistoryTransaction,
    undo,
    redo,
  };
}

export type DiagramHistory = ReturnType<typeof useDiagramHistory>;
