import { openDatabase } from "./database";

interface TimestampedEntity {
  updatedAt: number;
}

export function createIndexedDbRepository<T extends TimestampedEntity>(storeName: string) {
  async function getAll(): Promise<T[]> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");

      const store = transaction.objectStore(storeName);

      const request = store.getAll();

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        const items = request.result as T[];

        items.sort((first, second) => second.updatedAt - first.updatedAt);

        resolve(items);
      };

      transaction.oncomplete = () => {
        database.close();
      };
    });
  }

  async function getById(id: string): Promise<T | null> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");

      const store = transaction.objectStore(storeName);

      const request = store.get(id);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve((request.result as T | undefined) ?? null);
      };

      transaction.oncomplete = () => {
        database.close();
      };
    });
  }

  async function put(item: T): Promise<void> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");

      const store = transaction.objectStore(storeName);

      store.put(item);

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

  async function remove(id: string): Promise<void> {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readwrite");

      const store = transaction.objectStore(storeName);

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

  return {
    getAll,
    getById,
    put,
    remove,
  };
}
