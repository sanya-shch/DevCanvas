<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  watch,
} from 'vue'

import { useEditorStore } from '@/stores/editor'

import CodeEditor from '@/components/editor/CodeEditor.vue'
import DiagramCanvas from '@/components/canvas/DiagramCanvas.vue'
import NodeInspector from '@/components/canvas/NodeInspector.vue'

const store = useEditorStore()

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

onMounted(async () => {
  store.parse()

  await nextTick()

  /*
   * Give the canvas a moment to render before calculating
   * the initial viewport.
   */
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

function handleKeyDown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null

  const isEditable =
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable

  /*
   * Do not intercept shortcuts while typing in
   * Monaco, inputs or textareas.
   */
  if (isEditable) {
    return
  }

  const modifier =
    event.metaKey || event.ctrlKey

  if (
    modifier &&
    event.key === 'Enter'
  ) {
    event.preventDefault()

    if (parseTimeout !== null) {
      clearTimeout(parseTimeout)
      parseTimeout = null
    }

    store.parse()

    return
  }

  if (
    modifier &&
    event.key === '0'
  ) {
    event.preventDefault()

    store.resetViewport()

    return
  }

  if (event.key === 'Escape') {
    store.selectNode(null)
  }
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
      <div class="editor-title">
        <div class="logo">
          D
        </div>

        <div>
          <h1>
            DevCanvas
          </h1>

          <span>
            Diagram Editor
          </span>
        </div>
      </div>

      <div class="editor-actions">
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

.editor-title {
  display: flex;
  align-items: center;

  gap: 10px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  border-radius: 7px;

  background: var(--accent-color);
  color: var(--accent-contrast-color);

  font-size: 14px;
  font-weight: 700;
}

.editor-title h1 {
  margin: 0;

  font-size: 14px;
  font-weight: 600;
}

.editor-title span {
  display: block;

  margin-top: 1px;

  color: var(--text-secondary);

  font-size: 10px;
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