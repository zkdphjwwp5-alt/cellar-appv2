import React from 'react';
import { ChevronLeft, Edit3, Minus, Plus } from 'lucide-react';
import PhotoUploader from './PhotoUploader.jsx';

export default function WineDetail({ wine, onBack, onAddOne, onConsumeOne, onEdit }) {
  return (
    <main>
      <button className="back" onClick={onBack}><ChevronLeft /> Back</button>

      <section className="detail">
        <div className="detail-header">
          <div>
            <p className="eyebrow">{wine.category || wine.colour || 'Wine'}</p>
            <h1>{[wine.vintage, wine.producer || wine.fullName].filter(Boolean).join(' ')}</h1>
            {wine.producer && <h2>{wine.name}</h2>}
            <p>{[wine.colour, wine.country, wine.region, wine.appellation].filter(Boolean).join(' · ')}</p>
          </div>
          <button className="icon-button" onClick={onEdit} aria-label="Edit wine"><Edit3 /></button>
        </div>

        <PhotoUploader wine={wine} onPhotoSaved={() => {}} />

        <div className="qty">{wine.quantity}<span>bottles</span></div>

        <div className="actions">
          <button onClick={onConsumeOne}><Minus /> Consume one</button>
          <button onClick={onAddOne}><Plus /> Add one</button>
        </div>

        <dl>
          <dt>Bottle size</dt><dd>{wine.size}</dd>
          <dt>Appellation</dt><dd>{wine.appellation || 'Not set yet'}</dd>
          <dt>Drinking window</dt><dd>{wine.drinkFrom || wine.drinkTo ? `${wine.drinkFrom || '?'}–${wine.drinkTo || '?'}` : 'Not set yet'}</dd>
          <dt>Notes</dt><dd>{wine.notes || 'No notes yet'}</dd>
        </dl>
      </section>
    </main>
  );
}
