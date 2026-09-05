import type { SavedDiagram } from "./types";

const DB_NAME = "devcanvas";
const DB_VERSION = 1;
const STORE_NAME = "diagrams";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = () => {
      const database = request.result;

      if (database.objectStoreNames.contains(STORE_NAME)) {
        return;
      }

      const store = database.createObjectStore(STORE_NAME, {
        keyPath: "id",
      });

      store.createIndex("updatedAt", "updatedAt", {
        unique: false,
      });
    };
  });
}

export async function getAllDiagrams(): Promise<SavedDiagram[]> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = database.transaction(STORE_NAME, "readonly");

    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = database.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

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
    const transaction = database.transaction(STORE_NAME, "readwrite");

    const store = transaction.objectStore(STORE_NAME);

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
