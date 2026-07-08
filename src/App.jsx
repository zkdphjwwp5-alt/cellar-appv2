import React, { useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import Home from './Home.jsx';
import WineDetail from './WineDetail.jsx';
import EditWine from './EditWine.jsx';
import ScanBottle from './ScanBottle.jsx';
import AddManual from './AddManual.jsx';
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

  async function createWine(details) {
    const wineDetails = details || {};

    const { data, error } = await supabase
      .from('wines')
      .insert({
        producer: wineDetails.producer || '',
        wine_name: wineDetails.wineName || wineDetails.wine_name || 'New wine',
        vintage: wineDetails.vintage || '',
        colour: wineDetails.colour || '',
        country: wineDetails.country || '',
        region: wineDetails.region || '',
        appellation: wineDetails.appellation || '',
        bottle_size: wineDetails.bottleSize || wineDetails.bottle_size || '750ml',
        quantity: Number(wineDetails.quantity || 1),
        drinking_from: wineDetails.drinkFrom ? Number(wineDetails.drinkFrom) : null,
        drinking_to: wineDetails.drinkTo ? Number(wineDetails.drinkTo) : null,
        notes: [wineDetails.notes || '', wineDetails.subregion ? `Subregion: ${wineDetails.subregion}` : '', wineDetails.storageLocation ? `Storage location: ${wineDetails.storageLocation}` : ''].filter(Boolean).join('\n')
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Create wine error:', error);
      return null;
    }

    let newWine = wineFromDatabase(data);

    if (wineDetails.photoFile) {
      newWine = await savePhotoForWine(newWine, wineDetails.photoFile);
    }

    setWines(current => [newWine, ...current.filter(wine => wine.id !== newWine.id)]);
    openWine(newWine);
    return newWine;
  }

  async function saveEditedWine(wine, details) {
    const { data, error } = await supabase
      .from('wines')
      .update({
        producer: details.producer || '',
        wine_name: details.wineName || 'New wine',
        vintage: details.vintage || '',
        colour: details.colour || '',
        country: details.country || '',
        region: details.region || '',
        appellation: details.appellation || '',
        bottle_size: details.bottleSize || '750ml',
        quantity: Number(details.quantity || 0),
        drinking_from: details.drinkFrom ? Number(details.drinkFrom) : null,
        drinking_to: details.drinkTo ? Number(details.drinkTo) : null,
        notes: details.notes || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', wine.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Edit wine error:', error);
      return null;
    }

    const updatedWine = wineFromDatabase(data);
    updateWineInState(updatedWine);
    openWine(updatedWine);
    return updatedWine;
  }

  if (screen === 'detail' && selectedWine) {
    return (
      <WineDetail
        wine={selectedWine}
        onBack={() => setScreen('home')}
        onAddOne={() => changeQuantity(selectedWine, 1)}
        onConsumeOne={() => changeQuantity(selectedWine, -1)}
        onEdit={() => setScreen('edit')}
        savePhotoForWine={savePhotoForWine}
      />
    );
  }

  if (screen === 'edit' && selectedWine) {
    return (
      <EditWine
        wine={selectedWine}
        onBack={() => setScreen('detail')}
        onSave={saveEditedWine}
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

  if (screen === 'manual') {
    return (
      <AddManual
        onBack={() => setScreen('home')}
        onCreateWine={createWine}
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
      onAddManual={() => setScreen('manual')}
    />
  );
}
