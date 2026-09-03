<script setup lang="ts">
import {
  computed,
  ref,
} from 'vue'

import DiagramEdge from './DiagramEdge.vue'
import DiagramNode from './DiagramNode.vue'

import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

const canvas = ref<HTMLElement | null>(null)

const isPanning = ref(false)

const lastPointer = ref({
  x: 0,
  y: 0,
})

const transform = computed(
  () => `translate(${store.offset.x} ${store.offset.y}) scale(${store.zoom})`,
)

function startPan(
  event: PointerEvent,
) {
  if (event.button !== 0) return;

  const target =
    event.target as HTMLElement

  if (target.closest('.diagram-node')) return;

  isPanning.value = true

  lastPointer.value = {
    x: event.clientX,
    y: event.clientY,
  }

  canvas.value?.setPointerCapture(event.pointerId)
}

function movePan(
  event: PointerEvent,
) {
  if (!isPanning.value) return;

  const dx = event.clientX - lastPointer.value.x
  const dy = event.clientY - lastPointer.value.y

  store.setOffset(
    store.offset.x + dx,
    store.offset.y + dy,
  )

  lastPointer.value = {
    x: event.clientX,
    y: event.clientY,
  }
}

function stopPan(
  event: PointerEvent,
) {
  isPanning.value = false

  if (
    canvas.value?.hasPointerCapture(
      event.pointerId,
    )
  ) {
    canvas.value.releasePointerCapture(
      event.pointerId,
    )
  }
}

function handleWheel(
  event: WheelEvent,
) {
  event.preventDefault()

  if (!canvas.value) {
    return
  }

  const rect =
    canvas.value.getBoundingClientRect()

  const mouseX =
    event.clientX - rect.left

  const mouseY =
    event.clientY - rect.top

  const oldZoom = store.zoom

  const zoomFactor =
    event.deltaY < 0 ? 1.1 : 0.9

  const newZoom = Math.min(
    Math.max(
      oldZoom * zoomFactor,
      0.2,
    ),
    3,
  )

  const diagramX =
    (mouseX - store.offset.x) /
    oldZoom

  const diagramY =
    (mouseY - store.offset.y) /
    oldZoom

  const newOffsetX =
    mouseX -
    diagramX * newZoom

  const newOffsetY =
    mouseY -
    diagramY * newZoom

  store.updateViewport(
    newZoom,
    {
      x: newOffsetX,
      y: newOffsetY,
    },
  )
}

function fit() {
  if (!canvas.value) return;

  const rect = canvas.value.getBoundingClientRect()

  store.fitToScreen(
    rect.width,
    rect.height,
  )
}

function clearSelection(
  event: MouseEvent,
) {
  if (
    event.target ===
    event.currentTarget
  ) {
    store.selectNode(null)
  }
}
</script>

<template>
  <div
    ref="canvas"
    class="canvas"
    @click="clearSelection"
    @pointerdown="startPan"
    @pointermove="movePan"
    @pointerup="stopPan"
    @pointercancel="stopPan"
    @wheel="handleWheel"
  >
    <svg
      class="diagram"
      width="2000"
      height="1200"
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
      </defs>

      <g :transform="transform">
        <DiagramEdge
          v-for="edge in store.document.edges"
          :key="edge.id"
          :edge="edge"
          :nodes="store.document.nodes"
        />

        <DiagramNode
          v-for="node in store.document.nodes"
          :key="node.id"
          :node="node"
          :selected="
            store.selectedNodeId === node.id
          "
          @select="store.selectNode"
        />
      </g>
    </svg>

    <div
      class="zoom-controls"
      @pointerdown.stop
      @pointermove.stop
      @pointerup.stop
    >
      <button
        title="Zoom out"
        @click.stop="store.zoomOut"
      >
        −
      </button>

      <span>
        {{ Math.round(store.zoom * 100) }}%
      </span>

      <button
        title="Zoom in"
        @click.stop="store.zoomIn"
      >
        +
      </button>

      <button
        title="Fit diagram"
        @click.stop="fit"
      >
        Fit
      </button>
    </div>
  </div>
</template>

<style scoped>
.canvas {
  position: relative;
  width: 100%;
  height: 100%;

  overflow: hidden;

  background:
    radial-gradient(
      circle,
      var(--grid-dot) 1px,
      transparent 1px
    );

  background-size: 24px 24px;

  cursor: grab;
}

.canvas:active {
  cursor: grabbing;
}

.diagram {
  width: 100%;
  height: 100%;
}

.zoom-controls {
  position: absolute;
  right: 16px;
  bottom: 16px;

  display: flex;
  align-items: center;
  gap: 4px;

  padding: 6px;

  border: 1px solid var(--border);
  border-radius: 8px;

  background: var(--surface);
  box-shadow: 0 4px 20px rgb(0 0 0 / 10%);
}

.zoom-controls button {
  border: 0;
  border-radius: 5px;
  padding: 5px 9px;

  background: transparent;
  color: var(--text-primary);

  cursor: pointer;
}

.zoom-controls button:hover {
  background: var(--surface-hover);
}

.zoom-controls span {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
}

.arrow-head {
  fill: var(--edge-color);
}
</style>