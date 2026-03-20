/**
 * Opens a styled HTML string in a new window and triggers the browser print dialog.
 * The window auto-closes after print/cancel.
 */
export function printHtml(htmlContent) {
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 400);
}

/** Shared page CSS injected into every printed document */
export const PRINT_BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier Prime', 'Courier New', monospace;
    font-size: 11px;
    color: #111;
    background: white;
  }
  @page { size: letter; margin: 0.55in 0.5in; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  /* Layout helpers */
  .page-header {
    background: linear-gradient(to right, #142c5f, #1e3a7a);
    color: white;
    padding: 14px 18px 10px;
    margin-bottom: 0;
  }
  .page-header .org { font-size: 14px; font-weight: 700; letter-spacing: 0.08em; }
  .page-header .dept { font-size: 10px; opacity: 0.8; margin-top: 2px; }
  .page-header .title { font-size: 13px; font-weight: 700; color: #c8a830; margin-top: 6px; letter-spacing: 0.07em; }
  .gold-bar { background: #b88c28; height: 3px; margin-bottom: 14px; }
  .meta-box {
    background: #edf1fc;
    border: 1px solid #142c5f;
    padding: 10px 14px;
    margin-bottom: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 10px;
  }
  .meta-box .meta-item strong { color: #142c5f; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead tr { background: #142c5f; color: white; }
  thead th { padding: 6px 8px; text-align: left; font-weight: 700; letter-spacing: 0.05em; font-size: 9px; }
  tbody tr:nth-child(even) { background: #f5f7fd; }
  tbody tr:nth-child(odd) { background: white; }
  tbody td { padding: 5px 8px; border-bottom: 1px solid #dde2ee; vertical-align: top; }
  .totals-row td { background: #142c5f !important; color: #c8a830; font-weight: 700; padding: 7px 8px; }
  .section-header {
    background: #142c5f;
    color: white;
    padding: 5px 10px;
    font-weight: 700;
    font-size: 10px;
    letter-spacing: 0.06em;
    margin: 14px 0 4px;
  }
  .page-footer {
    background: #142c5f;
    color: #c8d4ee;
    font-size: 8px;
    text-align: center;
    padding: 7px;
    margin-top: 20px;
  }
  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 2px;
    font-size: 9px;
    font-weight: 700;
  }
  .badge-pending   { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
  .badge-progress  { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
  .badge-completed { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .badge-cancelled { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .pass { color: #166534; font-weight: 700; }
  .fail { color: #991b1b; font-weight: 700; }
`;