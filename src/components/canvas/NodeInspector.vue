<script setup lang="ts">
import {
  computed,
  ref,
  watch,
} from 'vue'

import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

const label = ref('')
const width = ref(140)
const height = ref(60)

const node = computed(
  () => store.selectedNode,
)

watch(
  node,
  (value) => {
    if (!value) {
      return
    }

    label.value = value.label
    width.value = value.width
    height.value = value.height
  },
  {
    immediate: true,
  },
)

function applyChanges() {
  if (!node.value) {
    return
  }

  store.updateNode(
    node.value.id,
    {
      label: label.value,
      width: Math.max(
        60,
        width.value,
      ),
      height: Math.max(
        40,
        height.value,
      ),
    },
  )
}

function removeNode() {
  if (!node.value) {
    return
  }

  store.deleteNode(
    node.value.id,
  )
}
</script>

<template>
  <aside
    v-if="node"
    class="inspector"
  >
    <div class="inspector-header">
      <strong>Node</strong>

      <button
        class="close-button"
        @click="store.selectNode(null)"
      >
        ×
      </button>
    </div>

    <div class="field">
      <label>ID</label>

      <input
        :value="node.id"
        disabled
      />
    </div>

    <div class="field">
      <label>Label</label>

      <input
        v-model="label"
        @keydown.enter="applyChanges"
      />
    </div>

    <div class="field-row">
      <div class="field">
        <label>Width</label>

        <input
          v-model.number="width"
          type="number"
          min="60"
          @keydown.enter="applyChanges"
        />
      </div>

      <div class="field">
        <label>Height</label>

        <input
          v-model.number="height"
          type="number"
          min="40"
          @keydown.enter="applyChanges"
        />
      </div>
    </div>

    <button
      class="apply-button"
      @click="applyChanges"
    >
      Apply changes
    </button>

    <button
      class="delete-button"
      @click="removeNode"
    >
      Delete node
    </button>
  </aside>
</template>

<style scoped>
.inspector {
  position: absolute;

  top: 16px;
  right: 16px;

  width: 240px;

  padding: 14px;

  border: 1px solid var(--border);
  border-radius: 10px;

  background: var(--surface);

  box-shadow:
    0 10px 40px rgb(0 0 0 / 20%);
}

.inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 16px;
}

.close-button {
  border: 0;

  background: transparent;
  color: var(--text-secondary);

  font-size: 20px;

  cursor: pointer;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  margin-bottom: 12px;
}

.field-row {
  display: flex;
  gap: 8px;
}

.field-row .field {
  flex: 1;
}

label {
  color: var(--text-secondary);

  font-size: 11px;
}

input {
  width: 100%;

  border: 1px solid var(--border);
  border-radius: 5px;

  padding: 7px 8px;

  outline: none;

  background: var(--editor-bg);
  color: var(--text-primary);

  font-size: 12px;
}

input:focus {
  border-color: var(--accent);
}

.apply-button,
.delete-button {
  width: 100%;

  border: 0;
  border-radius: 6px;

  padding: 8px;

  cursor: pointer;
}

.apply-button {
  background: var(--accent);
  color: white;
}

.delete-button {
  margin-top: 8px;

  background: transparent;
  color: #ef4444;
}

.delete-button:hover {
  background: rgb(239 68 68 / 10%);
}
</style>