<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

import { useEditorStore } from '@/stores/editor'

import DiagramNode from './DiagramNode.vue'
import DiagramEdge from './DiagramEdge.vue'

const store = useEditorStore()

const canvasRef =
  ref<SVGSVGElement | null>(null)

const viewportRef =
  ref<HTMLElement | null>(null)

const isDraggingNode =
  ref(false)

const draggingNodeId =
  ref<string | null>(null)

const dragStart = ref({
  x: 0,
  y: 0,
})

const nodeStart = ref({
  x: 0,
  y: 0,
})

let activePointerId:
  | number
  | null = null

const isPanning =
  ref(false)

const panStart = ref({
  x: 0,
  y: 0,
})

const panStartOffset = ref({
  x: 0,
  y: 0,
})

const transform = computed(() => {
  return `
    translate(${store.offset.x} ${store.offset.y})
    scale(${store.zoom})
  `
})

function moveNode(
  event: PointerEvent,
) {
  if (
    !isDraggingNode.value ||
    !draggingNodeId.value
  ) {
    return
  }

  const dx =
    (event.clientX -
      dragStart.value.x) /
    store.zoom

  const dy =
    (event.clientY -
      dragStart.value.y) /
    store.zoom

  store.updateNodePosition(
    draggingNodeId.value,
    nodeStart.value.x + dx,
    nodeStart.value.y + dy,
  )
}

function stopNodeDrag(
  event?: PointerEvent,
) {
  if (
    event &&
    activePointerId !== null &&
    event.pointerId !==
      activePointerId
  ) {
    return
  }

  if (
    event &&
    canvasRef.value?.hasPointerCapture(
      event.pointerId,
    )
  ) {
    try {
      canvasRef.value.releasePointerCapture(
        event.pointerId,
      )
    } catch {
      // Pointer capture may already be released.
    }
  }

  isDraggingNode.value = false
  draggingNodeId.value = null
  activePointerId = null
}

function startPan(
  event: PointerEvent,
) {
  if (event.button !== 0) {
    return
  }

  if (
    event.target !==
    event.currentTarget
  ) {
    return
  }

  event.preventDefault()

  isPanning.value = true

  panStart.value = {
    x: event.clientX,
    y: event.clientY,
  }

  panStartOffset.value = {
    x: store.offset.x,
    y: store.offset.y,
  }

  activePointerId =
    event.pointerId

  try {
    canvasRef.value?.setPointerCapture(
      event.pointerId,
    )
  } catch {
    // Pointer capture is not critical.
  }
}

function movePan(
  event: PointerEvent,
) {
  if (!isPanning.value) {
    return
  }

  const dx =
    event.clientX -
    panStart.value.x

  const dy =
    event.clientY -
    panStart.value.y

  store.setOffset(
    panStartOffset.value.x +
      dx,
    panStartOffset.value.y +
      dy,
  )
}

function stopPan(
  event?: PointerEvent,
) {
  if (
    event &&
    activePointerId !== null &&
    event.pointerId !==
      activePointerId
  ) {
    return
  }

  if (
    event &&
    canvasRef.value?.hasPointerCapture(
      event.pointerId,
    )
  ) {
    try {
      canvasRef.value.releasePointerCapture(
        event.pointerId,
      )
    } catch {
      // Pointer capture may already be released.
    }
  }

  isPanning.value = false
  activePointerId = null
}

function handlePointerMove(
  event: PointerEvent,
) {
  if (isDraggingNode.value) {
    moveNode(event)
    return
  }

  if (isPanning.value) {
    movePan(event)
  }
}

function handlePointerUp(
  event: PointerEvent,
) {
  if (isDraggingNode.value) {
    stopNodeDrag(event)
    return
  }

  if (isPanning.value) {
    stopPan(event)
  }
}

function handlePointerCancel(
  event: PointerEvent,
) {
  if (isDraggingNode.value) {
    stopNodeDrag(event)
    return
  }

  if (isPanning.value) {
    stopPan(event)
  }
}

function startNodeDrag(
  event: PointerEvent,
  nodeId: string,
) {
  if (event.button !== 0) {
    return
  }

  const layout =
    store.document.layout[nodeId]

  if (!layout) {
    return
  }

  event.preventDefault()
  event.stopPropagation()

  isDraggingNode.value = true
  draggingNodeId.value = nodeId

  activePointerId =
    event.pointerId

  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
  }

  nodeStart.value = {
    x: layout.x,
    y: layout.y,
  }

  store.selectNode(nodeId)

  try {
    canvasRef.value?.setPointerCapture(
      event.pointerId,
    )
  } catch {
    // Pointer capture is not critical.
  }
}

function handleNodePointerDown(
  event: PointerEvent,
  nodeId: string,
) {
  if (event.button !== 0) {
    return
  }

  store.selectNode(nodeId)

  isDraggingNode.value = true
  draggingNodeId.value = nodeId
  activePointerId = event.pointerId

  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
  }

  const layout = store.document.layout[nodeId]

  if (!layout) {
    return
  }

  nodeStart.value = {
    x: layout.x,
    y: layout.y,
  }

  const target = event.currentTarget

  if (target instanceof Element) {
    target.setPointerCapture(event.pointerId)
  }
}

function handleCanvasClick(
  event: MouseEvent,
) {
  if (
    event.target ===
    event.currentTarget
  ) {
    store.selectNode(null)
  }
}

