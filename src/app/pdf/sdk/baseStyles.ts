export const BASE_STYLES = `
  *{box-sizing:border-box}
  html{height:100%;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
  body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:var(--text-default);background:var(--bg-canvas);line-height:1.5;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
  img{max-width:100%;height:auto;display:block}
  .section{padding:24px 28px;background:var(--bg-section);border-radius:8px;break-inside:avoid;page-break-inside:avoid}
  .card{border:1px solid var(--border-muted);border-radius:8px;padding:16px;background:#fff;break-inside:avoid;page-break-inside:avoid}
  .btn-primary{background:var(--brand-primary);color:var(--text-onPrimary);padding:8px 12px;border-radius:6px}
  .table{width:100%;border-collapse:collapse;break-inside:auto}
  .table thead{display:table-header-group}
  .table tfoot{display:table-footer-group}
  .table th{background:var(--primary-50);text-align:left;padding:8px;border-bottom:1px solid var(--border-muted);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .table td{padding:8px;border-bottom:1px solid var(--border-muted)}
  .table tr{break-inside:avoid;page-break-inside:avoid}
  header.doc-header{display:flex;gap:16px;align-items:center;margin-bottom:20px;break-inside:avoid;page-break-inside:avoid}
  .brand-logo{height:36px;max-width:180px;object-fit:contain}
  .brand-fallback{font-weight:700}
  h1,h2,h3,h4,h5,h6{break-after:avoid;page-break-after:avoid;break-inside:avoid;page-break-inside:avoid}
  p{orphans:3;widows:3}
  @media print{
    body{background:#fff;color:#000}
    .section,.card{break-inside:avoid;page-break-inside:avoid}
    .table{break-inside:auto}
    .table thead{display:table-header-group}
    .table tbody tr{break-inside:avoid;page-break-inside:avoid}
    img{max-width:100%!important;height:auto!important}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
  }
`;
