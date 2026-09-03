<script setup lang="ts">
import type {
  DiagramEdge,
  DiagramNode,
} from '@/features/diagram/types'

const props = defineProps<{
  edge: DiagramEdge
  nodes: DiagramNode[]
}>()

function getNode(id: string) {
  return props.nodes.find((node) => node.id === id)
}

function getCoordinates() {
  const from = getNode(props.edge.from)
  const to = getNode(props.edge.to)

  if (!from || !to) {
    return null
  }

  return {
    x1: from.x + from.width / 2,
    y1: from.y + from.height,
    x2: to.x + to.width / 2,
    y2: to.y,
  }
}
</script>

<template>
  <template v-if="getCoordinates()">
    <line
      v-bind="{
        x1: getCoordinates()!.x1,
        y1: getCoordinates()!.y1,
        x2: getCoordinates()!.x2,
        y2: getCoordinates()!.y2,
      }"
      class="diagram-edge"
      marker-end="url(#arrow)"
    />
  </template>
</template>

<style scoped>
.diagram-edge {
  stroke: var(--edge-color);
  stroke-width: 2;
  fill: none;
}
</style>