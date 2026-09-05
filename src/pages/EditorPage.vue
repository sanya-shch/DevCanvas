<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  watch,
} from 'vue'
import {
  useRoute,
  useRouter,
} from 'vue-router'

import { useEditorStore } from '@/stores/editor'

import CodeEditor from '@/components/editor/CodeEditor.vue'
import DiagramCanvas from '@/components/canvas/DiagramCanvas.vue'
import NodeInspector from '@/components/canvas/NodeInspector.vue'

const store = useEditorStore()
const route = useRoute()
const router = useRouter()

let parseTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleParse() {
  if (parseTimeout !== null) {
    clearTimeout(parseTimeout)
  }

  parseTimeout = setTimeout(() => {
    store.parse()
    parseTimeout = null
  }, 250)
}

watch(
  () => store.source,
  () => {
    scheduleParse()
  },
)

watch(
  () => store.diagramId,
  (id) => {
    if (!id || route.query.id === id) {
      return
    }

    void router.replace({
      query: {
        ...route.query,
        id,
      },
    })
  },
)

onMounted(async () => {
  const id = route.query.id
  const source = route.query.source

  if (typeof id === 'string') {
    await store.loadDiagram(id)
  } else if (typeof source === 'string') {
    store.setSource(source)
    store.parse()
  } else {
    store.createNewDiagram()
  }

  await nextTick()

  requestAnimationFrame(() => {
    const canvas = document.querySelector(
      '.diagram-canvas',
    )

    if (!(canvas instanceof HTMLElement)) {
      return
    }

    store.fitToScreen(
      canvas.clientWidth,
      canvas.clientHeight,
    )
  })
})

function handleKeyDown(
  event: KeyboardEvent,
) {
  const target =
    event.target as HTMLElement | null;

  const isEditable =
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable;

  /*
   * Let Monaco and inputs handle their own
   * keyboard shortcuts.
   */
  if (isEditable) {
    return;
  }

  const modifier =
    event.metaKey ||
    event.ctrlKey;

  if (!modifier) {
    if (event.key === 'Escape') {
      store.selectNode(null);
    }

    return;
  }

  const key =
    event.key.toLowerCase();

  /*
   * Undo
   *
   * Cmd/Ctrl + Z
   */
  if (
    key === 'z' &&
    !event.shiftKey
  ) {
    event.preventDefault();

    store.undo();

    return;
  }

  /*
   * Redo
   *
   * Cmd/Ctrl + Shift + Z
   */
  if (
    key === 'z' &&
    event.shiftKey
  ) {
    event.preventDefault();

    store.redo();

    return;
  }

  /*
   * Redo
   *
   * Cmd/Ctrl + Y
   */
  if (key === 'y') {
    event.preventDefault();

    store.redo();

    return;
  }

  /*
   * Parse
   *
   * Cmd/Ctrl + Enter
   */
  if (key === 'enter') {
    event.preventDefault();

    if (parseTimeout !== null) {
      clearTimeout(parseTimeout);
      parseTimeout = null;
    }

    store.parse();

    return;
  }

  /*
   * Reset viewport
   *
   * Cmd/Ctrl + 0
   */
  if (key === '0') {
    event.preventDefault();

    store.resetViewport();
  }
}

async function handleCreateNewDiagram() {
  await router.replace({
    path: '/editor',
  })

  store.createNewDiagram()
}

onMounted(() => {
  window.addEventListener(
    'keydown',
    handleKeyDown,
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
    'keydown',
    handleKeyDown,
  )

  if (parseTimeout !== null) {
    clearTimeout(parseTimeout)
    parseTimeout = null
  }
})
</script>

