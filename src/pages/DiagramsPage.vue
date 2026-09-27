<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { useDiagramsStore } from "@/stores/diagrams";
import { describeStorageError } from "@/features/storage/storageError";

const router = useRouter();
const diagramsStore = useDiagramsStore();

const deleteError = ref<string | null>(null);

onMounted(() => {
  diagramsStore.loadDiagrams();
});

function openDiagram(id: string) {
  router.push({
    path: "/editor",
    query: { id },
  });
}

async function deleteDiagram(id: string) {
  const confirmed = window.confirm("Delete this diagram?");

  if (!confirmed) {
    return;
  }

  deleteError.value = null;

  try {
    await diagramsStore.removeDiagram(id);
  } catch (error) {
    deleteError.value = describeStorageError(error);
  }
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp);
}
</script>

<template>
  <main class="diagrams-page">
    <header class="diagrams-header">
      <div>
        <h1>My Diagrams</h1>
        <p>Your diagrams saved locally in this browser.</p>
      </div>

      <RouterLink to="/editor" class="new-diagram-button"> New Diagram </RouterLink>
    </header>

    <div v-if="deleteError" class="diagrams-banner diagrams-banner--error" role="alert">
      {{ deleteError }}
      <button type="button" class="diagrams-banner__dismiss" @click="deleteError = null">
        Dismiss
      </button>
    </div>

    <div v-if="diagramsStore.isLoading" class="diagrams-state">Loading diagrams...</div>

    <div v-else-if="diagramsStore.error" class="diagrams-state diagrams-state--error">
      {{ diagramsStore.error }}
    </div>

    <div v-else-if="diagramsStore.sortedDiagrams.length === 0" class="diagrams-state">
      <h2>No diagrams yet</h2>

      <p>Create your first diagram in the editor.</p>

      <RouterLink to="/editor"> Create diagram </RouterLink>
    </div>

    <div v-else class="diagram-grid">
      <article
        v-for="diagram in diagramsStore.sortedDiagrams"
        :key="diagram.id"
        class="diagram-card"
      >
        <button type="button" class="diagram-card__content" @click="openDiagram(diagram.id)">
          <h2>{{ diagram.title }}</h2>

          <p>
            Updated
            {{ formatDate(diagram.updatedAt) }}
          </p>
        </button>

        <button type="button" class="diagram-card__delete" @click="deleteDiagram(diagram.id)">
          Delete
        </button>
      </article>
    </div>
  </main>
</template>

<style scoped>
.diagrams-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 32px;
}

.diagrams-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.diagrams-header h1 {
  margin: 0 0 8px;
}

.diagrams-header p {
  margin: 0;
  color: var(--text-secondary);
}

.new-diagram-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 8px;
  text-decoration: none;
}

.diagrams-state {
  padding: 64px 24px;
  text-align: center;
}

.diagrams-state h2 {
  margin-bottom: 8px;
}

.diagrams-state p {
  color: var(--text-secondary);
}

.diagrams-state--error {
  color: var(--error-color);
}

.diagrams-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 24px;
  border-radius: 8px;
}

.diagrams-banner--error {
  color: var(--error-color);
  background: color-mix(in srgb, var(--error-color) 12%, transparent);
}

.diagrams-banner__dismiss {
  flex-shrink: 0;
  color: inherit;
  text-decoration: underline;
}

.diagram-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.diagram-card {
  position: relative;
  min-height: 140px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  background: var(--panel-background);
  box-shadow: var(--panel-shadow);
}

.diagram-card__content {
  display: block;
  width: 100%;
  min-height: 140px;
  padding: 20px;
  text-align: left;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.diagram-card__content h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.diagram-card__content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.diagram-card__delete {
  position: absolute;
  right: 12px;
  bottom: 12px;
  border: 0;
  background: transparent;
  color: var(--danger-color);
  cursor: pointer;
}
</style>
