import { onBeforeUnmount, watch } from "vue";

import type { useEditorStore } from "@/stores/editor";

const PARSE_DEBOUNCE_DELAY = 250;

export function useDiagramAutoParse(store: ReturnType<typeof useEditorStore>) {
  let parseTimeout: ReturnType<typeof setTimeout> | null = null;

  function scheduleParse() {
    if (parseTimeout !== null) {
      clearTimeout(parseTimeout);
    }

    parseTimeout = setTimeout(() => {
      store.parse();
      parseTimeout = null;
    }, PARSE_DEBOUNCE_DELAY);
  }

  function cancelScheduledParse() {
    if (parseTimeout !== null) {
      clearTimeout(parseTimeout);
      parseTimeout = null;
    }
  }

  watch(() => store.source, scheduleParse);

  onBeforeUnmount(cancelScheduledParse);

  return {
    cancelScheduledParse,
  };
}
