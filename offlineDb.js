import React, { useMemo, useState } from 'react';
import { AlertCircle, Camera, Download, Edit3, RefreshCw, Search, Wine } from 'lucide-react';
import WineCard from './WineCard.jsx';
import { clean } from './helpers.js';
import { exportWinesToCsv } from './exportCsv.js';
import { downloadWineListPdf } from './pdfWineList.js';

export default function Home({ wines, loading, loadError, onRetry, onOpenWine, onScan, onAddManual, isOnline, syncMessage }) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [filters, setFilters] = useState({ colour: '', country: '', region: '', producer: '', vintage: '', bottleSize: '', photo: '', stock: 'in-stock' });
  const [sortBy, setSortBy] = useState('producer');

  const totalBottles = wines.reduce((sum, wine) => sum + wine.quantity, 0);
  const countries = new Set(wines.map(wine => wine.country).filter(Boolean)).size;

  function uniqueValues(field) {
    return [...new Set(wines.map(wine => clean(wine[field])).filter(Boolean))].sort();
  }

  function updateFilter(field, value) {
    setFilters(current => ({ ...current, [field]: value }));
  }

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();

    let result = wines.filter(wine => {
      return (!needle || Object.values(wine).join(' ').toLowerCase().includes(needle))
        && (!filters.colour || wine.colour === filters.colour)
        && (!filters.country || wine.country === filters.country)
        && (!filters.region || wine.region === filters.region)
        && (!filters.producer || wine.producer === filters.producer)
        && (!filters.vintage || wine.vintage === filters.vintage)
        && (!filters.bottleSize || wine.size === filters.bottleSize)
        && (!filters.photo || (filters.photo === 'has-photo' ? Boolean(wine.photoUrl) : !wine.photoUrl))
        && (filters.stock !== 'in-stock' || wine.quantity > 0);
    });

    result = [...result].sort((a, b) => {
      if (sortBy === 'vintage') return clean(b.vintage).localeCompare(clean(a.vintage), undefined, { numeric: true });
      if (sortBy === 'country') return clean(a.country).localeCompare(clean(b.country));
      if (sortBy === 'region') return clean(a.region).localeCompare(clean(b.region));
      if (sortBy === 'bottle-size') return clean(a.size).localeCompare(clean(b.size), undefined, { numeric: true });
      if (sortBy === 'bottle-count') return b.quantity - a.quantity;
      if (sortBy === 'wine-name') return clean(a.name).localeCompare(clean(b.name));
      return clean(a.producer || a.fullName).localeCompare(clean(b.producer || b.fullName));
    });

    return result;
  }, [query, wines, filters, sortBy]);

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">My Cellar</p>
          <h1>{loading ? 'Loading…' : `${totalBottles.toLocaleString()} bottles`}</h1>
          <p>{loading ? 'Connecting to Supabase' : `${wines.length} wines loaded from Supabase`}</p>
        </div>
        <button className="icon-button" onClick={() => setShowExport(current => !current)} aria-label="Export cellar">
          <Download />
        </button>
      </header>

      <section className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
        <strong>{isOnline ? 'Online' : 'Offline'}</strong>
        <span>{syncMessage || (isOnline ? 'Cellar synced' : 'Using saved cellar data')}</span>
      </section>

      {showExport && (
        <section className="export-menu">
          <button onClick={() => exportWinesToCsv(wines, 'all')}>Export all wines CSV</button>
          <button onClick={() => exportWinesToCsv(filtered, 'filtered')}>Export filtered CSV</button>
          <button onClick={() => downloadWineListPdf(wines)}>Download wine list PDF</button>
        </section>
      )}

      {loadError && (
        <section className="error">
          <AlertCircle />
          <div>
            <strong>Database issue</strong>
            <p>{loadError}</p>
            <button onClick={onRetry}><RefreshCw /> Try again</button>
          </div>
        </section>
      )}

      <section className="stats">
        <div><strong>{wines.length}</strong><span>wines</span></div>
        <div><strong>{countries}</strong><span>countries</span></div>
        <div><strong>{filtered.length}</strong><span>shown</span></div>
      </section>

      <section className="actions">
        <button onClick={onScan}><Camera /> Scan Bottle</button>
        <button onClick={onAddManual}><Edit3 /> Add Manually</button>
      </section>

      <label className="search">
        <Search />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search producer, vintage, region…" />
      </label>

      <section className="filter-sort-actions">
        <button onClick={() => setShowFilters(current => !current)}>Filter</button>
        <button onClick={() => setShowSort(current => !current)}>Sort</button>
      </section>

      {showFilters && (
        <section className="filter-panel">
          <select value={filters.colour} onChange={event => updateFilter('colour', event.target.value)}><option value="">All colours</option>{uniqueValues('colour').map(value => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.country} onChange={event => updateFilter('country', event.target.value)}><option value="">All countries</option>{uniqueValues('country').map(value => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.region} onChange={event => updateFilter('region', event.target.value)}><option value="">All regions</option>{uniqueValues('region').map(value => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.producer} onChange={event => updateFilter('producer', event.target.value)}><option value="">All producers</option>{uniqueValues('producer').map(value => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.vintage} onChange={event => updateFilter('vintage', event.target.value)}><option value="">All vintages</option>{uniqueValues('vintage').map(value => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.bottleSize} onChange={event => updateFilter('bottleSize', event.target.value)}><option value="">All bottle sizes</option>{uniqueValues('size').map(value => <option key={value} value={value}>{value}</option>)}</select>
          <select value={filters.photo} onChange={event => updateFilter('photo', event.target.value)}><option value="">Photo: all</option><option value="has-photo">Has photo</option><option value="no-photo">No photo</option></select>
          <select value={filters.stock} onChange={event => updateFilter('stock', event.target.value)}><option value="in-stock">In stock only</option><option value="">Include zero bottles</option></select>
          <button onClick={() => setFilters({ colour: '', country: '', region: '', producer: '', vintage: '', bottleSize: '', photo: '', stock: 'in-stock' })}>Clear filters</button>
        </section>
      )}

      {showSort && (
        <section className="filter-panel">
          <select value={sortBy} onChange={event => setSortBy(event.target.value)}>
            <option value="producer">Producer A–Z</option>
            <option value="wine-name">Wine name A–Z</option>
            <option value="vintage">Vintage newest</option>
            <option value="country">Country A–Z</option>
            <option value="region">Region A–Z</option>
            <option value="bottle-size">Bottle size</option>
            <option value="bottle-count">Bottle count</option>
          </select>
        </section>
      )}

      <section className="list">
        {loading && <div className="card"><div><strong>Loading wines…</strong><small>Reading from Supabase</small></div></div>}
        {!loading && filtered.length === 0 && <div className="card"><div><strong>No wines found</strong><small>Try a different search</small></div></div>}
        {!loading && filtered.map(wine => <WineCard key={wine.id} wine={wine} onClick={() => onOpenWine(wine)} />)}
      </section>
    </main>
  );
}
