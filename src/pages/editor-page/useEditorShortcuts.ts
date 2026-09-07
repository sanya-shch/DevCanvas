import { onBeforeUnmount, onMounted } from "vue";

import type { useEditorStore } from "@/stores/editor";

interface EditorShortcutsDeps {
  cancelScheduledParse: () => void;
}

export function useEditorShortcuts(
  store: ReturnType<typeof useEditorStore>,
  deps: EditorShortcutsDeps,
) {
  function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;

    const isEditable =
      target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

    // Let Monaco and inputs handle their own keyboard shortcuts.
    if (isEditable) {
      return;
    }

    const modifier = event.metaKey || event.ctrlKey;

    if (!modifier) {
      if (event.key === "Escape") {
        store.selectNode(null);
      }

      return;
    }

    const key = event.key.toLowerCase();

    /*
     * Undo
     *
     * Cmd/Ctrl + Z
     */
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();

      store.undo();

      return;
    }

    /*
     * Redo
     *
     * Cmd/Ctrl + Shift + Z
     */
    if (key === "z" && event.shiftKey) {
      event.preventDefault();

      store.redo();

      return;
    }

    /*
     * Redo
     *
     * Cmd/Ctrl + Y
     */
    if (key === "y") {
      event.preventDefault();

      store.redo();

      return;
    }

    /*
     * Parse
     *
     * Cmd/Ctrl + Enter
     */
    if (key === "enter") {
      event.preventDefault();

      deps.cancelScheduledParse();
      store.parse();

      return;
    }

    /*
     * Reset viewport
     *
     * Cmd/Ctrl + 0
     */
    if (key === "0") {
      event.preventDefault();

      store.resetViewport();
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });
}
