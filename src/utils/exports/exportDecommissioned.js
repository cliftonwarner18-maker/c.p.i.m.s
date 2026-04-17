import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportDecommissionedPDF({ assets, statusFilter = 'All', startDate = '', endDate = '' }) {
  const now = moment().format('MM/DD/YYYY HH:mm');

  const rows = assets.map((a, i) => `
    <tr>
      <td>${a.out_of_service_date || '—'}</td>
      <td>${a.employee || '—'}</td>
      <td>${a.bus_number || '—'}</td>
      <td><strong>${a.make || '—'} ${a.model || ''}</strong></td>
      <td>${a.serial_number || '—'}</td>
      <td>${a.asset_number || '—'}</td>
      <td>${a.decom_status || '—'}</td>
      <td>${a.current_location || '—'}</td>
      <td style="text-align:center;font-weight:700;color:${a.out_of_inventory ? '#991b1b' : '#555'}">${a.out_of_inventory ? 'YES' : 'NO'}</td>
      <td style="max-width:160px;font-size:9px;">${a.oos_reason || '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Decommissioned Assets Report</title>
  <style>
    ${PRINT_BASE_CSS}
    @page { size: letter landscape; margin: 0.4in 0.5in; }
    table { font-size: 8.5px; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Asset Management</div>
    <div class="title">DECOMMISSIONED ASSETS — SALVAGE &amp; DISPOSAL LOG</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>STATUS FILTER:</strong> ${statusFilter}</div>
    ${startDate ? `<div class="meta-item"><strong>FROM:</strong> ${startDate}</div>` : ''}
    ${endDate ? `<div class="meta-item"><strong>TO:</strong> ${endDate}</div>` : ''}
    <div class="meta-item"><strong>TOTAL RECORDS:</strong> ${assets.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${now}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>OOS DATE</th><th>EMPLOYEE</th><th>BUS #</th><th>MAKE / MODEL</th>
        <th>SERIAL #</th><th>ASSET #</th><th>DECOM STATUS</th><th>LOCATION</th>
        <th>OUT OF INV.</th><th>OOS REASON</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="9">TOTAL RECORDS</td>
        <td>${assets.length}</td>
      </tr>
    </tfoot>
  </table>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Decommissioned Assets</div>
  </body></html>`;

  printHtml(html);
}