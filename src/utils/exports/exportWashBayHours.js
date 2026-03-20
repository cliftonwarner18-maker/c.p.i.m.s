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

  // Group by date for daily summary
  const byDate = {};
  rows.forEach(r => {
    const date = (r.order.assigned_date || r.order.completed_date)
      ? moment(r.order.assigned_date || r.order.completed_date).format('YYYY-MM-DD')
      : 'unknown';
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(r);
  });

  // Group by washer for per-person summary
  const byWasher = {};
  rows.forEach(r => {
    const washer = r.washer;
    if (!byWasher[washer]) byWasher[washer] = [];
    byWasher[washer].push(r);
  });

  // Generate per-person summary
  const washerSummaryRows = Object.entries(byWasher)
    .sort()
    .map(([name, items]) => {
      const totalMin = items.reduce((s, r) => s + (r.order.elapsed_time_minutes || 0), 0);
      const totalHrs = (totalMin / 60).toFixed(2);
      return `<tr><td><strong>${name}</strong></td><td>${items.length}</td><td>${totalMin}</td><td>${totalHrs}</td></tr>`;
    })
    .join('');

  // Generate daily summary
  const dailySummaryRows = Object.entries(byDate)
    .sort()
    .map(([date, items]) => {
      const dateStr = date !== 'unknown' ? moment(date).format('dddd, MMMM D, YYYY') : 'Unknown Date';
      const buses = [...new Set(items.map(r => r.order.bus_number))].filter(Boolean).sort();
      const totalMin = items.reduce((s, r) => s + (r.order.elapsed_time_minutes || 0), 0);
      const totalHrs = (totalMin / 60).toFixed(2);
      const techCount = [...new Set(items.map(r => r.washer))].length;
      return `<tr><td><strong>${dateStr}</strong></td><td>${techCount}</td><td>${items.length}</td><td>${buses.join(', ')}</td><td>${totalMin}</td><td>${totalHrs}</td></tr>`;
    })
    .join('');

  // Generate detailed activity table
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
        <td>${elMin}</td>
        <td><strong>${elHrs}</strong></td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Wash Bay Hours Report</title>
  <style>
    ${PRINT_BASE_CSS}
    .note-box { background:#fafbff; border:1px solid #b0bcdb; padding:8px 12px; font-size:9px; margin-bottom:12px; color:#444; }
    .section-subheader { background:#e8ecf5; padding:6px 10px; font-size:10px; font-weight:700; margin-top:16px; margin-bottom:8px; border-left:3px solid #1e3c78; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Wash Bay Operations</div>
    <div class="title">DETAILED WASH BAY HOURS REPORT — ADMINISTRATOR REVIEW</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>FILTER:</strong> ${selectedWasher || 'ALL WASHERS'}</div>
    <div class="meta-item"><strong>REPORTING PERIOD:</strong> ${rangeLabel}</div>
    <div class="meta-item"><strong>TOTAL ORDERS:</strong> ${rows.length}</div>
    <div class="meta-item"><strong>TOTAL HOURS:</strong> ${(grandMin/60).toFixed(2)} hrs</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY HH:mm')} ET</div>
  </div>

  <div class="section-header">SUMMARY BY TECHNICIAN</div>
  <table style="margin-bottom:20px;">
    <thead><tr><th>TECHNICIAN</th><th>WASHES</th><th>MINUTES</th><th>HOURS</th></tr></thead>
    <tbody>${washerSummaryRows}</tbody>
  </table>

  <div class="section-header">SUMMARY BY DAY</div>
  <table style="margin-bottom:20px;">
    <thead><tr><th>DATE</th><th>TECHS</th><th>WASHES</th><th>BUSES COMPLETED</th><th>MINUTES</th><th>HOURS</th></tr></thead>
    <tbody>${dailySummaryRows}</tbody>
  </table>

  <div class="section-header">DETAILED ACTIVITY LOG</div>
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
        <td colspan="7">TOTAL HOURS</td>
        <td>${grandMin}</td>
        <td><strong>${(grandMin/60).toFixed(2)}</strong></td>
      </tr>
    </tfoot>
  </table>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Wash Bay Hours Report</div>
  </body></html>`;

  printHtml(html);
}