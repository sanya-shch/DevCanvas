import { DIAGRAMS_STORE } from "@/features/storage/database";
import { createIndexedDbRepository } from "@/features/storage/createIndexedDbRepository";

import type { SavedDiagram } from "./types";

const repository = createIndexedDbRepository<SavedDiagram>(DIAGRAMS_STORE);

export async function getAllDiagrams(): Promise<SavedDiagram[]> {
  return repository.getAll();
}

export async function getDiagram(id: string): Promise<SavedDiagram | null> {
  return repository.getById(id);
}

export async function saveDiagram(diagram: SavedDiagram): Promise<void> {
  return repository.put(diagram);
}

export async function deleteDiagram(id: string): Promise<void> {
  return repository.remove(id);
}
