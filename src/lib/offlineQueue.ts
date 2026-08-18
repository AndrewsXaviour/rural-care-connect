/**
 * Offline Write Queue
 *
 * Stores failed Supabase writes in IndexedDB and retries them
 * when the browser comes back online. Critical for rural users
 * with spotty connectivity.
 */

const DB_NAME = "ruralcare_offline_queue";
const DB_VERSION = 1;
const STORE_NAME = "pending_writes";

interface PendingWrite {
  id: string;
  table: string;
  operation: "insert" | "update" | "upsert";
  payload: Record<string, unknown>;
  filters?: Record<string, unknown>; // for update operations
  timestamp: number;
  retries: number;
}

// ---------------------------------------------------------------------------
// IndexedDB helpers
// ---------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllPending(): Promise<PendingWrite[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function removePending(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function updatePending(item: PendingWrite): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(item);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Queue a failed write for later retry.
 */
export async function queueWrite(
  table: string,
  operation: "insert" | "update" | "upsert",
  payload: Record<string, unknown>,
  filters?: Record<string, unknown>
): Promise<void> {
  const item: PendingWrite = {
    id: `${table}_${operation}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    table,
    operation,
    payload,
    filters,
    timestamp: Date.now(),
    retries: 0,
  };

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.add(item);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

/**
 * Get count of pending writes (for UI badge/status).
 */
export async function getPendingCount(): Promise<number> {
  const items = await getAllPending();
  return items.length;
}

/**
 * Retry all pending writes. Called on app init and on `online` event.
 * Uses the Supabase client directly to avoid circular imports.
 */
export async function retryPendingWrites(): Promise<{ sent: number; failed: number }> {
  const { supabase } = await import("./supabase");
  const items = await getAllPending();
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    try {
      if (item.operation === "insert") {
        const { error } = await supabase.from(item.table).insert(item.payload);
        if (error) throw error;
      } else if (item.operation === "update") {
        const { error } = await supabase
          .from(item.table)
          .update(item.payload)
          .match(item.filters || {});
        if (error) throw error;
      } else if (item.operation === "upsert") {
        const { error } = await supabase.from(item.table).upsert(item.payload);
        if (error) throw error;
      }

      await removePending(item.id);
      sent++;
    } catch {
      // Retry up to 5 times, then discard
      item.retries += 1;
      if (item.retries >= 5) {
        await removePending(item.id);
      } else {
        await updatePending(item);
      }
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Initialize the offline queue listener.
 * Retries pending writes on app load and when browser comes back online.
 */
export function initOfflineQueue(): void {
  // Retry on app load
  retryPendingWrites().catch(() => {});

  // Retry when browser comes back online
  window.addEventListener("online", () => {
    retryPendingWrites().catch(() => {});
  });
}
