export type PriceRow = { name: string; qty: number; unit: string; unitPrice: number; vat: number; };

export function summarize(rows: PriceRow[]) {
  const net = rows.reduce((s,r)=> s + (r.qty||0) * (r.unitPrice||0), 0);
  const vat = rows.reduce((s,r)=> s + (r.qty||0) * (r.unitPrice||0) * ((r.vat||0)/100), 0);
  const gross = net + vat;
  return { net, vat, gross };
}

export function priceTableHtml(rows: PriceRow[]) {
  const totals = summarize(rows);
  const body = rows.map(r => `
    <tr>
      <td>${r.name||''}</td>
      <td>${r.qty||0}</td>
      <td>${r.unit||''}</td>
      <td>${(r.unitPrice||0).toLocaleString('hu-HU')}</td>
      <td>${(r.vat||0)}%</td>
      <td>${(((r.qty||0)*(r.unitPrice||0))||0).toLocaleString('hu-HU')}</td>
    </tr>
  `).join('');
  return `
    <table>
      <thead><tr><th>Tétel</th><th>Menny.</th><th>Egység</th><th>Egységár</th><th>ÁFA</th><th>Nettó össz.</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot>
        <tr><td colspan="5"><b>Nettó összesen</b></td><td><b>${totals.net.toLocaleString('hu-HU')} HUF</b></td></tr>
        <tr><td colspan="5">ÁFA</td><td>${totals.vat.toLocaleString('hu-HU')} HUF</td></tr>
        <tr><td colspan="5"><b>Bruttó összesen</b></td><td><b>${totals.gross.toLocaleString('hu-HU')} HUF</b></td></tr>
      </tfoot>
    </table>
  `;
}
