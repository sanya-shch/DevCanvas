<script setup lang="ts">
import { computed } from 'vue'

import type {
  DiagramEdge,
  DiagramLayout,
} from '@/features/diagram/types'

const props = defineProps<{
  edge: DiagramEdge
  layout: DiagramLayout
}>()

const from = computed(() => {
  return props.layout[
    props.edge.from
  ]
})

const to = computed(() => {
  return props.layout[
    props.edge.to
  ]
})

const points = computed(() => {
  if (
    !from.value ||
    !to.value
  ) {
    return null
  }

  const fromNode =
    from.value

  const toNode =
    to.value

  const fromCenterX =
    fromNode.x +
    fromNode.width / 2

  const fromCenterY =
    fromNode.y +
    fromNode.height / 2

  const toCenterX =
    toNode.x +
    toNode.width / 2

  const toCenterY =
    toNode.y +
    toNode.height / 2

  const dx =
    toCenterX -
    fromCenterX

  const dy =
    toCenterY -
    fromCenterY

  if (
    Math.abs(dx) >
    Math.abs(dy)
  ) {
    const direction =
      dx > 0 ? 1 : -1

    return {
      x1:
        fromNode.x +
        (direction > 0
          ? fromNode.width
          : 0),

      y1:
        fromCenterY,

      x2:
        toNode.x +
        (direction > 0
          ? 0
          : toNode.width),

      y2:
        toCenterY,
    }
  }

  const direction =
    dy > 0 ? 1 : -1

  return {
    x1:
      fromCenterX,

    y1:
      fromNode.y +
      (direction > 0
        ? fromNode.height
        : 0),

    x2:
      toCenterX,

    y2:
      toNode.y +
      (direction > 0
        ? 0
        : toNode.height),
  }
})

const labelPosition =
  computed(() => {
    if (!points.value) {
      return null
    }

    return {
      x:
        (points.value.x1 +
          points.value.x2) /
        2,

      y:
        (points.value.y1 +
          points.value.y2) /
        2,
    }
  })
</script>

<template>
  <g v-if="points">
    <line
      :x1="points.x1"
      :y1="points.y1"
      :x2="points.x2"
      :y2="points.y2"
      class="diagram-edge"
      marker-end="url(#arrow)"
    />

    <text
      v-if="
        edge.label &&
        labelPosition
      "
      :x="labelPosition.x"
      :y="
        labelPosition.y - 6
      "
      text-anchor="middle"
      class="edge-label"
    >
      {{ edge.label }}
    </text>
  </g>
</template>

<style scoped>
.diagram-edge {
  stroke: var(--edge-color);
  stroke-width: 2;
  fill: none;
  pointer-events: none;
}

.edge-label {
  fill: var(--text-secondary);

  font-size: 11px;

  font-family:
    Inter,
    system-ui,
    sans-serif;

  pointer-events: none;

  /*
   * Creates a small background gap
   * around the text so the edge doesn't
   * visually cross the label.
   */
  paint-order: stroke;
  stroke: var(--canvas-background);
  stroke-width: 6px;
  stroke-linejoin: round;
}
</style>