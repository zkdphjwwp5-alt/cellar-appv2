export async function downloadWineListPdf(wines) {
  const response = await fetch('/api/wine-list-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ wines })
  });

  if (!response.ok) {
    throw new Error('Could not generate wine list PDF.');
  }

  const blob = await response.blob();
  const today = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `inn-farm-cellar-wine-list-${today}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
