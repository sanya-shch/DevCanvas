<script setup lang="ts">
import { computed } from 'vue'

import type {
  DiagramEdge,
  DiagramNode,
} from '@/features/diagram/types'

const props = defineProps<{
  edge: DiagramEdge
  nodes: DiagramNode[]
}>()

const coordinates = computed(() => {
  const from = props.nodes.find(
    (node) =>
      node.id === props.edge.from,
  )

  const to = props.nodes.find(
    (node) =>
      node.id === props.edge.to,
  )

  if (!from || !to) {
    return null
  }

  const fromCenterX =
    from.x + from.width / 2

  const fromCenterY =
    from.y + from.height / 2

  const toCenterX =
    to.x + to.width / 2

  const toCenterY =
    to.y + to.height / 2

  const dx =
    toCenterX - fromCenterX

  const dy =
    toCenterY - fromCenterY

  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x1:
        dx > 0
          ? from.x + from.width
          : from.x,

      y1: fromCenterY,

      x2:
        dx > 0
          ? to.x
          : to.x + to.width,

      y2: toCenterY,
    }
  }

  return {
    x1: fromCenterX,

    y1:
      dy > 0
        ? from.y + from.height
        : from.y,

    x2: toCenterX,

    y2:
      dy > 0
        ? to.y
        : to.y + to.height,
  }
})
</script>

<template>
  <line
    v-if="coordinates"
    :x1="coordinates.x1"
    :y1="coordinates.y1"
    :x2="coordinates.x2"
    :y2="coordinates.y2"
    class="diagram-edge"
    marker-end="url(#arrow)"
  />
</template>

<style scoped>
.diagram-edge {
  stroke: var(--edge-color);
  stroke-width: 2;
  fill: none;
  pointer-events: none;
}
</style>