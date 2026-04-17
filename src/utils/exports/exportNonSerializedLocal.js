import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportNonSerializedPDF({ assets }) {
  const now = moment().format('MM/DD/YYYY HH:mm');
  const lowStock = assets.filter(a => a.low_level_threshold > 0 && (a.quantity_on_hand || 0) <= a.low_level_threshold);

  const rows = assets.map(a => {
    const isLow = a.low_level_threshold > 0 && (a.quantity_on_hand || 0) <= a.low_level_threshold;
    return `
    <tr style="${isLow ? 'background:#fef2f2;' : ''}">
      <td>${isLow ? '⚠ ' : ''}<strong>${a.part_name || '—'}</strong></td>
      <td>${a.brand || '—'}</td>
      <td>${a.model_number || '—'}</td>
      <td>${a.use || '—'}</td>
      <td style="text-align:center;font-weight:700;color:${isLow ? '#991b1b' : '#166534'}">${a.quantity_on_hand || 0}</td>
      <td style="text-align:center">${a.low_level_threshold > 0 ? a.low_level_threshold : '—'}</td>
      <td>${a.current_location || '—'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Non-Serialized Assets Report</title>
  <style>
    ${PRINT_BASE_CSS}
    table { font-size: 10px; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Spare Parts Inventory</div>
    <div class="title">NON-SERIALIZED ASSETS — SPARE PARTS INVENTORY</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>TOTAL PARTS:</strong> ${assets.length}</div>
    <div class="meta-item"><strong>LOW STOCK ALERTS:</strong> ${lowStock.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${now}</div>
  </div>
  ${lowStock.length > 0 ? `
  <div style="background:#fef2f2;border:1px solid #fca5a5;padding:6px 10px;margin-bottom:10px;font-size:10px;font-weight:700;color:#991b1b;">
    ⚠ LOW STOCK ALERT: ${lowStock.map(a => `${a.part_name} (qty: ${a.quantity_on_hand || 0}, threshold: ${a.low_level_threshold})`).join(' | ')}
  </div>` : ''}
  <table>
    <thead>
      <tr>
        <th>PART NAME</th><th>BRAND</th><th>MODEL #</th><th>USE / PURPOSE</th>
        <th>QTY</th><th>LOW THRESHOLD</th><th>LOCATION</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="6">TOTAL PART TYPES</td>
        <td>${assets.length}</td>
      </tr>
    </tfoot>
  </table>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Spare Parts Inventory</div>
  </body></html>`;

  printHtml(html);
}