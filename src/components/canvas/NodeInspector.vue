<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { useEditorStore } from "@/stores/editor";
import type { NodeShape } from "@/features/diagram/types";

const store = useEditorStore();

// -----------------------------------------------------------------------------
// Selected node
// -----------------------------------------------------------------------------

const node = computed(() => {
  return store.selectedNode;
});

const layout = computed(() => {
  if (!node.value) {
    return null;
  }

  return store.document.layout[node.value.id] ?? null;
});

// -----------------------------------------------------------------------------
// Local form state
// -----------------------------------------------------------------------------

const label = ref("");

const nodeShapes: Array<{
  value: NodeShape;
  label: string;
}> = [
  {
    value: "rectangle",
    label: "Rectangle",
  },
  {
    value: "rounded",
    label: "Rounded",
  },
  {
    value: "circle",
    label: "Circle",
  },
  {
    value: "diamond",
    label: "Diamond",
  },
];

function updateShape(event: Event) {
  if (!node.value) {
    return;
  }

  const shape = (event.target as HTMLSelectElement).value as NodeShape;

  store.updateNodeShape(node.value.id, shape);
}

// -----------------------------------------------------------------------------
// Sync form with selected node
// -----------------------------------------------------------------------------

watch(
  [node, layout],
  () => {
    if (!node.value || !layout.value) {
      label.value = "";

      return;
    }

    label.value = node.value.label;
  },
  {
    immediate: true,
  },
);

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

const canApply = computed(() => {
  return Boolean(node.value && layout.value && label.value.trim());
});

// -----------------------------------------------------------------------------
// Apply
// -----------------------------------------------------------------------------

function applyChanges() {
  if (!node.value || !layout.value) {
    return;
  }

  const nextLabel = label.value.trim();

  if (!nextLabel) {
    return;
  }

  store.updateNodeLabel(node.value.id, nextLabel);
}

// -----------------------------------------------------------------------------
// Delete
// -----------------------------------------------------------------------------

function deleteNode() {
  if (!node.value) {
    return;
  }

  store.deleteNode(node.value.id);
}

// -----------------------------------------------------------------------------
// Keyboard
// -----------------------------------------------------------------------------

function handleKeyDown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();

    applyChanges();
  }
}
</script>

<template>
  <aside class="node-inspector">
    <div v-if="!node || !layout" class="empty-inspector">
      <div class="empty-icon" aria-hidden="true">⬡</div>

      <h3>No node selected</h3>

      <p>Select a node on the canvas to edit its properties.</p>
    </div>

    <template v-else>
      <div class="inspector-header">
        <div>
          <span class="eyebrow"> Node </span>

          <h2>
            {{ node.label }}
          </h2>
        </div>

        <button
          type="button"
          class="close-button"
          title="Deselect node"
          aria-label="Deselect node"
          @click="store.selectNode(null)"
        >
          ×
        </button>
      </div>

      <div class="inspector-content">
        <div class="field">
          <label for="node-id"> Internal ID </label>

          <input id="node-id" :value="node.id" type="text" readonly class="readonly" />
        </div>

        <div class="field">
          <label for="node-label"> Label </label>

          <input
            id="node-label"
            v-model="label"
            type="text"
            autocomplete="off"
            @keydown="handleKeyDown"
          />
        </div>

        <div class="section">
          <div class="section-title">Position</div>

          <div class="field-grid">
            <div class="field">
              <label for="node-x"> X </label>

              <input
                id="node-x"
                :value="Math.round(layout.x)"
                type="number"
                readonly
                class="readonly"
              />
            </div>

            <div class="field">
              <label for="node-y"> Y </label>

              <input
                id="node-y"
                :value="Math.round(layout.y)"
                type="number"
                readonly
                class="readonly"
              />
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Size</div>

          <div class="field-grid">
            <div class="field">
              <label for="node-width"> Width </label>

              <input
                id="node-width"
                :value="Math.round(layout.width)"
                type="number"
                readonly
                class="readonly"
              />
            </div>

            <div class="field">
              <label for="node-height"> Height </label>

              <input
                id="node-height"
                :value="Math.round(layout.height)"
                type="number"
                readonly
                class="readonly"
              />
            </div>
          </div>

          <p class="size-hint">Size is calculated automatically from the label.</p>
        </div>

        <div v-if="node" class="inspector-field">
          <label for="node-shape"> Shape </label>

          <select id="node-shape" :value="node.shape" @change="updateShape">
            <option v-for="shape in nodeShapes" :key="shape.value" :value="shape.value">
              {{ shape.label }}
            </option>
          </select>
        </div>

        <div class="actions">
          <button type="button" class="primary-button" :disabled="!canApply" @click="applyChanges">
            Apply changes
          </button>

          <button type="button" class="danger-button" @click="deleteNode">Delete node</button>
        </div>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.node-inspector {
  display: flex;
  flex-direction: column;

  width: 280px;
  min-width: 280px;
  height: 100%;

  border-left: 1px solid var(--border-color);

  background: var(--panel-background);
  color: var(--text-primary);
}

