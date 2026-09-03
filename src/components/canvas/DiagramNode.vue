<script setup lang="ts">
import type { DiagramNode } from '@/features/diagram/types'

const props = defineProps<{
  node: DiagramNode
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  dragStart: [
    event: PointerEvent,
    node: DiagramNode,
  ]
}>()

function handlePointerDown(
  event: PointerEvent,
) {
  event.stopPropagation()

  emit(
    'select',
    props.node.id,
  )

  emit(
    'dragStart',
    event,
    props.node,
  )
}
</script>

<template>
  <g
    class="diagram-node"
    :class="{ selected }"
    @pointerdown="handlePointerDown"
  >
    <rect
      :x="node.x"
      :y="node.y"
      :width="node.width"
      :height="node.height"
      rx="10"
    />

    <text
      :x="node.x + node.width / 2"
      :y="node.y + node.height / 2"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ node.label }}
    </text>
  </g>
</template>

<style scoped>
.diagram-node {
  cursor: move;
}

.diagram-node rect {
  fill: var(--node-bg);
  stroke: var(--node-border);
  stroke-width: 2;
}

.diagram-node:hover rect {
  stroke: var(--accent);
}

.diagram-node.selected rect {
  stroke: var(--accent);
  stroke-width: 3;
}

.diagram-node text {
  fill: var(--text-primary);

  font-size: 14px;
  font-family:
    Inter,
    system-ui,
    sans-serif;

  pointer-events: none;
  user-select: none;
}
</style>