import { computed, ref } from "vue";

import { History } from "@/features/diagram/history";

import type { DiagramDocument } from "@/features/diagram/types";

const HISTORY_LIMIT = 100;

export function useHistoryController() {
  const history = new History<DiagramDocument>(HISTORY_LIMIT);

  const version = ref(0);

  function notifyChange() {
    version.value += 1;
  }

  const canUndo = computed(() => {
    void version.value;

    return history.canUndo;
  });

  const canRedo = computed(() => {
    void version.value;

    return history.canRedo;
  });

  function push(previousDocument: DiagramDocument) {
    history.push(previousDocument);
    notifyChange();
  }

  function undo(currentDocument: DiagramDocument): DiagramDocument | null {
    const previousDocument = history.undo(currentDocument);

    if (previousDocument) {
      notifyChange();
    }

    return previousDocument;
  }

  function redo(currentDocument: DiagramDocument): DiagramDocument | null {
    const nextDocument = history.redo(currentDocument);

    if (nextDocument) {
      notifyChange();
    }

    return nextDocument;
  }

  function clear() {
    history.clear();
    notifyChange();
  }

  return {
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    clear,
  };
}

export type HistoryController = ReturnType<typeof useHistoryController>;
