<script setup lang="ts">
import {
  nextTick,
  ref,
} from 'vue'

import {
  useEditorStore,
} from '@/stores/editor'

import {
  wrapNodeLabel,
} from '@/features/diagram/nodeSizing'

import type {
  DiagramNode,
} from '@/features/diagram/types'

const props = defineProps<{
  node: DiagramNode
  layout: {
    x: number
    y: number
    width: number
    height: number
  }
  selected: boolean
}>()

const emit = defineEmits<{
  select: [nodeId: string]
  dragStart: [
    event: PointerEvent,
    nodeId: string,
  ]
}>()

const store =
  useEditorStore()

const isEditing =
  ref(false)

const draftLabel =
  ref('')

const inputRef =
  ref<HTMLInputElement | null>(
    null,
  )

const labelLines =
  () =>
    wrapNodeLabel(
      props.node.label,
      props.layout.width,
    )

function handlePointerDown(
  event: PointerEvent,
) {
  if (isEditing.value) {
    return
  }

  event.stopPropagation()

  emit(
    'select',
    props.node.id,
  )

  emit(
    'dragStart',
    event,
    props.node.id,
  )
}

async function startEditing(
  event: MouseEvent,
) {
  event.preventDefault()
  event.stopPropagation()

  emit(
    'select',
    props.node.id,
  )

  draftLabel.value =
    props.node.label

  isEditing.value = true

  await nextTick()

  inputRef.value?.focus()
  inputRef.value?.select()
}

function cancelEditing() {
  isEditing.value = false
  draftLabel.value =
    props.node.label
}

function commitEditing() {
  const nextLabel =
    draftLabel.value.trim()

  if (!nextLabel) {
    cancelEditing()
    return
  }

  if (
    nextLabel !==
    props.node.label
  ) {
    store.updateNodeLabel(
      props.node.id,
      nextLabel,
    )
  }

  isEditing.value = false
}

function handleInputKeyDown(
  event: KeyboardEvent,
) {
  if (event.key === 'Enter') {
    event.preventDefault()

    commitEditing()

    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()

    cancelEditing()
  }
}
</script>

<template>
  <g
    class="diagram-node"
    :class="{
      selected,
      editing: isEditing,
    }"
    :transform="`translate(${layout.x}, ${layout.y})`"
    @pointerdown="handlePointerDown"
    @dblclick="startEditing"
  >
    <rect
      :width="layout.width"
      :height="layout.height"
      rx="8"
    />

    <text
      v-if="!isEditing"
      :x="layout.width / 2"
      :y="
        layout.height / 2 -
        (labelLines().length - 1) * 10
      "
      text-anchor="middle"
      dominant-baseline="middle"
    >
      <tspan
        v-for="(
          line,
          index
        ) in labelLines()"
        :key="index"
        :x="layout.width / 2"
        :dy="
          index === 0
            ? 0
            : 20
        "
      >
        {{ line }}
      </tspan>
    </text>

    <foreignObject
      v-if="isEditing"
      x="8"
      y="8"
      :width="
        Math.max(
          layout.width - 16,
          20,
        )
      "
      :height="
        Math.max(
          layout.height - 16,
          20,
        )
      "
      @pointerdown.stop
      @dblclick.stop
    >
      <input
        ref="inputRef"
        v-model="draftLabel"
        class="node-label-input"
        type="text"
        autocomplete="off"
        @pointerdown.stop
        @keydown="handleInputKeyDown"
        @blur="commitEditing"
      />
    </foreignObject>
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

.diagram-node:hover rect,
.diagram-node.selected rect {
  stroke: var(--accent-color);
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

.diagram-node.editing {
  cursor: text;
}

.node-label-input {
  width: 100%;
  height: 100%;

  box-sizing: border-box;

  padding: 6px 8px;

  border: 1px solid var(--accent);
  border-radius: 5px;

  outline: none;

  background: var(--input-background);
  color: var(--text-primary);

  font: inherit;
  font-size: 14px;

  text-align: center;
}
</style>