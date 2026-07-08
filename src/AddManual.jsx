import React, { useMemo, useState } from 'react';
import { ChevronLeft, Search, Plus, Sparkles } from 'lucide-react';

const emptyForm = {
  producer: '',
  wineName: '',
  vintage: '',
  colour: '',
  country: '',
  region: '',
  subregion: '',
  appellation: '',
  bottleSize: '750ml',
  quantity: 1,
  storageLocation: '',
  drinkFrom: '',
  drinkTo: '',
  notes: '',
  photoFile: null
};

function clean(value) {
  return String(value ?? '').trim();
}

export default function AddManual({ onBack, onCreateWine }) {
  const [searchText, setSearchText] = useState('');
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const canSearch = useMemo(() => searchText.trim().length >= 2, [searchText]);

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function searchWine() {
    if (!canSearch) return;

    setSearching(true);
    setMessage('Searching wine details…');
    setMatches([]);

    try {
      const response = await fetch('/api/lookup-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchText })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Search failed');

      const wines = data.wines || [];
      setMatches(wines);
      setMessage(wines.length ? 'Select a match, or create manually.' : 'No match found. Create manually instead.');

      if (!wines.length) {
        setForm(current => ({ ...current, producer: searchText }));
        setShowForm(true);
      }
    } catch {
      setMessage('Could not search right now. You can still create manually.');
      setShowForm(true);
    }

    setSearching(false);
  }

  function useMatch(match) {
    setForm(current => ({
      ...current,
      producer: clean(match.producer),
      wineName: clean(match.wine_name),
      vintage: clean(match.vintage),
      colour: clean(match.colour),
      country: clean(match.country),
      region: clean(match.region),
      subregion: clean(match.subregion),
      appellation: clean(match.appellation),
      bottleSize: clean(match.bottle_size) || '750ml',
      drinkFrom: clean(match.drink_from),
      drinkTo: clean(match.drink_to),
      notes: clean(match.notes)
    }));
    setShowForm(true);
    setMessage('Details pre-filled. Check them, then save.');
  }

  async function saveWine() {
    await onCreateWine(form);
  }

  return (
    <main>
      <button className="back" onClick={onBack}><ChevronLeft /> Back</button>

      <section className="detail">
        <Sparkles size={42} />
        <h1>Add Manually</h1>
        <p>Search a producer, château, wine name, or vintage. The app will try to pre-fill the details.</p>

        <label className="search manual-search">
          <Search />
          <input
            value={searchText}
            onChange={event => setSearchText(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && searchWine()}
            placeholder="Try: Château Margaux 2018"
          />
        </label>

        <button className="photo-button" onClick={searchWine} disabled={!canSearch || searching}>
          <Search /> {searching ? 'Searching…' : 'Search wine'}
        </button>

        {message && <p className="photo-message">{message}</p>}

        {matches.length > 0 && (
          <section className="manual-results">
            {matches.map((match, index) => (
              <button key={`${match.producer}-${match.wine_name}-${index}`} className="manual-result" onClick={() => useMatch(match)}>
                <strong>{[match.vintage, match.producer, match.wine_name].filter(Boolean).join(' ')}</strong>
                <span>{[match.colour, match.country, match.region, match.appellation].filter(Boolean).join(' · ')}</span>
                </button>
            ))}
          </section>
        )}

        <button className="photo-button" onClick={() => setShowForm(true)}>
          <Plus /> Create manually instead
        </button>

        {showForm && (
          <section className="manual-form">
            <input className="biginput" value={form.vintage} onChange={event => updateField('vintage', event.target.value)} placeholder="Vintage e.g. 2021 or NV" />
            <input className="biginput" value={form.producer} onChange={event => updateField('producer', event.target.value)} placeholder="Producer / Château" />
            <input className="biginput" value={form.wineName} onChange={event => updateField('wineName', event.target.value)} placeholder="Wine name" />
            <input className="biginput" value={form.colour} onChange={event => updateField('colour', event.target.value)} placeholder="Colour" />
            <input className="biginput" value={form.country} onChange={event => updateField('country', event.target.value)} placeholder="Country" />
            <input className="biginput" value={form.region} onChange={event => updateField('region', event.target.value)} placeholder="Region" />
            <input className="biginput" value={form.subregion} onChange={event => updateField('subregion', event.target.value)} placeholder="Subregion" />
            <input className="biginput" value={form.appellation} onChange={event => updateField('appellation', event.target.value)} placeholder="Appellation" />
            <input className="biginput" value={form.bottleSize} onChange={event => updateField('bottleSize', event.target.value)} placeholder="Bottle size" />
            <input className="biginput" type="number" min="0" value={form.quantity} onChange={event => updateField('quantity', event.target.value)} placeholder="Quantity" />
            <input className="biginput" value={form.storageLocation} onChange={event => updateField('storageLocation', event.target.value)} placeholder="Storage location" />
            <input className="biginput" value={form.drinkFrom} onChange={event => updateField('drinkFrom', event.target.value)} placeholder="Drink from" />
            <input className="biginput" value={form.drinkTo} onChange={event => updateField('drinkTo', event.target.value)} placeholder="Drink to" />
            <input className="biginput" value={form.notes} onChange={event => updateField('notes', event.target.value)} placeholder="Notes" />
            <input className="biginput" type="file" accept="image/*" onChange={event => updateField('photoFile', event.target.files?.[0] || null)} />
            <button className="photo-button" onClick={saveWine}><Plus /> Save wine</button>
          </section>
        )}
      </section>
    </main>
  );
}
