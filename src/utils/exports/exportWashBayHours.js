import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportWashBayHoursPDF({ rows, selectedWasher, startDate, endDate }) {
  const rangeLabel = startDate && endDate
    ? `${moment(startDate).format('MMMM D, YYYY')} — ${moment(endDate).format('MMMM D, YYYY')}`
    : startDate ? `From ${moment(startDate).format('MMMM D, YYYY')}`
    : endDate   ? `Through ${moment(endDate).format('MMMM D, YYYY')}`
    : 'All Dates on Record';

  const grandMin = rows.reduce((s, r) => s + (r.order.elapsed_time_minutes || 0), 0);

  const fmtTime = (t) => {
    if (!t) return '—';
    if (t.includes('T')) return moment(t).format('HH:mm');
    return t.substring(0, 5);
  };

  const tableRows = rows.map((r, i) => {
    const { order, washer } = r;
    const elMin = order.elapsed_time_minutes || 0;
    const elHrs = (elMin / 60).toFixed(2);
    const dateStr = (order.assigned_date || order.completed_date)
      ? moment(order.assigned_date || order.completed_date).format('MM/DD/YYYY') : '—';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${washer}</strong></td>
        <td>${order.order_number || '—'}</td>
        <td>${order.bus_number || '—'}</td>
        <td>${dateStr}</td>
        <td>${fmtTime(order.start_time)}</td>
        <td>${fmtTime(order.end_time)}</td>
        <td><strong>${elMin}</strong></td>
        <td style="color:#142c5f;font-weight:700;">${elHrs}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Wash Bay Hours Record</title>
  <style>
    ${PRINT_BASE_CSS}
    .note-box { background:#fafbff; border:1px solid #b0bcdb; padding:8px 12px; font-size:9px; margin-bottom:12px; color:#444; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Wash Bay Operations</div>
    <div class="title">BUS WASH BAY HOURS RECORD — INDIVIDUAL TECHNICIAN CREDIT</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>WASHER / TECHNICIAN:</strong> ${selectedWasher || 'ALL WASHERS'}</div>
    <div class="meta-item"><strong>REPORTING PERIOD:</strong> ${rangeLabel}</div>
    <div class="meta-item"><strong>LINE ITEMS:</strong> ${rows.length}</div>
    <div class="meta-item"><strong>TOTAL MINUTES:</strong> ${grandMin}</div>
    <div class="meta-item"><strong>TOTAL HOURS:</strong> ${(grandMin/60).toFixed(2)}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY HH:mm')} ET</div>
  </div>
  <div class="note-box">
    NOTE: Each technician receives <strong>full elapsed time credit</strong> per wash. Multi-washer jobs appear as separate line items per person.
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>TECHNICIAN</th><th>ORDER #</th><th>BUS #</th>
        <th>DATE</th><th>START</th><th>END</th><th>MIN</th><th>HRS</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="7">TOTAL INDIVIDUAL WASH HOURS</td>
        <td>${grandMin} MIN</td>
        <td>${(grandMin/60).toFixed(2)} HRS</td>
      </tr>
    </tfoot>
  </table>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Wash Bay Hours</div>
  </body></html>`;

  printHtml(html);
}