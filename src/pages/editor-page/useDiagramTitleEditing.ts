import { nextTick, ref } from "vue";

import type { useEditorStore } from "@/stores/editor";

export function useDiagramTitleEditing(store: ReturnType<typeof useEditorStore>) {
  const isEditingTitle = ref(false);
  const editingTitle = ref("");

  function startEditingTitle() {
    editingTitle.value = store.diagramTitle;
    isEditingTitle.value = true;

    void nextTick(() => {
      const input = document.querySelector(".diagram-title-input");

      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
    });
  }

  function finishEditingTitle() {
    if (!isEditingTitle.value) {
      return;
    }

    const title = editingTitle.value.trim();

    if (title) {
      store.setDiagramTitle(title);
    } else {
      editingTitle.value = store.diagramTitle;
    }

    isEditingTitle.value = false;
  }

  return {
    isEditingTitle,
    editingTitle,
    startEditingTitle,
    finishEditingTitle,
  };
}
