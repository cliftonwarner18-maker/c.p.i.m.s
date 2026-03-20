import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportTechHoursPDF({ allItems, selectedTech, startDate, endDate, totalMinutes }) {
  const rangeLabel = startDate && endDate
    ? `${moment(startDate).format('MMMM D, YYYY')} — ${moment(endDate).format('MMMM D, YYYY')}`
    : startDate ? `From ${moment(startDate).format('MMMM D, YYYY')}`
    : endDate   ? `Through ${moment(endDate).format('MMMM D, YYYY')}`
    : 'All Dates on Record';

  const rows = allItems.map((item, i) => {
    const elMin = item.elapsed || 0;
    const elHrs = (elMin / 60).toFixed(2);
    const dateStr = item.dateRef ? moment(item.dateRef).format('MM/DD/YY') : '—';
    const startStr = item.start ? moment(item.start).format('HH:mm') : '—';
    const endStr = item.end ? moment(item.end).format('HH:mm') : '—';
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${item.order_number || '—'}</td>
        <td>${item.bus_number || '—'}</td>
        <td>${item.wo_type || '—'}</td>
        <td>${dateStr}</td>
        <td>${startStr}</td>
        <td>${endStr}</td>
        <td><strong>${elMin}</strong></td>
        <td style="color:#142c5f;font-weight:700;">${elHrs}</td>
        <td>${item.tech || '—'}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Technician Labor Hours Record</title>
  <style>
    ${PRINT_BASE_CSS}
    .cert-box { border:1px solid #142c5f; padding:14px; margin-top:18px; font-size:9px; }
    .cert-box .cert-title { font-weight:700; color:#142c5f; font-size:10px; border-bottom:1px solid #142c5f; padding-bottom:4px; margin-bottom:8px; }
    .sig-line { margin-top:24px; display:flex; gap:40px; }
    .sig-block { flex:1; border-top:1px solid #888; padding-top:4px; font-size:9px; color:#555; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Data-TraCs System</div>
    <div class="title">OFFICIAL TECHNICIAN LABOR HOURS RECORD</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>EMPLOYEE / TECHNICIAN:</strong> ${selectedTech || 'ALL TECHNICIANS'}</div>
    <div class="meta-item"><strong>REPORTING PERIOD:</strong> ${rangeLabel}</div>
    <div class="meta-item"><strong>DEPARTMENT:</strong> Transportation — Vehicle Surveillance Sys.</div>
    <div class="meta-item"><strong>TOTAL MINUTES:</strong> ${totalMinutes}</div>
    <div class="meta-item"><strong>TOTAL HOURS:</strong> ${(totalMinutes/60).toFixed(2)}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY HH:mm')} ET</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>ORDER #</th><th>BUS #</th><th>TYPE</th>
        <th>DATE</th><th>START</th><th>END</th><th>MIN</th><th>HRS</th><th>TECHNICIAN</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="7">TOTAL LABOR HOURS</td>
        <td>${totalMinutes} MIN</td>
        <td>${(totalMinutes/60).toFixed(2)} HRS</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <div class="cert-box">
    <div class="cert-title">CERTIFICATION &amp; APPROVAL</div>
    <p>I certify that the hours recorded above are accurate and represent actual labor performed on New Hanover County Schools Transportation Department Data-TraCs System during the reporting period indicated.</p>
    <div class="sig-line">
      <div class="sig-block">
        Technician Signature / Date<br><br>
        <strong>${selectedTech || '______________________________'}</strong>
      </div>
      <div class="sig-block">
        Supervisor Signature / Date<br><br>
        Transportation Dept. Supervisor
      </div>
    </div>
  </div>

  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Vehicle Surveillance Systems</div>
  </body></html>`;

  printHtml(html);
}