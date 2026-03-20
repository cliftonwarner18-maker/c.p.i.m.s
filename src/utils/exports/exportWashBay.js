import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportWashBayPDF({ orders, totalHours, hoursByWasher }) {
  const washerSummary = Object.entries(hoursByWasher)
    .map(([w, h]) => `<tr><td>${w}</td><td><strong>${h.toFixed(2)} hrs</strong></td></tr>`)
    .join('');

  const rows = orders.map(o => {
    const hrs = ((o.elapsed_time_minutes || 0) / 60).toFixed(2);
    return `
      <tr>
        <td><strong>${o.order_number || '—'}</strong></td>
        <td>${o.assigned_date || '—'}</td>
        <td><strong>${o.bus_number || '—'}</strong></td>
        <td><span class="badge badge-${(o.status||'').toLowerCase().replace(' ','-')}">${o.status || '—'}</span></td>
        <td>${(o.washers || []).join(', ') || '—'}</td>
        <td>${o.start_time || '—'}</td>
        <td>${o.end_time || '—'}</td>
        <td><strong>${hrs} hrs</strong></td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Wash Bay Report</title>
  <style>${PRINT_BASE_CSS}</style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Summer Wash Bay Hours</div>
    <div class="title">BUS WASH ORDERS REPORT</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>TOTAL ORDERS:</strong> ${orders.length}</div>
    <div class="meta-item"><strong>TOTAL HOURS:</strong> ${totalHours.toFixed(2)} hrs</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY [at] HH:mm')} ET</div>
  </div>

  <div class="section-header">SUMMARY BY WASHER</div>
  <table style="width:auto;min-width:300px;">
    <thead><tr><th>WASHER / TECHNICIAN</th><th>HOURS</th></tr></thead>
    <tbody>${washerSummary || '<tr><td colspan="2">No completed washes</td></tr>'}</tbody>
  </table>

  <div class="section-header" style="margin-top:16px;">WASH ORDER LOG</div>
  <table>
    <thead>
      <tr>
        <th>ORDER #</th><th>DATE</th><th>BUS #</th><th>STATUS</th>
        <th>WASHERS</th><th>START</th><th>END</th><th>HOURS</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="7">TOTAL HOURS</td>
        <td>${totalHours.toFixed(2)} hrs</td>
      </tr>
    </tfoot>
  </table>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Wash Bay Hours Tracking</div>
  </body></html>`;

  printHtml(html);
}