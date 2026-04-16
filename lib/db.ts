import { openDB, type IDBPDatabase } from 'idb';
import type { Item, Comparison } from './bradley-terry';

const DB_NAME = 'kbt-ratings';
const DB_VERSION = 1;

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        db.createObjectStore('items', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    },
  });
}

export async function loadItems(): Promise<Item[]> {
  const db = await getDb();
  return db.getAll('items');
}

export async function saveItem(item: Item): Promise<void> {
  const db = await getDb();
  await db.put('items', item);
}

export async function saveItems(items: Item[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('items', 'readwrite');
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function clearItems(): Promise<void> {
  const db = await getDb();
  await db.clear('items');
  await db.clear('history');
  await db.clear('meta');
}

export async function saveMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put('meta', { key, value });
}

export async function loadMeta(key: string): Promise<unknown> {
  const db = await getDb();
  const row = await db.get('meta', key);
  return row?.value;
}

export async function addComparison(comparison: Comparison): Promise<void> {
  const db = await getDb();
  await db.add('history', comparison);
}

export async function loadHistory(): Promise<Comparison[]> {
  const db = await getDb();
  return db.getAll('history');
}

export async function exportData(): Promise<string> {
  const items = await loadItems();
  const history = await loadHistory();
  return JSON.stringify({ items, history, exportedAt: Date.now() }, null, 2);
}

export async function importData(json: string): Promise<void> {
  const data = JSON.parse(json);
  if (!data.items || !Array.isArray(data.items)) {
    throw new Error('Invalid data format: missing items array');
  }
  const db = await getDb();

  const tx1 = db.transaction('items', 'readwrite');
  await tx1.store.clear();
  for (const item of data.items) {
    await tx1.store.put(item);
  }
  await tx1.done;

  if (data.history && Array.isArray(data.history)) {
    const tx2 = db.transaction('history', 'readwrite');
    await tx2.store.clear();
    for (const h of data.history) {
      await tx2.store.put(h);
    }
    await tx2.done;
  }
}
