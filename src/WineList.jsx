import React, { useMemo } from 'react';
import { ChevronLeft, Printer } from 'lucide-react';

function clean(value) {
  return String(value ?? '').trim();
}

function colourGroup(wine) {
  const colour = clean(wine.colour).toLowerCase();

  if (colour.includes('sparkling') || colour.includes('champagne')) return 'Sparkling';
  if (colour.includes('white')) return 'White';
  if (colour.includes('rosé') || colour.includes('rose')) return 'Rosé';
  if (colour.includes('sweet') || colour.includes('dessert')) return 'Sweet & Fortified';
  if (colour.includes('fortified') || colour.includes('port') || colour.includes('sherry')) return 'Sweet & Fortified';
  if (colour.includes('red')) return 'Red';

  return 'Other';
}

const groupOrder = ['Sparkling', 'White', 'Rosé', 'Red', 'Sweet & Fortified', 'Other'];

function monthYear() {
  return new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default function WineList({ wines, onBack }) {
  const inStock = useMemo(() => wines.filter(wine => wine.quantity > 0), [wines]);

  const stats = useMemo(() => ({
    wines: inStock.length,
    bottles: inStock.reduce((sum, wine) => sum + wine.quantity, 0),
    countries: new Set(inStock.map(wine => wine.country).filter(Boolean)).size,
    regions: new Set(inStock.map(wine => wine.region).filter(Boolean)).size
  }), [inStock]);

  const grouped = useMemo(() => {
    const sorted = [...inStock].sort((a, b) => {
      const groupCompare = groupOrder.indexOf(colourGroup(a)) - groupOrder.indexOf(colourGroup(b));
      if (groupCompare !== 0) return groupCompare;

      const countryCompare = clean(a.country).localeCompare(clean(b.country));
      if (countryCompare !== 0) return countryCompare;

      const regionCompare = clean(a.region).localeCompare(clean(b.region));
      if (regionCompare !== 0) return regionCompare;

      const producerCompare = clean(a.producer || a.fullName).localeCompare(clean(b.producer || b.fullName));
      if (producerCompare !== 0) return producerCompare;

      return clean(a.vintage).localeCompare(clean(b.vintage), undefined, { numeric: true });
    });

    return sorted.reduce((groups, wine) => {
      const group = colourGroup(wine);
      const country = clean(wine.country) || 'Other';
      const region = clean(wine.region) || 'Other';

      if (!groups[group]) groups[group] = {};
      if (!groups[group][country]) groups[group][country] = {};
      if (!groups[group][country][region]) groups[group][country][region] = [];

      groups[group][country][region].push(wine);
      return groups;
    }, {});
  }, [inStock]);

  return (
    <main>
      <section className="print-controls no-print">
        <button className="back" onClick={onBack}><ChevronLeft /> Back</button>
        <button className="photo-button" onClick={() => window.print()}><Printer /> Print Wine List</button>
      </section>

      <section className="wine-list-document">
        <section className="wine-list-cover">
          <p className="wine-list-kicker">Inn Farm Cellar</p>
          <h1>Wine List</h1>
          <p>{monthYear()}</p>
          <div className="wine-list-cover-stats">
            <span>{stats.wines} wines</span>
            <span>{stats.bottles} bottles</span>
          </div>
        </section>

        <section className="wine-list-content">
          {groupOrder.map(group => {
            const countries = grouped[group];
            if (!countries) return null;

            return (
              <section className="wine-list-section" key={group}>
                <h2>{group}</h2>

                {Object.entries(countries).map(([country, regions]) => (
                  <section className="wine-country" key={country}>
                    <h3>{country}</h3>

                    {Object.entries(regions).map(([region, regionWines]) => (
                      <section className="wine-region" key={region}>
                        <h4>{region}</h4>

                        {regionWines.map(wine => (
                          <article className="wine-entry" key={wine.id}>
                            <div>
                              <strong>{wine.producer || wine.fullName}</strong>
                              <span>{wine.name}</span>
                              {wine.appellation && <small>{wine.appellation}</small>}
                            </div>
                            <aside>{wine.vintage || 'NV'}</aside>
                          </article>
                        ))}
                      </section>
                    ))}
                  </section>
                ))}
              </section>
            );
          })}
        </section>

        <section className="wine-list-summary">
          <h2>Cellar Summary</h2>
          <p>{stats.wines} wines · {stats.bottles} bottles · {stats.countries} countries · {stats.regions} regions</p>
        </section>
      </section>
    </main>
  );
}
