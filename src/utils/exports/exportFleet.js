import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportFleetPDF({ buses, title = 'FLEET INVENTORY REPORT' }) {
  const rows = buses.map(b => {
    const total = (b.cameras_inside || 0) + (b.cameras_outside || 0) + (b.cameras_ai || 0);
    return `
      <tr>
        <td><strong>${b.bus_number || '—'}</strong></td>
        <td>${b.bus_type || '—'}</td>
        <td>${b.base_location || '—'}</td>
        <td>${b.year || '—'}</td>
        <td>${[b.make, b.model].filter(Boolean).join(' ') || '—'}</td>
        <td>${b.status || '—'}</td>
        <td>${b.camera_system_type || '—'}</td>
        <td>${b.cameras_inside ?? 0}</td>
        <td>${b.cameras_outside ?? 0}</td>
        <td>${b.cameras_ai ?? 0}</td>
        <td><strong>${total}</strong></td>
        <td>${b.stop_arm_cameras ? 'YES' : 'NO'}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS ${title}</title>
  <style>
    ${PRINT_BASE_CSS}
    table { font-size: 9px; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Fleet Database</div>
    <div class="title">${title}</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>VEHICLES IN REPORT:</strong> ${buses.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY HH:mm')} ET</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>BUS #</th><th>TYPE</th><th>LOCATION</th><th>YEAR</th><th>MAKE / MODEL</th>
        <th>STATUS</th><th>CAM SYSTEM</th><th>IN</th><th>OUT</th><th>AI</th><th>TOTAL</th><th>STOP ARM</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td colspan="11">TOTAL VEHICLES</td>
        <td>${buses.length}</td>
      </tr>
    </tfoot>
  </table>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Fleet Inventory</div>
  </body></html>`;

  printHtml(html);
}

export function exportFleetMakeSummaryPDF({ buses }) {
  const makeGroups = {};
  buses.forEach(b => {
    const make = b.make?.trim() || 'Unknown';
    if (!makeGroups[make]) makeGroups[make] = { total: 0, active: 0, oos: 0, retired: 0, school: 0, activity: 0 };
    makeGroups[make].total++;
    if (b.status === 'Active') makeGroups[make].active++;
    else if (b.status === 'Out of Service') makeGroups[make].oos++;
    else if (b.status === 'Retired') makeGroups[make].retired++;
    if (b.bus_type === 'School Bus') makeGroups[make].school++;
    else if (b.bus_type === 'Activity Bus') makeGroups[make].activity++;
  });

  const sorted = Object.entries(makeGroups).sort((a, b) => b[1].total - a[1].total);
  const rows = sorted.map(([make, c]) => `
    <tr>
      <td><strong>${make}</strong></td>
      <td>${c.total}</td>
      <td style="color:#166534;">${c.active}</td>
      <td style="color:#991b1b;">${c.oos}</td>
      <td>${c.retired}</td>
      <td>${c.school}</td>
      <td>${c.activity}</td>
    </tr>`).join('');

  const totals = {
    active: buses.filter(b => b.status === 'Active').length,
    oos: buses.filter(b => b.status === 'Out of Service').length,
    retired: buses.filter(b => b.status === 'Retired').length,
    school: buses.filter(b => b.bus_type === 'School Bus').length,
    activity: buses.filter(b => b.bus_type === 'Activity Bus').length,
  };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Fleet Make Summary</title>
  <style>${PRINT_BASE_CSS}</style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Fleet Database</div>
    <div class="title">FLEET MAKE / BRAND SUMMARY REPORT</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>TOTAL FLEET SIZE:</strong> ${buses.length} vehicles</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY HH:mm')} ET</div>
  </div>
  <table>
    <thead>
      <tr><th>MAKE / BRAND</th><th>TOTAL</th><th>ACTIVE</th><th>OUT OF SVC</th><th>RETIRED</th><th>SCHOOL</th><th>ACTIVITY</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr class="totals-row">
        <td>TOTAL</td>
        <td>${buses.length}</td>
        <td>${totals.active}</td>
        <td>${totals.oos}</td>
        <td>${totals.retired}</td>
        <td>${totals.school}</td>
        <td>${totals.activity}</td>
      </tr>
    </tfoot>
  </table>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Fleet Inventory</div>
  </body></html>`;

  printHtml(html);
}