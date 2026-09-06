import { DRAFTS_STORE, openDatabase } from "@/features/storage/database";

import type { DiagramDraft } from "./types";

export async function saveDraft(draft: DiagramDraft): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFTS_STORE, "readwrite");

    const store = transaction.objectStore(DRAFTS_STORE);

    store.put(draft);

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
  });
}

export async function getDraft(id: string): Promise<DiagramDraft | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFTS_STORE, "readonly");

    const store = transaction.objectStore(DRAFTS_STORE);

    const request = store.get(id);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve((request.result as DiagramDraft | undefined) ?? null);
    };

    transaction.oncomplete = () => {
      database.close();
    };
  });
}

export async function getAllDrafts(): Promise<DiagramDraft[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFTS_STORE, "readonly");

    const store = transaction.objectStore(DRAFTS_STORE);

    const request = store.getAll();

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      const drafts = request.result as DiagramDraft[];

      drafts.sort((first, second) => second.updatedAt - first.updatedAt);

      resolve(drafts);
    };

    transaction.oncomplete = () => {
      database.close();
    };
  });
}

export async function deleteDraft(id: string): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFTS_STORE, "readwrite");

    const store = transaction.objectStore(DRAFTS_STORE);

    store.delete(id);

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
  });
}
