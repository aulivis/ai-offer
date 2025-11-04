export const BASE_STYLES = `
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,Arial,sans-serif;color:var(--text-default);background:var(--bg-canvas)}
  .section{padding:24px 28px;background:var(--bg-section);border-radius:8px}
  .card{border:1px solid var(--border-muted);border-radius:8px;padding:16px;background:#fff}
  .btn-primary{background:var(--brand-primary);color:var(--text-onPrimary);padding:8px 12px;border-radius:6px}
  .table{width:100%;border-collapse:collapse}
  .table th{background:var(--primary-50);text-align:left;padding:8px;border-bottom:1px solid var(--border-muted)}
  .table td{padding:8px;border-bottom:1px solid var(--border-muted)}
  header.doc-header{display:flex;gap:16px;align-items:center;margin-bottom:20px}
  .brand-logo{height:36px;max-width:180px;object-fit:contain}
  .brand-fallback{font-weight:700}
`;
