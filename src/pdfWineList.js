import { jsPDF } from 'jspdf';

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

function sortWines(wines) {
  return [...wines].sort((a, b) => {
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
}

function groupWines(wines) {
  return sortWines(wines).reduce((groups, wine) => {
    const group = colourGroup(wine);
    const country = clean(wine.country) || 'Other';
    const region = clean(wine.region) || 'Other';
    if (!groups[group]) groups[group] = {};
    if (!groups[group][country]) groups[group][country] = {};
    if (!groups[group][country][region]) groups[group][country][region] = [];
    groups[group][country][region].push(wine);
    return groups;
  }, {});
}

function addFooter(doc, pageNumber) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 112, 106);
  doc.text(`My Cellar · ${monthYear()} · Page ${pageNumber}`, 105, 287, { align: 'center' });
}

function ensureSpace(doc, state, needed) {
  if (state.y + needed > 275) {
    addFooter(doc, state.page);
    doc.addPage();
    state.page += 1;
    state.y = 22;
  }
}

export function downloadWineListPdf(wines) {
  const inStock = wines.filter(wine => Number(wine.quantity || 0) > 0);
  const stats = {
    wines: inStock.length,
    bottles: inStock.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0),
    countries: new Set(inStock.map(wine => wine.country).filter(Boolean)).size,
    regions: new Set(inStock.map(wine => wine.region).filter(Boolean)).size
  };

  const grouped = groupWines(inStock);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(251, 250, 247);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(90, 29, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('INN FARM CELLAR', 105, 88, { align: 'center' });
  doc.setTextColor(23, 17, 15);
  doc.setFont('times', 'normal');
  doc.setFontSize(44);
  doc.text('Wine List', 105, 112, { align: 'center' });
  doc.setTextColor(90, 81, 77);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(monthYear(), 105, 128, { align: 'center' });
  doc.setDrawColor(222, 216, 207);
  doc.line(68, 145, 142, 145);
  doc.setTextColor(90, 29, 39);
  doc.setFontSize(11);
  doc.text(`${stats.wines} wines`, 105, 162, { align: 'center' });
  doc.text(`${stats.bottles} bottles`, 105, 172, { align: 'center' });
  doc.setTextColor(117, 107, 102);
  doc.setFontSize(9);
  doc.text('Current cellar selection', 105, 214, { align: 'center' });

  doc.addPage();
  const state = { y: 22, page: 2 };

  for (const group of groupOrder) {
    const countries = grouped[group];
    if (!countries) continue;
    ensureSpace(doc, state, 30);
    doc.setTextColor(90, 29, 39);
    doc.setFont('times', 'normal');
    doc.setFontSize(24);
    doc.text(group, 18, state.y);
    state.y += 4;
    doc.setDrawColor(222, 216, 207);
    doc.line(18, state.y, 192, state.y);
    state.y += 10;

    for (const [country, regions] of Object.entries(countries)) {
      ensureSpace(doc, state, 18);
      doc.setTextColor(23, 17, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(country.toUpperCase(), 18, state.y);
      state.y += 7;

      for (const [region, regionWines] of Object.entries(regions)) {
        ensureSpace(doc, state, 16);
        doc.setTextColor(90, 29, 39);
        doc.setFont('times', 'normal');
        doc.setFontSize(15);
        doc.text(region, 26, state.y);
        state.y += 6;

        for (const wine of regionWines) {
          ensureSpace(doc, state, 20);
          const producer = clean(wine.producer || wine.fullName);
          const name = clean(wine.name || wine.wine_name);
          const appellation = clean(wine.appellation);
          const vintage = clean(wine.vintage) || 'NV';
          doc.setTextColor(23, 17, 15);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(producer, 34, state.y);
          doc.setFont('times', 'normal');
          doc.setFontSize(11);
          doc.text(vintage, 192, state.y, { align: 'right' });
          state.y += 5;
          doc.setTextColor(62, 54, 50);
          doc.setFont('times', 'normal');
          doc.setFontSize(10.5);
          const nameLines = doc.splitTextToSize(name, 120);
          doc.text(nameLines, 34, state.y);
          state.y += nameLines.length * 5;
          if (appellation && !name.toLowerCase().includes(appellation.toLowerCase())) {
            doc.setTextColor(117, 107, 102);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(appellation, 34, state.y);
            state.y += 4;
          }
          doc.setDrawColor(238, 231, 223);
          doc.line(34, state.y + 1, 192, state.y + 1);
          state.y += 7;
        }
        state.y += 3;
      }
      state.y += 5;
    }
    state.y += 8;
  }

  addFooter(doc, state.page);
  doc.addPage();
  doc.setFillColor(251, 250, 247);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(23, 17, 15);
  doc.setFont('times', 'normal');
  doc.setFontSize(28);
  doc.text('Cellar Summary', 105, 108, { align: 'center' });
  doc.setTextColor(90, 81, 77);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`${stats.wines} wines · ${stats.bottles} bottles`, 105, 128, { align: 'center' });
  doc.text(`${stats.countries} countries · ${stats.regions} regions`, 105, 138, { align: 'center' });

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`inn-farm-cellar-wine-list-${today}.pdf`);
}
