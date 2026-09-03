<script setup lang="ts">
import type { DiagramNode } from '@/features/diagram/types'

defineProps<{
  node: DiagramNode
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <g
    class="diagram-node"
    :class="{ selected }"
    @click.stop="emit('select', node.id)"
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
  cursor: pointer;
}

.diagram-node rect {
  fill: var(--node-bg);
  stroke: var(--node-border);
  stroke-width: 2;
}

.diagram-node.selected rect {
  stroke: var(--accent);
  stroke-width: 3;
}

.diagram-node text {
  fill: var(--text-primary);
  font-size: 14px;
  font-family: Inter, system-ui, sans-serif;
  pointer-events: none;
}
</style>