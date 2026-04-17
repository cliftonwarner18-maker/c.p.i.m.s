import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportSerializedPDF({ assets, statusFilter = 'All', assetTypeFilter = 'All' }) {
  const now = moment().format('MM/DD/YYYY HH:mm');

  const rows = assets.map(a => `
    <tr>
      <td><strong>${a.asset_number || '—'}</strong></td>
      <td>${a.brand || '—'}</td>
      <td>${a.model || '—'}</td>
      <td>${a.serial_number || '—'}</td>
      <td>${a.asset_type || 'DVR'}</td>
      <td style="font-weight:700;color:${a.status === 'In-Service' ? '#166534' : a.status === 'Decommissioned' ? '#991b1b' : '#555'}">${a.status || '—'}</td>
      <td>${a.assigned_bus_number || '—'}</td>
      <td>${a.current_location || '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Serialized Assets Report</title>
  <style>
    ${PRINT_BASE_CSS}
    table { font-size: 9.5px; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Asset Management</div>
    <div class="title">SERIALIZED ASSETS — DVR &amp; HIGH VALUE EQUIPMENT INVENTORY</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>STATUS FILTER:</strong> ${statusFilter}</div>
    <div class="meta-item"><strong>TYPE FILTER:</strong> ${assetTypeFilter}</div>
    <div class="meta-item"><strong>TOTAL RECORDS:</strong> ${assets.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${now}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>ASSET #</th><th>BRAND</th><th>MODEL</th><th>SERIAL #</th>
        <th>TYPE</th><th>STATUS</th><th>BUS #</th><th>LOCATION</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="7">TOTAL RECORDS</td>
        <td>${assets.length}</td>
      </tr>
    </tfoot>
  </table>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Serialized Assets</div>
  </body></html>`;

  printHtml(html);
}