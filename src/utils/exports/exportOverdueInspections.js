import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportOverdueInspectionsPDF({ buses }) {
  const rows = buses.map(b => `
    <tr>
      <td><strong>${b.bus_number || '—'}</strong></td>
      <td>${b.bus_type || '—'}</td>
      <td>${[b.year, b.make, b.model].filter(Boolean).join(' ') || '—'}</td>
      <td>${b.base_location || '—'}</td>
      <td style="color:#991b1b;font-weight:700;">${moment(b.next_inspection_due).format('MM/DD/YYYY')}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Overdue Inspections</title>
  <style>${PRINT_BASE_CSS}</style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation — Vehicle Surveillance System</div>
    <div class="title">OVERDUE INSPECTIONS REPORT</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong style="color:#991b1b;">TOTAL OVERDUE:</strong> ${buses.length} vehicle(s)</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY HH:mm')} ET</div>
  </div>
  <table>
    <thead>
      <tr><th>BUS #</th><th>TYPE</th><th>YEAR / MAKE / MODEL</th><th>BASE</th><th>DUE DATE</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="page-footer">NHCS Transportation — Vehicle Surveillance System | Powered by Base44</div>
  </body></html>`;

  printHtml(html);
}