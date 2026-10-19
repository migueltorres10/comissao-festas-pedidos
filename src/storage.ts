import type { Catalog, Cart } from './domain';

const DB = 'comissao-festas-pedidos';
const STORE = 'estado';
type State = { catalog: Catalog; cart: Cart };

const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(DB, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function loadState(fallback: State): Promise<State> {
  try {
    const db = await open();
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get('state');
      request.onsuccess = () => resolve(request.result ?? fallback);
      request.onerror = () => reject(request.error);
    });
  } catch { return fallback; }
}
export async function saveState(state: State) {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(state, 'state');
    request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
  });
}
