import { DIAGRAMS_STORE, openDatabase } from "@/features/storage/database";

import type { SavedDiagram } from "./types";

export async function getAllDiagrams(): Promise<SavedDiagram[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DIAGRAMS_STORE, "readonly");

    const store = transaction.objectStore(DIAGRAMS_STORE);

    const request = store.getAll();

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      const diagrams = request.result as SavedDiagram[];

      diagrams.sort((first, second) => second.updatedAt - first.updatedAt);

      resolve(diagrams);
    };

    transaction.oncomplete = () => {
      database.close();
    };
  });
}

export async function getDiagram(id: string): Promise<SavedDiagram | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DIAGRAMS_STORE, "readonly");

    const store = transaction.objectStore(DIAGRAMS_STORE);

    const request = store.get(id);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve((request.result as SavedDiagram | undefined) ?? null);
    };

    transaction.oncomplete = () => {
      database.close();
    };
  });
}

export async function saveDiagram(diagram: SavedDiagram): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DIAGRAMS_STORE, "readwrite");

    const store = transaction.objectStore(DIAGRAMS_STORE);

    store.put(diagram);

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
  });
}

export async function deleteDiagram(id: string): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DIAGRAMS_STORE, "readwrite");

    const store = transaction.objectStore(DIAGRAMS_STORE);

    store.delete(id);

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
  });
}
