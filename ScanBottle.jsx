import { supabase } from './supabase.js';
import { cacheWine, pendingChanges, removePendingChange } from './offlineDb.js';
import { wineFromDatabase } from './helpers.js';

function databasePayload(details) {
  return {
    producer: details.producer || '',
    wine_name: details.wineName || details.wine_name || details.name || 'New wine',
    vintage: details.vintage || '',
    colour: details.colour || '',
    country: details.country || '',
    region: details.region || '',
    appellation: details.appellation || '',
    bottle_size: details.bottleSize || details.bottle_size || details.size || '750ml',
    quantity: Number(details.quantity || 0),
    drinking_from: details.drinkFrom ? Number(details.drinkFrom) : null,
    drinking_to: details.drinkTo ? Number(details.drinkTo) : null,
    notes: details.notes || '',
    updated_at: new Date().toISOString()
  };
}

export async function syncPendingChanges() {
  if (!navigator.onLine) return { synced: 0 };

  const changes = await pendingChanges();
  let synced = 0;

  for (const change of changes) {
    try {
      if (change.operation === 'create') {
        const { data, error } = await supabase
          .from('wines')
          .insert(databasePayload(change.payload))
          .select('*')
          .single();

        if (error || !data) throw error || new Error('Create failed');

        await cacheWine(wineFromDatabase(data));
      }

      if (change.operation === 'update') {
        const { data, error } = await supabase
          .from('wines')
          .update(databasePayload(change.payload))
          .eq('id', change.wineId)
          .select('*')
          .single();

        if (error || !data) throw error || new Error('Update failed');

        await cacheWine(wineFromDatabase(data));
      }

      await removePendingChange(change.queueId);
      synced += 1;
    } catch (error) {
      console.error('Offline sync error:', error);
      break;
    }
  }

  return { synced };
}
