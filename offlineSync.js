import Dexie from 'dexie';

export const offlineDb = new Dexie('my-cellar-offline');

offlineDb.version(1).stores({
  wines: 'id, producer, name, vintage, country, region, colour, quantity',
  queue: '++queueId, createdAt, operation, wineId'
});

export async function readCachedWines() {
  return offlineDb.wines.toArray();
}

export async function cacheWines(wines) {
  await offlineDb.transaction('rw', offlineDb.wines, async () => {
    await offlineDb.wines.clear();
    await offlineDb.wines.bulkPut(wines);
  });
}

export async function cacheWine(wine) {
  await offlineDb.wines.put(wine);
}

export async function queueChange(change) {
  await offlineDb.queue.add({
    ...change,
    createdAt: new Date().toISOString()
  });
}

export async function pendingChanges() {
  return offlineDb.queue.orderBy('queueId').toArray();
}

export async function removePendingChange(queueId) {
  await offlineDb.queue.delete(queueId);
}