function zoomAtPoint(
  newZoom: number,
  clientX: number,
  clientY: number,
) {
  const svg =
    canvasRef.value

  if (!svg) {
    store.setZoom(newZoom)
    return
  }

  const rect =
    svg.getBoundingClientRect()

  const mouseX =
    clientX - rect.left

  const mouseY =
    clientY - rect.top

  const oldZoom =
    store.zoom

  const worldX =
    (mouseX -
      store.offset.x) /
    oldZoom

  const worldY =
    (mouseY -
      store.offset.y) /
    oldZoom

  store.setZoom(newZoom)

  const actualZoom =
    store.zoom

  store.setOffset(
    mouseX -
      worldX * actualZoom,

    mouseY -
      worldY * actualZoom,
  )
}

function handleWheel(
  event: WheelEvent,
) {
  event.preventDefault()

  const zoomFactor =
    event.deltaY > 0
      ? 0.9
      : 1.1

  const newZoom =
    store.zoom * zoomFactor

  zoomAtPoint(
    newZoom,
    event.clientX,
    event.clientY,
  )
}

async function fitToScreen() {
  await nextTick()

  const viewport =
    viewportRef.value

  if (!viewport) {
    return
  }

  store.fitToScreen(
    viewport.clientWidth,
    viewport.clientHeight,
  )
}

function handleKeyDown(
  event: KeyboardEvent,
) {
  const target =
    event.target as HTMLElement | null

  const isInput =
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.isContentEditable

  if (isInput) {
    return
  }

  const modifier =
    event.metaKey ||
    event.ctrlKey

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

  stopNodeDrag()
  stopPan()
})
</script>

<template>
  <div
    ref="viewportRef"
    class="diagram-canvas"
  >
    <div
      class="zoom-controls"
      @pointerdown.stop
      @pointermove.stop
      @pointerup.stop
      @wheel.stop
    >
      <button
        type="button"
        title="Zoom out"
        @click="store.zoomOut()"
      >
        −
      </button>

      <span class="zoom-value">
        {{ Math.round(store.zoom * 100) }}%
      </span>

      <button
        type="button"
        title="Zoom in"
        @click="store.zoomIn()"
      >
        +
      </button>

      <button
        type="button"
        title="Fit diagram"
        @click="fitToScreen"
      >
        Fit
      </button>
    </div>

    <svg
      ref="canvasRef"
      class="diagram-svg"
      @pointerdown="startPan"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
      @wheel="handleWheel"
      @click="handleCanvasClick"
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            class="arrow-head"
          />
        </marker>

        <pattern
          id="grid"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
          :patternTransform="
            `translate(${store.offset.x % 24} ${store.offset.y % 24})`
          "
        >
          <circle
            cx="1"
            cy="1"
            r="1"
            class="grid-dot"
          />
        </pattern>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill="url(#grid)"
        pointer-events="none"
      />

      <g
        :transform="transform"
      >
        <DiagramEdge
          v-for="edge in store.document.edges"
          :key="edge.id"
          :edge="edge"
          :layout="store.document.layout"
        />

        <DiagramNode
          v-for="node in store.document.nodes"
          :key="node.id"
          :node="node"
          :layout="store.document.layout[node.id]"
          :selected="
            store.selectedNodeId === node.id
          "
          @select="store.selectNode"
          @drag-start="startNodeDrag"
          @pointerdown.stop="handleNodePointerDown($event, node.id)"
        />
      </g>
    </svg>

    <div
      v-if="!store.document.nodes.length"
      class="empty-state"
    >
      <p>No nodes yet</p>

      <span>
        Create a diagram in the editor
      </span>
    </div>

    <div
      v-if="store.hasErrors"
      class="error-panel"
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
  </div>
</template>

<style scoped>
.diagram-canvas {
  position: relative;

  width: 100%;
  height: 100%;

  min-width: 0;
  min-height: 0;

  overflow: hidden;

  background: var(--canvas-background);

  touch-action: none;
  user-select: none;
}

.diagram-svg {
  display: block;

  width: 100%;
  height: 100%;

  cursor: grab;
}

.diagram-svg:active {
  cursor: grabbing;
}

.arrow-head {
  fill: var(--edge-color);
}

.grid-dot {
  fill: var(--grid-color);
}

.zoom-controls {
  position: absolute;

  top: 16px;
  right: 16px;

  z-index: 10;

  display: flex;
  align-items: center;

  gap: 4px;

  padding: 4px;

  border: 1px solid var(--border-color);
  border-radius: 8px;

  background: var(--panel-background);
  box-shadow: var(--panel-shadow);
}

.zoom-controls button {
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: 32px;
  height: 32px;

  padding: 0 8px;

  border: 0;
  border-radius: 6px;

  background: transparent;
  color: var(--text-primary);

  cursor: pointer;

  font: inherit;
}

.zoom-controls button:hover {
  background: var(--hover-background);
}

.zoom-value {
  min-width: 52px;

  text-align: center;

  color: var(--text-secondary);

  font-size: 12px;
}

.empty-state {
  position: absolute;
  inset: 0;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  pointer-events: none;

  color: var(--text-secondary);
}

.empty-state p {
  margin: 0 0 4px;

  color: var(--text-primary);

  font-size: 16px;
  font-weight: 600;
}

.empty-state span {
  font-size: 13px;
}

.error-panel {
  position: absolute;

  left: 16px;
  right: 16px;
  bottom: 16px;

  z-index: 10;

  display: flex;
  flex-direction: column;

  gap: 8px;

  max-height: 180px;

  overflow: auto;

  padding: 12px;

  border: 1px solid var(--error-border);
  border-radius: 8px;

  background: var(--error-background);
}

.error {
  display: flex;

  gap: 8px;

  font-size: 12px;
}

.error strong {
  flex-shrink: 0;

  color: var(--error-color);
}

.error span {
  color: var(--text-secondary);
}
</style>