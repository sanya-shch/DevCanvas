import { computed, ref } from "vue";
import { defineStore } from "pinia";

import {
  deleteDiagram,
  getAllDiagrams,
  getDiagram,
  saveDiagram as drSaveDiagram,
} from "@/features/diagrams/diagramRepository";

import { generateDiagramId } from "@/features/diagrams/diagramStorage";

import type { SavedDiagram } from "@/features/diagrams/types";

export const useDiagramsStore = defineStore("diagrams", () => {
  const diagrams = ref<SavedDiagram[]>([]);

  const isLoading = ref(false);

  const error = ref<string | null>(null);

  const sortedDiagrams = computed(() =>
    [...diagrams.value].sort((first, second) => second.updatedAt - first.updatedAt),
  );

  async function loadDiagrams() {
    isLoading.value = true;
    error.value = null;

    try {
      diagrams.value = await getAllDiagrams();
    } catch {
      error.value = "Failed to load saved diagrams.";
    } finally {
      isLoading.value = false;
    }
  }

  async function createDiagram(
    title: string,
    source: string,
    layout: SavedDiagram["layout"],
  ): Promise<SavedDiagram> {
    const now = Date.now();

    const diagram: SavedDiagram = {
      id: generateDiagramId(),
      title,
      source,
      layout,
      createdAt: now,
      updatedAt: now,
    };

    await saveDiagram(diagram);

    diagrams.value = [diagram, ...diagrams.value];

    return diagram;
  }

  async function updateDiagram(diagram: SavedDiagram) {
    const updatedDiagram: SavedDiagram = {
      ...diagram,
      updatedAt: Date.now(),
    };

    await saveDiagram(updatedDiagram);

    const index = diagrams.value.findIndex((item) => item.id === diagram.id);

    if (index === -1) {
      diagrams.value.push(updatedDiagram);
      return;
    }

    diagrams.value[index] = updatedDiagram;
  }

  async function getById(id: string): Promise<SavedDiagram | null> {
    return getDiagram(id);
  }

  async function removeDiagram(id: string) {
    await deleteDiagram(id);

    diagrams.value = diagrams.value.filter((diagram) => diagram.id !== id);
  }

  async function saveDiagram(diagram: SavedDiagram) {
    await drSaveDiagram(diagram);

    const index = diagrams.value.findIndex((item) => item.id === diagram.id);

    if (index === -1) {
      diagrams.value.push(diagram);
    } else {
      diagrams.value[index] = diagram;
    }
  }

  return {
    diagrams,
    isLoading,
    error,
    sortedDiagrams,
    loadDiagrams,
    createDiagram,
    updateDiagram,
    saveDiagram,
    getById,
    removeDiagram,
  };
});
