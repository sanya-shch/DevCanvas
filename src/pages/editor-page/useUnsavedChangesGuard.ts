import { onBeforeUnmount, onMounted } from "vue";

import type { useEditorStore } from "@/stores/editor";

export function useUnsavedChangesGuard(store: ReturnType<typeof useEditorStore>) {
  function confirmDiscardChanges(): boolean {
    if (!store.isDirty) {
      return true;
    }

    return window.confirm("You have unsaved changes. Are you sure you want to discard them?");
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!store.isDirty) {
      return;
    }

    event.preventDefault();
    event.returnValue = "";
  }

  onMounted(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  });

  return {
    confirmDiscardChanges,
  };
}
