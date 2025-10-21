export function offerHtml(params: {
  title: string;
  companyName?: string;
  aiBodyHtml: string;   // <<< fontos: AI szöveg ehhez a kulcshoz kötve
  priceTableHtml: string;
}) {
  const { title, companyName, aiBodyHtml, priceTableHtml } = params;
  return `<!doctype html><html><head>
<meta charset="utf-8" />
<style>
  body { font-family: Arial, sans-serif; padding: 28px; color:#111; }
  h1 { font-size:20px; margin-bottom:8px; }
  h2 { font-size:16px; margin-top:18px; }
  table { width:100%; border-collapse: collapse; margin-top:12px; }
  th, td { border:1px solid #e5e5e5; padding:8px; text-align:left; }
  .muted { color:#666; font-size:12px; margin-top:24px; }
</style></head><body>
  <h1>${title || 'Árajánlat'}</h1>
  ${companyName ? `<div class="muted">${companyName}</div>` : ``}
  <div>${aiBodyHtml}</div>
  <h2>Árkalkuláció</h2>
  ${priceTableHtml}
  <div class="muted">Megjegyzés: AI által generált tartalom; kiküldés előtt ellenőrizze.</div>
</body></html>`;
}
