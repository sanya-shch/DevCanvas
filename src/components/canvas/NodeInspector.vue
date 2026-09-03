<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
</script>

<template>
  <aside
    v-if="store.selectedNode"
    class="inspector"
  >
    <div class="inspector-header">
      <strong>Node</strong>

      <button
        @click="store.selectNode(null)"
      >
        ×
      </button>
    </div>

    <div class="field">
      <label>ID</label>

      <input
        :value="store.selectedNode.id"
        disabled
      />
    </div>

    <div class="field">
      <label>Label</label>

      <input
        :value="store.selectedNode.label"
        disabled
      />
    </div>

    <div class="field-row">
      <div class="field">
        <label>X</label>

        <input
          :value="
            Math.round(
              store.selectedNode.x,
            )
          "
          disabled
        />
      </div>

      <div class="field">
        <label>Y</label>

        <input
          :value="
            Math.round(
              store.selectedNode.y,
            )
          "
          disabled
        />
      </div>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Width</label>

        <input
          :value="
            store.selectedNode.width
          "
          disabled
        />
      </div>

      <div class="field">
        <label>Height</label>

        <input
          :value="
            store.selectedNode.height
          "
          disabled
        />
      </div>
    </div>
  </aside>
</template>

<style scoped>
.inspector {
  position: absolute;

  top: 16px;
  right: 16px;

  width: 220px;

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

.inspector-header button {
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

  background: var(--editor-bg);
  color: var(--text-primary);

  font-size: 12px;
}
</style>