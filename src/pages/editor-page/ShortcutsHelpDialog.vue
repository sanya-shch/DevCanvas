<script setup lang="ts">
import { EDITOR_SHORTCUTS } from "@/pages/editor-page/shortcuts";

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div class="shortcuts-help-backdrop" role="presentation" @click.self="emit('close')">
      <section
        class="shortcuts-help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-help-title"
      >
        <div class="shortcuts-help-dialog__header">
          <h2 id="shortcuts-help-title">Keyboard shortcuts</h2>

          <button
            type="button"
            class="shortcuts-help-dialog__close"
            aria-label="Close keyboard shortcuts"
            autofocus
            @click="emit('close')"
          >
            ×
          </button>
        </div>

        <dl class="shortcuts-help-dialog__list">
          <div
            v-for="shortcut in EDITOR_SHORTCUTS"
            :key="shortcut.id"
            class="shortcuts-help-dialog__row"
          >
            <dt>
              <kbd>{{ shortcut.keys }}</kbd>
            </dt>

            <dd>{{ shortcut.description }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.shortcuts-help-backdrop {
  position: fixed;
  inset: 0;

  z-index: 1000;

  display: grid;
  place-items: center;

  padding: 24px;

  background: rgb(0 0 0 / 45%);
  backdrop-filter: blur(4px);
}

.shortcuts-help-dialog {
  width: min(440px, 100%);
  max-height: min(560px, 80vh);

  overflow-y: auto;

  padding: 24px;

  border: 1px solid var(--border-color);
  border-radius: 14px;

  background: var(--panel-background);
  color: var(--text-primary);

  box-shadow: var(--panel-shadow);
}

.shortcuts-help-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  margin-bottom: 16px;
}

.shortcuts-help-dialog__header h2 {
  margin: 0;

  font-size: 18px;
}

.shortcuts-help-dialog__close {
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

.shortcuts-help-dialog__close:hover {
  background: var(--hover-background);
  color: var(--text-primary);
}

.shortcuts-help-dialog__list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  margin: 0;
}

.shortcuts-help-dialog__row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 16px;
}

.shortcuts-help-dialog__row dt {
  flex-shrink: 0;
}

.shortcuts-help-dialog__row dd {
  margin: 0;

  color: var(--text-secondary);

  font-size: 13px;

  text-align: right;
}

kbd {
  padding: 3px 8px;

  border: 1px solid var(--border-color);
  border-radius: 6px;

  background: var(--hover-background);
  color: var(--text-primary);

  font-family: inherit;
  font-size: 12px;
  font-weight: 500;

  white-space: nowrap;
}
</style>