.empty-inspector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  height: 100%;

  padding: 24px;

  text-align: center;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 48px;
  height: 48px;

  margin-bottom: 16px;

  border-radius: 12px;

  background: var(--hover-background);

  font-size: 22px;
}

.empty-inspector h3 {
  margin: 0 0 8px;

  font-size: 14px;
}

.empty-inspector p {
  max-width: 210px;

  margin: 0;

  color: var(--text-secondary);

  font-size: 12px;
  line-height: 1.5;
}

.inspector-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  padding: 18px 16px;

  border-bottom: 1px solid var(--border-color);
}

.eyebrow {
  display: block;

  margin-bottom: 4px;

  color: var(--text-secondary);

  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.inspector-header h2 {
  margin: 0;

  max-width: 190px;

  overflow: hidden;

  font-size: 15px;
  font-weight: 600;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-button {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 28px;
  height: 28px;

  border: 0;
  border-radius: 6px;

  background: transparent;
  color: var(--text-secondary);

  cursor: pointer;

  font-size: 20px;
}

.close-button:hover {
  background: var(--hover-background);
  color: var(--text-primary);
}

.inspector-content {
  display: flex;
  flex-direction: column;
  gap: 18px;

  padding: 16px;

  overflow-y: auto;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  color: var(--text-secondary);

  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.field label {
  color: var(--text-secondary);

  font-size: 11px;
  font-weight: 500;
}

.field input {
  width: 100%;

  box-sizing: border-box;

  height: 34px;

  padding: 0 9px;

  border: 1px solid var(--border-color);
  border-radius: 6px;

  outline: none;

  background: var(--input-background);
  color: var(--text-primary);

  font: inherit;
  font-size: 12px;

  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;
}

.field input:focus {
  border-color: var(--accent-color);

  box-shadow: 0 0 0 2px var(--accent-color-alpha);
}

.field input.readonly {
  cursor: default;

  background: var(--hover-background);
  color: var(--text-secondary);
}

.size-hint {
  margin: 0;

  color: var(--text-secondary);

  font-size: 10px;
  line-height: 1.4;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  padding-top: 4px;
}

.primary-button,
.danger-button {
  width: 100%;
  height: 36px;

  border-radius: 6px;

  cursor: pointer;

  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

.primary-button {
  border: 1px solid var(--accent-color);

  background: var(--accent-color);
  color: var(--accent-contrast-color);
}

.primary-button:hover:not(:disabled) {
  opacity: 0.9;
}

.primary-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.danger-button {
  border: 1px solid var(--danger-border);

  background: transparent;
  color: var(--danger-color);
}

.danger-button:hover {
  background: var(--danger-background);
}

.field select {
  width: 100%;
  height: 34px;

  padding: 0 10px;

  border: 1px solid var(--border-color);
  border-radius: 6px;

  background: var(--input-background);
  color: var(--text-primary);

  font: inherit;
  font-size: 13px;
}

.field select:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 1px;
}
</style>
