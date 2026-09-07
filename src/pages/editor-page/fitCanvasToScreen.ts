import type { useEditorStore } from "@/stores/editor";

/**
 * Measures the rendered `.diagram-canvas` element and asks the store
 * to fit the viewport to it. Used both after the initial diagram
 * load and after recovering a crash-recovery draft.
 */
export function fitCanvasToScreen(store: ReturnType<typeof useEditorStore>) {
  requestAnimationFrame(() => {
    const canvas = document.querySelector(".diagram-canvas");

    if (!(canvas instanceof HTMLElement)) {
      return;
    }

    store.fitToScreen(canvas.clientWidth, canvas.clientHeight);
  });
}
