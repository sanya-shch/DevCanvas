<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";

import { useEditorStore } from "@/stores/editor";
import { getSharedDocument } from "@/features/share/shareUrl";
import DiagramCanvas from "@/components/canvas/DiagramCanvas.vue";

import { fitCanvasToScreen } from "./editor-page/fitCanvasToScreen";

const store = useEditorStore();
const route = useRoute();

/*
 * The embed page has no ThemeSwitcher, so a host page can pick the
 * theme via `?theme=`. This sets the theme for this page only — it
 * intentionally does not go through `useThemeStore().setTheme()`,
 * which persists to localStorage. An embedded iframe changing the
 * visitor's saved theme preference for the main app would be an
 * unwanted side effect.
 */
function applyEmbedTheme() {
  const theme = route.query.theme;

  if (theme === "dark" || theme === "light" || theme === "midnight") {
    document.documentElement.dataset.theme = theme;
  }
}

onMounted(async () => {
  applyEmbedTheme();

  const sharedDocument = getSharedDocument();
  const source = route.query.source;

  if (sharedDocument) {
    store.loadDocument(sharedDocument, "Embedded diagram");
  } else if (typeof source === "string") {
    store.setSource(source);
    store.parse();
  }

  await nextTick();

  fitCanvasToScreen(store);
});
</script>

<template>
  <div class="embed-page">
    <DiagramCanvas readonly />

    <a href="/editor" target="_blank" rel="noopener noreferrer" class="embed-badge">
      Edit on DevCanvas
    </a>
  </div>
</template>

<style scoped>
.embed-page {
  position: relative;

  width: 100vw;
  height: 100vh;

  overflow: hidden;
}

.embed-badge {
  position: absolute;

  right: 10px;
  bottom: 10px;

  z-index: 10;

  padding: 4px 10px;

  border: 1px solid var(--border-color);
  border-radius: 6px;

  background: var(--panel-background);
  color: var(--text-secondary);

  font-size: 11px;
  font-weight: 500;
  text-decoration: none;

  opacity: 0.85;
}

.embed-badge:hover {
  opacity: 1;
}
</style>
