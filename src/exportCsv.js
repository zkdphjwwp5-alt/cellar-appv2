export function exportWinesToCsv(wines, suffix = 'all') {
  const headers = [
    'producer',
    'wine_name',
    'vintage',
    'colour',
    'country',
    'region',
    'subregion',
    'appellation',
    'bottle_size',
    'quantity',
    'storage_location',
    'drinking_from',
    'drinking_to',
    'photo_url',
    'notes'
  ];

  const rows = wines.map(wine => ({
    producer: wine.producer || '',
    wine_name: wine.name || '',
    vintage: wine.vintage || '',
    colour: wine.colour || '',
    country: wine.country || '',
    region: wine.region || '',
    subregion: wine.subregion || '',
    appellation: wine.appellation || '',
    bottle_size: wine.size || '',
    quantity: wine.quantity ?? 0,
    storage_location: wine.storageLocation || '',
    drinking_from: wine.drinkFrom || '',
    drinking_to: wine.drinkTo || '',
    photo_url: wine.photoUrl || '',
    notes: wine.notes || ''
  }));

  const escapeCsv = value => `"${String(value ?? '').split('"').join('""')}"`;
  const csv = [headers.join(','), ...rows.map(row => headers.map(header => escapeCsv(row[header])).join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const today = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `my-cellar-${suffix}-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
