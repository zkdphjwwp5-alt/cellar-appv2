import { supabase } from './supabase.js';

export const BUCKET_NAME = 'wine-photos';

export function clean(value) {
  return String(value ?? '').trim();
}

export function wineFromDatabase(row) {
  const vintage = clean(row.vintage);
  const producer = clean(row.producer);
  const wineName = clean(row.wine_name);
  const fullName = [producer, wineName].filter(Boolean).join(' ') || wineName || 'Unnamed wine';

  return {
    id: row.id,
    quantity: Number(row.quantity) || 0,
    vintage,
    producer,
    name: wineName || fullName,
    fullName,
    category: clean(row.style),
    colour: clean(row.colour),
    country: clean(row.country),
    region: clean(row.region),
    appellation: clean(row.appellation),
    size: clean(row.bottle_size) || '750ml',
    drinkFrom: clean(row.drinking_from),
    drinkTo: clean(row.drinking_to),
    notes: clean(row.notes),
    photoUrl: clean(row.photo_url),
    locationText: [row.country, row.region, row.appellation].map(clean).filter(Boolean).join(', ')
  };
}

export async function uploadWinePhoto(file, wineId) {
  if (!file || !wineId) return '';

  const extension = file.name.split('.').pop() || 'jpg';
  const filePath = `${wineId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { cacheControl: '3600', upsert: true });

  if (error) return '';

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data?.publicUrl || '';
}

export function findBestMatch(wines, extracted) {
  const terms = [extracted.vintage, extracted.producer, extracted.wine_name].map(clean).filter(Boolean);
  if (!terms.length) return null;

  const scored = wines.map(wine => {
    const haystack = Object.values(wine).join(' ').toLowerCase();
    const score = terms.reduce((sum, term) => sum + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
    return { wine, score };
  }).sort((a, b) => b.score - a.score);

  return scored[0]?.score >= 2 ? scored[0].wine : null;
}
