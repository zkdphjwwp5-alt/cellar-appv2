import React, { useMemo, useState } from 'react';
import { ChevronLeft, Printer } from 'lucide-react';

function clean(value) {
  return String(value ?? '').trim();
}

function colourGroup(wine) {
  const colour = clean(wine.colour).toLowerCase();
  if (colour.includes('sparkling') || colour.includes('champagne')) return 'Sparkling';
  if (colour.includes('white')) return 'White';
  if (colour.includes('rosé') || colour.includes('rose')) return 'Rosé';
  if (colour.includes('sweet') || colour.includes('dessert')) return 'Sweet';
  if (colour.includes('fortified') || colour.includes('port') || colour.includes('sherry')) return 'Fortified';
  if (colour.includes('red')) return 'Red';
  return 'Other';
}

const groupOrder = ['Sparkling', 'White', 'Rosé', 'Red', 'Sweet', 'Fortified', 'Other'];

export default function WineList({ wines, onBack }) {
  const [includeCounts, setIncludeCounts] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(true);

  const grouped = useMemo(() => {
    const visible = wines
      .filter(wine => !onlyInStock || wine.quantity > 0)
      .sort((a, b) => {
        const groupCompare = groupOrder.indexOf(colourGroup(a)) - groupOrder.indexOf(colourGroup(b));
        if (groupCompare !== 0) return groupCompare;

        const countryCompare = clean(a.country).localeCompare(clean(b.country));
        if (countryCompare !== 0) return countryCompare;

        const regionCompare = clean(a.region).localeCompare(clean(b.region));
        if (regionCompare !== 0) return regionCompare;

        return clean(a.producer || a.fullName).localeCompare(clean(b.producer || b.fullName));
      });

    return visible.reduce((groups, wine) => {
      const group = colourGroup(wine);
      if (!groups[group]) groups[group] = [];
      groups[group].push(wine);
      return groups;
    }, {});
  }, [wines, onlyInStock]);

  function printList() {
    window.print();
  }

  return (
    <main>
      <section className="print-controls no-print">
        <button className="back" onClick={onBack}><ChevronLeft /> Back</button>
        <button className="photo-button" onClick={printList}><Printer /> Print / Save PDF</button>
        <label className="print-toggle">
          <input type="checkbox" checked={onlyInStock} onChange={event => setOnlyInStock(event.target.checked)} />
          In-stock wines only
        </label>
        <label className="print-toggle">
          <input type="checkbox" checked={includeCounts} onChange={event => setIncludeCounts(event.target.checked)} />
          Include bottle counts
        </label>
      </section>

      <section className="wine-list-page">
        <header className="wine-list-header">
          <p className="eyebrow">My Cellar</p>
          <h1>Wine List</h1>
          <p>{onlyInStock ? 'Current cellar selection' : 'Complete cellar history'}</p>
        </header>

        {groupOrder.map(group => {
          const groupWines = grouped[group] || [];
          if (!groupWines.length) return null;

          return (
            <section className="wine-list-section" key={group}>
              <h2>{group}</h2>

              {groupWines.map(wine => (
                <article className="wine-list-row" key={wine.id}>
                  <div>
                    <strong>{[wine.producer, wine.name].filter(Boolean).join(' — ')}</strong>
                    <span>{[wine.vintage, wine.country, wine.region, wine.appellation].filter(Boolean).join(' · ')}</span>
                  </div>
                  <aside>
                    {wine.size || '750ml'}
                    {includeCounts ? ` · ${wine.quantity} bottle${wine.quantity === 1 ? '' : 's'}` : ''}
                  </aside>
                </article>
              ))}
            </section>
          );
        })}
      </section>
    </main>
  );
}
