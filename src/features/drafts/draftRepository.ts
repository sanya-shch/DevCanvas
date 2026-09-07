import { DRAFTS_STORE } from "@/features/storage/database";
import { createIndexedDbRepository } from "@/features/storage/createIndexedDbRepository";

import type { DiagramDraft } from "./types";

const repository = createIndexedDbRepository<DiagramDraft>(DRAFTS_STORE);

export async function saveDraft(draft: DiagramDraft): Promise<void> {
  return repository.put(draft);
}

export async function getDraft(id: string): Promise<DiagramDraft | null> {
  return repository.getById(id);
}

export async function getAllDrafts(): Promise<DiagramDraft[]> {
  return repository.getAll();
}

export async function deleteDraft(id: string): Promise<void> {
  return repository.remove(id);
}
