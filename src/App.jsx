import React, { useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import Home from './Home.jsx';
import WineDetail from './WineDetail.jsx';
import ScanBottle from './ScanBottle.jsx';
import { uploadWinePhoto, wineFromDatabase } from './helpers.js';

export default function App() {
  const [wines, setWines] = useState([]);
  const [screen, setScreen] = useState('home');
  const [selectedWine, setSelectedWine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function loadWines() {
    setLoading(true);
    setLoadError('');

    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .order('wine_name', { ascending: true });

    if (error) {
      setLoadError('Unable to connect to the cellar database.');
      setWines([]);
      setLoading(false);
      return;
    }

    setWines((data || []).map(wineFromDatabase));
    setLoading(false);
  }

  useEffect(() => {
    loadWines();
  }, []);

  function openWine(wine) {
    setSelectedWine(wine);
    setScreen('detail');
  }

  function updateWineInState(updatedWine) {
    setWines(current => current.map(wine => wine.id === updatedWine.id ? updatedWine : wine));
    setSelectedWine(current => current?.id === updatedWine.id ? updatedWine : current);
  }

  async function changeQuantity(wine, delta) {
    const nextQuantity = Math.max(0, wine.quantity + delta);

    const { data, error } = await supabase
      .from('wines')
      .update({ quantity: nextQuantity, updated_at: new Date().toISOString() })
      .eq('id', wine.id)
      .select('*')
      .single();

    if (!error && data) updateWineInState(wineFromDatabase(data));
  }

  async function savePhotoForWine(wine, file) {
    const photoUrl = await uploadWinePhoto(file, wine.id);
    if (!photoUrl) return wine;

    const { data } = await supabase
      .from('wines')
      .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
      .eq('id', wine.id)
      .select('*')
      .single();

    const updatedWine = data ? wineFromDatabase(data) : { ...wine, photoUrl };
    updateWineInState(updatedWine);
    return updatedWine;
  }

  async function createWine({ producer, wineName, vintage, photoFile }) {
    const { data, error } = await supabase
      .from('wines')
      .insert({ producer: producer || '', wine_name: wineName || 'New wine', vintage: vintage || '', quantity: 1 })
      .select('*')
      .single();

    if (error || !data) return null;

    let newWine = wineFromDatabase(data);
    if (photoFile) newWine = await savePhotoForWine(newWine, photoFile);

    setWines(current => [newWine, ...current.filter(wine => wine.id !== newWine.id)]);
    openWine(newWine);
    return newWine;
  }

  if (screen === 'detail' && selectedWine) {
    return (
      <WineDetail
        wine={selectedWine}
        onBack={() => setScreen('home')}
        onAddOne={() => changeQuantity(selectedWine, 1)}
        onConsumeOne={() => changeQuantity(selectedWine, -1)}
        savePhotoForWine={savePhotoForWine}
      />
    );
  }

  if (screen === 'scan') {
    return (
      <ScanBottle
        wines={wines}
        onBack={() => setScreen('home')}
        onOpenWine={openWine}
        onCreateWine={createWine}
        savePhotoForWine={savePhotoForWine}
      />
    );
  }

  return (
    <Home
      wines={wines}
      loading={loading}
      loadError={loadError}
      onRetry={loadWines}
      onOpenWine={openWine}
      onScan={() => setScreen('scan')}
    />
  );
}
