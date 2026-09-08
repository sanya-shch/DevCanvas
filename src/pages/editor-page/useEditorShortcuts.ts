import { onBeforeUnmount, onMounted, ref } from "vue";

import type { useEditorStore } from "@/stores/editor";

interface EditorShortcutsDeps {
  cancelScheduledParse: () => void;
}

export function useEditorShortcuts(
  store: ReturnType<typeof useEditorStore>,
  deps: EditorShortcutsDeps,
) {
  const isHelpOpen = ref(false);

  function openHelp() {
    isHelpOpen.value = true;
  }

  function closeHelp() {
    isHelpOpen.value = false;
  }

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
      /*
       * Close the help overlay first if it's open, so Escape
       * always means "close whatever is on top" rather than also
       * deselecting the node underneath it.
       */
      if (event.key === "Escape") {
        if (isHelpOpen.value) {
          closeHelp();
        } else {
          store.selectNode(null);
        }

        return;
      }

      /*
       * Delete selected node
       *
       * Delete / Backspace
       */
      if (event.key === "Delete" || event.key === "Backspace") {
        if (store.selectedNodeId) {
          event.preventDefault();

          store.deleteNode(store.selectedNodeId);
        }

        return;
      }

      /*
       * Shortcuts help overlay
       *
       * ?
       */
      if (event.key === "?") {
        event.preventDefault();

        openHelp();
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

  return {
    isHelpOpen,
    openHelp,
    closeHelp,
  };
}
