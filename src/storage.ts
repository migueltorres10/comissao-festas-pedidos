import {
  migrateState,
  type AppState,
  type Catalog,
  type LegacyState,
} from "./domain";
const DB = "comissao-festas-pedidos";
const STORE = "estado";
const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
export async function loadState(fallbackCatalog: Catalog): Promise<AppState> {
  try {
    const db = await open();
    const raw = await new Promise<AppState | LegacyState | undefined>(
      (resolve, reject) => {
        const request = db.transaction(STORE).objectStore(STORE).get("state");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      },
    );
    return migrateState(raw, fallbackCatalog);
  } catch {
    return migrateState(undefined, fallbackCatalog);
  }
}
let saveQueue = Promise.resolve();
export function saveState(state: AppState) {
  const snapshot = structuredClone(state);
  const pending = saveQueue
    .catch(() => {})
    .then(async () => {
      const db = await open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(snapshot, "state");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error);
        };
      });
    });
  saveQueue = pending;
  return pending;
}
export function flushState() {
  return saveQueue;
}
