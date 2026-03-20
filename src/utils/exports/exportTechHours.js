import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportTechHoursPDF({ allItems, selectedTech, startDate, endDate, totalMinutes }) {
  const rangeLabel = startDate && endDate
    ? `${moment(startDate).format('MMMM D, YYYY')} — ${moment(endDate).format('MMMM D, YYYY')}`
    : startDate ? `From ${moment(startDate).format('MMMM D, YYYY')}`
    : endDate   ? `Through ${moment(endDate).format('MMMM D, YYYY')}`
    : 'All Dates on Record';

  // Group by technician
  const byTech = {};
  allItems.forEach(item => {
    const tech = item.tech || 'Unknown';
    if (!byTech[tech]) byTech[tech] = [];
    byTech[tech].push(item);
  });

  // Group by date
  const byDate = {};
  allItems.forEach(item => {
    const date = item.dateRef ? moment(item.dateRef).format('YYYY-MM-DD') : 'unknown';
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(item);
  });

  // Generate per-technician summary
  const techSummaryRows = Object.entries(byTech)
    .sort()
    .map(([tech, items]) => {
      const totalMin = items.reduce((s, i) => s + (i.elapsed || 0), 0);
      const totalHrs = (totalMin / 60).toFixed(2);
      return `<tr><td><strong>${tech}</strong></td><td>${items.length}</td><td>${totalMin}</td><td>${totalHrs}</td></tr>`;
    })
    .join('');

  // Generate daily summary
  const dailySummaryRows = Object.entries(byDate)
    .sort()
    .map(([date, items]) => {
      const dateStr = date !== 'unknown' ? moment(date).format('dddd, MMMM D, YYYY') : 'Unknown Date';
      const buses = [...new Set(items.map(i => i.bus_number))].filter(Boolean).sort();
      const totalMin = items.reduce((s, i) => s + (i.elapsed || 0), 0);
      const totalHrs = (totalMin / 60).toFixed(2);
      const techCount = [...new Set(items.map(i => i.tech))].length;
      return `<tr><td><strong>${dateStr}</strong></td><td>${techCount}</td><td>${items.length}</td><td>${buses.join(', ') || '—'}</td><td>${totalMin}</td><td>${totalHrs}</td></tr>`;
    })
    .join('');

  const rows = allItems.map((item, i) => {
    const elMin = item.elapsed || 0;
    const elHrs = (elMin / 60).toFixed(2);
    const dateStr = item.dateRef ? moment(item.dateRef).format('MM/DD/YY') : '—';
    const startStr = item.start ? moment(item.start).format('HH:mm') : '—';
    const endStr = item.end ? moment(item.end).format('HH:mm') : '—';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${item.tech || '—'}</strong></td>
        <td>${item.order_number || '—'}</td>
        <td>${item.bus_number || '—'}</td>
        <td>${item.wo_type || '—'}</td>
        <td>${dateStr}</td>
        <td>${startStr}</td>
        <td>${endStr}</td>
        <td>${elMin}</td>
        <td><strong>${elHrs}</strong></td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Technician Labor Hours Record</title>
  <style>
    ${PRINT_BASE_CSS}
    .section-subheader { background:#e8ecf5; padding:6px 10px; font-size:10px; font-weight:700; margin-top:16px; margin-bottom:8px; border-left:3px solid #1e3c78; }
    .cert-box { border:1px solid #142c5f; padding:14px; margin-top:18px; font-size:9px; }
    .cert-box .cert-title { font-weight:700; color:#142c5f; font-size:10px; border-bottom:1px solid #142c5f; padding-bottom:4px; margin-bottom:8px; }
    .sig-line { margin-top:24px; display:flex; gap:40px; }
    .sig-block { flex:1; border-top:1px solid #888; padding-top:4px; font-size:9px; color:#555; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Data-TraCs System</div>
    <div class="title">DETAILED TECHNICIAN LABOR HOURS RECORD — ADMINISTRATOR REVIEW</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>FILTER:</strong> ${selectedTech || 'ALL TECHNICIANS'}</div>
    <div class="meta-item"><strong>REPORTING PERIOD:</strong> ${rangeLabel}</div>
    <div class="meta-item"><strong>TOTAL LABOR ITEMS:</strong> ${allItems.length}</div>
    <div class="meta-item"><strong>TOTAL HOURS:</strong> ${(totalMinutes/60).toFixed(2)} hrs</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY HH:mm')} ET</div>
  </div>

  <div class="section-header">SUMMARY BY TECHNICIAN</div>
  <table style="margin-bottom:20px;">
    <thead><tr><th>TECHNICIAN</th><th>LABOR ITEMS</th><th>MINUTES</th><th>HOURS</th></tr></thead>
    <tbody>${techSummaryRows}</tbody>
  </table>

  <div class="section-header">SUMMARY BY DAY</div>
  <table style="margin-bottom:20px;">
    <thead><tr><th>DATE</th><th>TECHS</th><th>ITEMS</th><th>BUSES WORKED</th><th>MINUTES</th><th>HOURS</th></tr></thead>
    <tbody>${dailySummaryRows}</tbody>
  </table>

  <div class="section-header">DETAILED LABOR ACTIVITY LOG</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>TECHNICIAN</th><th>ORDER #</th><th>BUS #</th><th>TYPE</th>
        <th>DATE</th><th>START</th><th>END</th><th>MIN</th><th>HRS</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="8">TOTAL LABOR HOURS</td>
        <td>${totalMinutes}</td>
        <td><strong>${(totalMinutes/60).toFixed(2)}</strong></td>
      </tr>
    </tfoot>
  </table>

  <div class="cert-box">
    <div class="cert-title">CERTIFICATION &amp; APPROVAL</div>
    <p>I certify that the hours recorded above are accurate and represent actual labor performed on New Hanover County Schools Transportation Department Data-TraCs System during the reporting period indicated.</p>
    <div class="sig-line">
      <div class="sig-block">
        Supervisor Signature / Date
      </div>
      <div class="sig-block">
        Transportation Director / Date
      </div>
    </div>
  </div>

  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Vehicle Surveillance Systems</div>
  </body></html>`;

  printHtml(html);
}