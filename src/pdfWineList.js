import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

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

function wineRows(regionWines) {
  return regionWines.map(wine => {
    const producer = clean(wine.producer || wine.fullName);
    const name = clean(wine.name || wine.wine_name);
    const appellation = clean(wine.appellation);
    const vintage = clean(wine.vintage) || 'NV';

    const stack = [{ text: producer, style: 'producer' }, { text: name, style: 'wineName' }];

    if (appellation && !name.toLowerCase().includes(appellation.toLowerCase())) {
      stack.push({ text: appellation, style: 'appellation' });
    }

    return {
      margin: [22, 4, 0, 7],
      unbreakable: true,
      columns: [
        { width: '*', stack },
        { width: 50, text: vintage, style: 'vintage', alignment: 'right' }
      ]
    };
  });
}

export function downloadWineListPdf(wines) {
  const inStock = wines.filter(wine => Number(wine.quantity || 0) > 0);
  const grouped = groupWines(inStock);

  const stats = {
    wines: inStock.length,
    bottles: inStock.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0),
    countries: new Set(inStock.map(wine => wine.country).filter(Boolean)).size,
    regions: new Set(inStock.map(wine => wine.region).filter(Boolean)).size
  };

  const content = [
    { text: 'INN FARM CELLAR', style: 'coverKicker', alignment: 'center', margin: [0, 170, 0, 14] },
    { text: 'Wine List', style: 'coverTitle', alignment: 'center' },
    { text: monthYear(), style: 'coverDate', alignment: 'center', margin: [0, 16, 0, 28] },
    { canvas: [{ type: 'line', x1: 165, y1: 0, x2: 350, y2: 0, lineWidth: 0.8, lineColor: '#ded8cf' }] },
    { text: `${stats.wines} wines\n${stats.bottles} bottles`, style: 'coverStats', alignment: 'center', margin: [0, 26, 0, 0], pageBreak: 'after' }
  ];

  for (const group of groupOrder) {
    const countries = grouped[group];
    if (!countries) continue;

    content.push({ text: group, style: 'sectionTitle', margin: [0, 0, 0, 8] });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.8, lineColor: '#ded8cf' }], margin: [0, 0, 0, 12] });

    for (const [country, regions] of Object.entries(countries)) {
      content.push({ text: country.toUpperCase(), style: 'country', margin: [0, 12, 0, 6] });

      for (const [region, regionWines] of Object.entries(regions)) {
        content.push({ text: region, style: 'region', margin: [12, 6, 0, 4] });
        content.push(...wineRows(regionWines));
      }
    }

    content.push({ text: '', margin: [0, 16, 0, 0], pageBreak: 'after' });
  }

  content.push(
    { text: 'Cellar Summary', style: 'summaryTitle', alignment: 'center', margin: [0, 220, 0, 18] },
    { text: `${stats.wines} wines · ${stats.bottles} bottles\n${stats.countries} countries · ${stats.regions} regions`, style: 'summaryText', alignment: 'center' }
  );

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 44, 40, 52],
    background: () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 841.89, color: '#fbfaf7' }] }),
    footer: (currentPage, pageCount) => ({
      text: currentPage === 1 ? '' : `My Cellar · ${monthYear()} · Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#756b66',
      margin: [0, 14, 0, 0]
    }),
    content,
    defaultStyle: { font: 'Roboto', color: '#17110f' },
    styles: {
      coverKicker: { fontSize: 10, color: '#5a1d27', bold: true },
      coverTitle: { fontSize: 54, color: '#17110f' },
      coverDate: { fontSize: 12, color: '#5a514d' },
      coverStats: { fontSize: 12, color: '#5a1d27', lineHeight: 1.5 },
      sectionTitle: { fontSize: 28, color: '#5a1d27' },
      country: { fontSize: 9, bold: true, color: '#17110f' },
      region: { fontSize: 16, color: '#5a1d27' },
      producer: { fontSize: 10.5, bold: true, color: '#17110f' },
      wineName: { fontSize: 10.5, color: '#3e3632', margin: [0, 2, 0, 0] },
      appellation: { fontSize: 8.5, color: '#756b66', margin: [0, 2, 0, 0] },
      vintage: { fontSize: 11, color: '#17110f' },
      summaryTitle: { fontSize: 28, color: '#17110f' },
      summaryText: { fontSize: 12, color: '#5a514d', lineHeight: 1.4 }
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  pdfMake.createPdf(docDefinition).download(`inn-farm-cellar-wine-list-${today}.pdf`);
}
