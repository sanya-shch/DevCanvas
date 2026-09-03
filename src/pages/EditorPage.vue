<script setup lang="ts">
import {
  onBeforeUnmount,
  ref,
  watch,
} from 'vue'

import CodeEditor from '@/components/editor/CodeEditor.vue'
import DiagramCanvas from '@/components/canvas/DiagramCanvas.vue'
import NodeInspector from '@/components/canvas/NodeInspector.vue'

import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

const editorWidth = ref(420)

const isDragging = ref(false)

let parseTimer: ReturnType<
  typeof setTimeout
> | null = null

watch(
  () => store.source,
  () => {
    if (parseTimer) {
      clearTimeout(parseTimer)
    }

    parseTimer = setTimeout(() => {
      store.parse()
    }, 250)
  },
)

function startResize(
  event: PointerEvent,
) {
  isDragging.value = true

  window.addEventListener(
    'pointermove',
    resize,
  )

  window.addEventListener(
    'pointerup',
    stopResize,
  )

  event.preventDefault()
}

function resize(
  event: PointerEvent,
) {
  if (!isDragging.value) {
    return
  }

  editorWidth.value = Math.max(
    300,
    Math.min(
      event.clientX,
      window.innerWidth - 400,
    ),
  )
}

function stopResize() {
  isDragging.value = false

  window.removeEventListener(
    'pointermove',
    resize,
  )

  window.removeEventListener(
    'pointerup',
    stopResize,
  )
}

function handleKeyboard(
  event: KeyboardEvent,
) {
  const modifier =
    event.metaKey || event.ctrlKey

  if (modifier && event.key === 'Enter') {
    event.preventDefault()

    store.parse()
  }

  if (modifier && event.key === '0') {
    event.preventDefault()

    store.resetViewport()
  }

  if (event.key === 'Escape') {
    store.selectNode(null)
  }
}

window.addEventListener(
  'keydown',
  handleKeyboard,
)

onBeforeUnmount(() => {
  window.removeEventListener(
    'keydown',
    handleKeyboard,
  )

  if (parseTimer) {
    clearTimeout(parseTimer)
  }
})
</script>

<template>
  <main class="editor-page">
    <header class="toolbar">
      <div class="brand">
        <span class="logo">◆</span>

        <strong>DevCanvas</strong>

        <span class="separator">/</span>

        <span>Untitled diagram</span>
      </div>

      <div class="toolbar-actions">
        <button
          class="toolbar-button"
          @click="store.parse"
        >
          Render
        </button>
      </div>
    </header>

    <section class="workspace">
      <aside
        class="code-panel"
        :style="{
          width: `${editorWidth}px`,
        }"
      >
        <div class="panel-header">
          <span>Source</span>

          <span
            v-if="store.hasErrors"
            class="error-status"
          >
            {{ store.errors.length }} errors
          </span>

          <span
            v-else
            class="success-status"
          >
            Valid
          </span>
        </div>

        <div class="editor-container">
          <CodeEditor
            :model-value="store.source"
            @update:model-value="store.setSource"
          />
        </div>

        <div
          v-if="store.errors.length"
          class="errors"
        >
          <div
            v-for="error in store.errors"
            :key="`${error.line}-${error.message}`"
            class="error"
          >
            <strong>
              Line {{ error.line }}
            </strong>

            <span>
              {{ error.message }}
            </span>
          </div>
        </div>
      </aside>

      <div
        class="resize-handle"
        @pointerdown="startResize"
      />

      <section class="canvas-panel">
        <DiagramCanvas />

        <NodeInspector />
      </section>
    </section>
  </main>
</template>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 52px;
  padding: 0 16px;

  border-bottom: 1px solid var(--border);

  background: var(--surface);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;

  color: var(--text-secondary);
  font-size: 13px;
}

.brand strong {
  color: var(--text-primary);
  font-size: 15px;
}

.logo {
  color: var(--accent);
}

.separator {
  color: var(--border);
}

.toolbar-button {
  border: 0;
  border-radius: 6px;

  padding: 7px 12px;

  background: var(--accent);
  color: white;

  font-size: 13px;
  cursor: pointer;
}

.workspace {
  display: flex;
  flex: 1;
  min-height: 0;
}

.code-panel {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  max-width: 70%;

  border-right: 1px solid var(--border);

  background: var(--editor-bg);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 38px;
  padding: 0 12px;

  border-bottom: 1px solid var(--border);

  color: var(--text-secondary);
  font-size: 12px;
}

.editor-container {
  flex: 1;
  min-height: 0;
}

.error-status {
  color: #ef4444;
}

.success-status {
  color: #22c55e;
}

.errors {
  max-height: 140px;
  overflow: auto;

  border-top: 1px solid var(--border);
  padding: 8px;
}

.error {
  display: flex;
  gap: 8px;

  padding: 4px 0;

  color: #ef4444;
  font-size: 12px;
}

.resize-handle {
  width: 4px;

  background: transparent;

  cursor: col-resize;
}

.resize-handle:hover {
  background: var(--accent);
}

.canvas-panel {
  flex: 1;
  min-width: 0;
}
</style>