<template>
  <main class="editor-page">
    <header class="editor-header">
      <RouterLink
        to="/"
        class="brand"
      >
        <span class="brand-mark">
          ◆
        </span>

        <span class="brand-name">
          DevCanvas
        </span>
      </RouterLink>

      <div class="editor-actions">
        <button
          type="button"
          class="header-button"
          :disabled="!store.canUndo"
          title="Undo (Cmd/Ctrl + Z)"
          @click="store.undo"
        >
          Undo
        </button>

        <button
          type="button"
          class="header-button"
          :disabled="!store.canRedo"
          title="Redo (Cmd/Ctrl + Shift + Z)"
          @click="store.redo"
        >
          Redo
        </button>

        <div class="save-status">
          <span
            v-if="store.autosaveError"
            class="save-status__error"
          >
            {{ store.autosaveError }}
          </span>

          <span
            v-else-if="store.isSaving"
            class="save-status__saving"
          >
            Saving...
          </span>

          <span
            v-else-if="store.isDirty"
            class="save-status__dirty"
          >
            Unsaved changes
          </span>

          <span
            v-else-if="store.lastSavedAt"
            class="save-status__saved"
          >
            Saved
          </span>
        </div>

        <button
          type="button"
          class="header-button"
          :disabled="store.isSaving || !store.isDirty"
          @click="store.saveDiagram"
        >
          Save
        </button>

        <button
          type="button"
          class="header-button"
          @click="handleCreateNewDiagram"
        >
          New
        </button>

        <button
          type="button"
          class="header-button"
          title="Parse diagram (Cmd/Ctrl + Enter)"
          @click="store.parse"
        >
          Parse
        </button>

        <button
          type="button"
          class="header-button"
          title="Reset viewport (Cmd/Ctrl + 0)"
          @click="store.resetViewport"
        >
          Reset view
        </button>
      </div>
    </header>

    <section class="editor-layout">
      <!-- Code -->
      <section class="panel code-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="panel-indicator code-indicator" />

            <span>
              Code
            </span>
          </div>

          <span class="panel-hint">
            Cmd/Ctrl + Enter to parse
          </span>
        </div>

        <div class="panel-content">
          <CodeEditor v-model="store.source" />
        </div>
      </section>

      <!-- Canvas -->
      <section class="panel canvas-panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="panel-indicator canvas-indicator" />

            <span>
              Visual Editor
            </span>
          </div>

          <span
            v-if="store.hasErrors"
            class="status error"
          >
            {{ store.errors.length }}
            {{ store.errors.length === 1 ? 'error' : 'errors' }}
          </span>

          <span
            v-else
            class="status success"
          >
            Valid
          </span>
        </div>

        <div class="panel-content">
          <DiagramCanvas />
        </div>
      </section>

      <!-- Inspector -->
      <section class="panel inspector-panel">
        <NodeInspector />
      </section>
    </section>

    <footer class="editor-footer">
      <div class="footer-left">
        <span>
          {{ store.document.nodes.length }}
          {{ store.document.nodes.length === 1 ? 'node' : 'nodes' }}
        </span>

        <span class="footer-separator">
          •
        </span>

        <span>
          {{ store.document.edges.length }}
          {{ store.document.edges.length === 1 ? 'edge' : 'edges' }}
        </span>
      </div>

      <div class="footer-right">
        <span>
          {{ Math.round(store.zoom * 100) }}%
        </span>

        <span class="footer-separator">
          •
        </span>

        <span>
          {{ store.document.direction }}
        </span>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;

  width: 100%;
  height: 100vh;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  background: var(--app-background);
  color: var(--text-primary);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  flex-shrink: 0;

  height: 56px;

  padding: 0 16px;

  border-bottom: 1px solid var(--border-color);

  background: var(--panel-background);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  color: var(--text-primary);
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;

  width: 28px;
  height: 28px;

  border-radius: 7px;

  background: var(--accent-color);
  color: white;

  font-size: 14px;
  font-weight: 700;
}

.brand-name {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.editor-actions {
  display: flex;
  align-items: center;

  gap: 6px;
}

.header-button {
  height: 32px;

  padding: 0 10px;

  border: 1px solid var(--border-color);
  border-radius: 6px;

  background: transparent;
  color: var(--text-secondary);

  cursor: pointer;

  font: inherit;
  font-size: 11px;
  font-weight: 500;
}

.header-button:hover {
  background: var(--hover-background);
  color: var(--text-primary);
}

.editor-layout {
  display: grid;

  grid-template-columns:
    minmax(280px, 1fr)
    minmax(400px, 2fr)
    280px;

  flex: 1;

  min-width: 0;
  min-height: 0;

  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;

  min-width: 0;
  min-height: 0;

  background: var(--panel-background);
}

.panel + .panel {
  border-left: 1px solid var(--border-color);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  flex-shrink: 0;

  height: 38px;

  padding: 0 12px;

  border-bottom: 1px solid var(--border-color);

  background: var(--panel-background);
}

.panel-title {
  display: flex;
  align-items: center;

  gap: 7px;

  font-size: 11px;
  font-weight: 600;
}

.panel-indicator {
  width: 6px;
  height: 6px;

  border-radius: 50%;
}

.code-indicator {
  background: var(--accent-color);
}

.canvas-indicator {
  background: var(--success-color);
}

.panel-hint {
  color: var(--text-secondary);

  font-size: 9px;
}

.panel-content {
  flex: 1;

  min-width: 0;
  min-height: 0;

  overflow: hidden;
}

.code-panel .panel-content {
  display: flex;
}

.code-panel :deep(.code-editor) {
  flex: 1;

  min-width: 0;
  min-height: 0;
}

.canvas-panel .panel-content {
  position: relative;
}

.inspector-panel {
  min-width: 280px;
}

.status {
  font-size: 10px;
  font-weight: 500;
}

.status.success {
  color: var(--success-color);
}

.status.error {
  color: var(--error-color);
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  flex-shrink: 0;

  height: 28px;

  padding: 0 12px;

  border-top: 1px solid var(--border-color);

  background: var(--panel-background);

  color: var(--text-secondary);

  font-size: 10px;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;

  gap: 7px;
}

.footer-separator {
  opacity: 0.5;
}

.header-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.save-status {
  display: inline-flex;
  align-items: center;
  min-width: 110px;

  color: var(--text-secondary);

  font-size: 12px;
  white-space: nowrap;
}

.save-status__saving {
  color: var(--text-secondary);
}

.save-status__dirty {
  color: var(--text-secondary);
}

.save-status__saved {
  color: var(--success-color);
}

.save-status__error {
  color: var(--error-color);
}

@media (max-width: 1100px) {
  .editor-layout {
    grid-template-columns:
      minmax(240px, 1fr)
      minmax(360px, 1.5fr)
      260px;
  }

  .inspector-panel {
    display: flex;
  }

  .inspector-panel
    :deep(.node-inspector) {
    width: 260px;
    min-width: 260px;
  }
}

@media (max-width: 720px) {
  .editor-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 45% 55%;
  }

  .code-panel {
    border-bottom: 1px solid var(--border-color);
  }

  .canvas-panel {
    border-left: 0;
  }

  .panel + .panel {
    border-left: 0;
  }

  .panel-hint {
    display: none;
  }

  .inspector-panel {
    display: none;
  }
}
</style>