import React, { useState } from 'react';
import { ChevronLeft, Save, Sparkles } from 'lucide-react';

function clean(value) {
  return String(value ?? '').trim();
}

export default function EditWine({ wine, onBack, onSave }) {
  const [form, setForm] = useState({
    producer: wine.producer || '',
    wineName: wine.name || '',
    vintage: wine.vintage || '',
    colour: wine.colour || '',
    country: wine.country || '',
    region: wine.region || '',
    appellation: wine.appellation || '',
    bottleSize: wine.size || '750ml',
    quantity: wine.quantity ?? 0,
    drinkFrom: wine.drinkFrom || '',
    drinkTo: wine.drinkTo || '',
    notes: wine.notes || ''
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function aiRefresh() {
    const query = [form.vintage, form.producer, form.wineName].map(clean).filter(Boolean).join(' ');
    if (!query) {
      setMessage('Add producer, wine name or vintage first.');
      return;
    }

    setRefreshing(true);
    setMessage('Refreshing wine details…');

    try {
      const response = await fetch('/api/lookup-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      const match = data.wines?.[0];

      if (!response.ok || !match) {
        setMessage('No AI match found.');
        setRefreshing(false);
        return;
      }

      setForm(current => ({
        ...current,
        producer: clean(match.producer) || current.producer,
        wineName: clean(match.wine_name) || current.wineName,
        vintage: clean(match.vintage) || current.vintage,
        colour: clean(match.colour) || current.colour,
        country: clean(match.country) || current.country,
        region: clean(match.region) || current.region,
        appellation: clean(match.appellation) || current.appellation,
        bottleSize: clean(match.bottle_size) || current.bottleSize,
        drinkFrom: clean(match.drink_from) || current.drinkFrom,
        drinkTo: clean(match.drink_to) || current.drinkTo
      }));

      setMessage('AI details applied. Check before saving.');
    } catch {
      setMessage('AI refresh failed.');
    }

    setRefreshing(false);
  }

  async function save() {
    if (saving) return;

    setSaving(true);
    setMessage('Saving changes…');

    const updatedWine = await onSave(wine, form);

    if (!updatedWine) {
      setMessage('Could not save changes.');
      setSaving(false);
      return;
    }
  }

  return (
    <main>
      <button className="back" onClick={onBack}><ChevronLeft /> Back</button>

      <section className="detail">
        <h1>Edit Wine</h1>
        <p>Update the wine details below. Quantity can be set to 0 to keep the record but remove it from stock.</p>

        {message && <p className="photo-message">{message}</p>}

        <button className="photo-button" onClick={aiRefresh} disabled={refreshing}>
          <Sparkles /> {refreshing ? 'Refreshing…' : 'AI Refresh'}
        </button>

        <section className="manual-form">
          <input className="biginput" value={form.vintage} onChange={event => updateField('vintage', event.target.value)} placeholder="Vintage e.g. 2021 or NV" />
          <input className="biginput" value={form.producer} onChange={event => updateField('producer', event.target.value)} placeholder="Producer / Château" />
          <input className="biginput" value={form.wineName} onChange={event => updateField('wineName', event.target.value)} placeholder="Wine name" />
          <input className="biginput" value={form.colour} onChange={event => updateField('colour', event.target.value)} placeholder="Colour" />
          <input className="biginput" value={form.country} onChange={event => updateField('country', event.target.value)} placeholder="Country" />
          <input className="biginput" value={form.region} onChange={event => updateField('region', event.target.value)} placeholder="Region" />
          <input className="biginput" value={form.appellation} onChange={event => updateField('appellation', event.target.value)} placeholder="Appellation" />
          <input className="biginput" value={form.bottleSize} onChange={event => updateField('bottleSize', event.target.value)} placeholder="Bottle size" />
          <input className="biginput" type="number" min="0" value={form.quantity} onChange={event => updateField('quantity', event.target.value)} placeholder="Quantity" />
          <input className="biginput" value={form.drinkFrom} onChange={event => updateField('drinkFrom', event.target.value)} placeholder="Drink from" />
          <input className="biginput" value={form.drinkTo} onChange={event => updateField('drinkTo', event.target.value)} placeholder="Drink to" />
          <input className="biginput" value={form.notes} onChange={event => updateField('notes', event.target.value)} placeholder="Notes" />

          <button className="photo-button" onClick={save} disabled={saving}>
            <Save /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </section>
      </section>
    </main>
  );
}
