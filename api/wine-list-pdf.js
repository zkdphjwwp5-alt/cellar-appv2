import PDFDocument from 'pdfkit';

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

function addFooter(doc) {
  const page = doc.bufferedPageRange().count;
  doc.font('Helvetica').fontSize(8).fillColor('#777777');
  doc.text(`My Cellar - ${monthYear()} - Page ${page}`, 54, 805, { align: 'center', width: 487 });
}

function ensureSpace(doc, needed = 70) {
  if (doc.y > 760 - needed) {
    addFooter(doc);
    doc.addPage();
  }
}

function addCover(doc, stats) {
  doc.rect(0, 0, 595, 842).fill('#fbfaf7');

  doc.fillColor('#5a1d27').font('Helvetica').fontSize(10).characterSpacing(2);
  doc.text('INN FARM CELLAR', 54, 235, { align: 'center', width: 487 });

  doc.characterSpacing(0).fillColor('#17110f').font('Times-Roman').fontSize(56);
  doc.text('Wine List', 54, 270, { align: 'center', width: 487 });

  doc.font('Helvetica').fontSize(13).fillColor('#5a514d');
  doc.text(monthYear(), 54, 340, { align: 'center', width: 487 });

  doc.moveTo(190, 385).lineTo(405, 385).strokeColor('#ded8cf').lineWidth(1).stroke();

  doc.font('Helvetica').fontSize(12).fillColor('#5a1d27');
  doc.text(`${stats.wines} wines`, 54, 420, { align: 'center', width: 487 });
  doc.text(`${stats.bottles} bottles`, 54, 442, { align: 'center', width: 487 });

  doc.font('Helvetica').fontSize(9).fillColor('#756b66');
  doc.text('Current cellar selection', 54, 560, { align: 'center', width: 487 });

  doc.addPage();
}

function addSectionTitle(doc, title) {
  ensureSpace(doc, 90);
  doc.moveDown(0.8);
  doc.font('Times-Roman').fontSize(26).fillColor('#5a1d27');
  doc.text(title, 54, doc.y);
  doc.moveTo(54, doc.y + 4).lineTo(541, doc.y + 4).strokeColor('#ded8cf').lineWidth(1).stroke();
  doc.moveDown(1.2);
}

function addCountry(doc, country) {
  ensureSpace(doc, 45);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#17110f');
  doc.text(country.toUpperCase(), 54, doc.y, { characterSpacing: 1.5 });
  doc.moveDown(0.45);
}

function addRegion(doc, region) {
  ensureSpace(doc, 38);
  doc.font('Times-Roman').fontSize(15).fillColor('#5a1d27');
  doc.text(region, 72, doc.y);
  doc.moveDown(0.2);
}

function addWine(doc, wine) {
  ensureSpace(doc, 42);

  const producer = clean(wine.producer || wine.fullName);
  const name = clean(wine.name || wine.wine_name);
  const appellation = clean(wine.appellation);
  const vintage = clean(wine.vintage) || 'NV';

  const startY = doc.y;

  doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#17110f');
  doc.text(producer, 90, startY, { width: 330 });

  doc.font('Times-Roman').fontSize(11).fillColor('#3e3632');
  doc.text(name, 90, doc.y + 2, { width: 330 });

  if (appellation && !name.toLowerCase().includes(appellation.toLowerCase())) {
    doc.font('Helvetica').fontSize(8.5).fillColor('#756b66');
    doc.text(appellation, 90, doc.y + 1, { width: 330 });
  }

  doc.font('Times-Roman').fontSize(12).fillColor('#17110f');
  doc.text(vintage, 468, startY, { width: 73, align: 'right' });

  doc.moveTo(90, doc.y + 6).lineTo(541, doc.y + 6).strokeColor('#eee7df').lineWidth(0.5).stroke();
  doc.y += 12;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const wines = Array.isArray(req.body?.wines) ? req.body.wines : [];
    const inStock = wines.filter(wine => Number(wine.quantity || 0) > 0);
    const stats = {
      wines: inStock.length,
      bottles: inStock.reduce((sum, wine) => sum + Number(wine.quantity || 0), 0)
    };
    const grouped = groupWines(inStock);

    const buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 54,
        bufferPages: true,
        info: {
          Title: 'Inn Farm Cellar Wine List',
          Author: 'My Cellar'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      addCover(doc, stats);

      doc.fillColor('#fbfaf7').rect(0, 0, 595, 842).fill('#fbfaf7');
      doc.fillColor('#17110f');
      doc.y = 54;

      for (const group of groupOrder) {
        const countries = grouped[group];
        if (!countries) continue;

        addSectionTitle(doc, group);

        for (const [country, regions] of Object.entries(countries)) {
          addCountry(doc, country);

          for (const [region, regionWines] of Object.entries(regions)) {
            addRegion(doc, region);

            for (const wine of regionWines) {
              addWine(doc, wine);
            }
          }
        }
      }

      ensureSpace(doc, 120);
      doc.addPage();
      doc.rect(0, 0, 595, 842).fill('#fbfaf7');
      doc.fillColor('#17110f').font('Times-Roman').fontSize(28);
      doc.text('Cellar Summary', 54, 260, { align: 'center', width: 487 });
      doc.font('Helvetica').fontSize(12).fillColor('#5a514d');
      doc.text(`${stats.wines} wines - ${stats.bottles} bottles`, 54, 312, { align: 'center', width: 487 });

      const range = doc.bufferedPageRange();
      for (let i = range.start + 1; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        addFooter(doc);
      }

      doc.end();
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inn-farm-cellar-wine-list.pdf"`);
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({ error: String(error.message || error) });
  }
}
