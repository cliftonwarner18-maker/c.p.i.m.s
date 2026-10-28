import { differenceInCalendarDays } from 'date-fns';
import { isClosed } from './enforcementConstants';

export const countBy = (rows, keyFn) => {
  const m = {};
  rows.forEach((r) => {
    const k = keyFn(r) || 'Unknown';
    m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
};

export const buildStats = (rows) => {
  const closed = rows.filter((r) => isClosed(r.status));
  const convicted = rows.filter((r) => r.status === 'Closed - Convicted').length;
  const days = closed
    .filter((r) => r.returned_date && r.violation_date)
    .map((r) => differenceInCalendarDays(new Date(r.returned_date), new Date(r.violation_date)));
  return {
    total: rows.length,
    open: rows.length - closed.length,
    closed: closed.length,
    convicted,
    convictionRate: closed.length ? Math.round((convicted / closed.length) * 100) : 0,
    chargesFiled: rows.filter((r) => r.charges_preferred || r.citation_number).length,
    avgDaysToClose: days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0,
    byStatus: countBy(rows, (r) => r.status),
    byMonth: countBy(rows, (r) => (r.violation_date || '').slice(0, 7)).sort((a, b) => a.name.localeCompare(b.name)),
    bySchool: countBy(rows, (r) => r.school_name),
    byBus: countBy(rows, (r) => r.school_bus_number),
    byRoad: countBy(rows, (r) => r.highway),
    byCounty: countBy(rows, (r) => r.county),
    byEvidence: countBy(rows, (r) => r.evidence_source),
    byOfficer: countBy(rows, (r) => r.assigned_to),
    byHour: countBy(rows, (r) => (r.violation_time ? `${r.violation_time.slice(0, 2)}:00` : '')).sort((a, b) => a.name.localeCompare(b.name)),
  };
};

const table = (title, data) => `<h3>${title}</h3><table><tr><th>Item</th><th>Count</th></tr>${data
  .slice(0, 15).map((d) => `<tr><td>${d.name}</td><td>${d.count}</td></tr>`).join('')}</table>`;

export const printReport = (stats, rangeLabel) => {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><title>Enforcement Report</title><style>
    body{font-family:Courier,monospace;font-size:12px;padding:20px}
    table{border-collapse:collapse;margin-bottom:12px;min-width:320px}
    td,th{border:1px solid #444;padding:3px 8px;text-align:left}th{background:#ddd}
    .grid{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px}
    .box{border:1px solid #444;padding:6px 12px}</style></head><body>
    <h2>NHCS Enforcement Center - Stop Arm Violation Report</h2><div>Period: ${rangeLabel}</div><br/>
    <div class="grid">
      <div class="box">Total Cases<br/><b>${stats.total}</b></div>
      <div class="box">Open<br/><b>${stats.open}</b></div>
      <div class="box">Closed<br/><b>${stats.closed}</b></div>
      <div class="box">Convicted<br/><b>${stats.convicted}</b></div>
      <div class="box">Conviction Rate<br/><b>${stats.convictionRate}%</b></div>
      <div class="box">Charges/Citations<br/><b>${stats.chargesFiled}</b></div>
      <div class="box">Avg Days to Close<br/><b>${stats.avgDaysToClose}</b></div>
    </div>
    ${table('Cases by Status', stats.byStatus)}${table('Cases by Month', stats.byMonth)}
    ${table('Violations by School', stats.bySchool)}${table('Violations by Bus', stats.byBus)}
    ${table('Violations by Road', stats.byRoad)}${table('Violations by County', stats.byCounty)}
    ${table('Evidence Source', stats.byEvidence)}${table('Cases by Assigned Officer', stats.byOfficer)}
    ${table('Violations by Time of Day', stats.byHour)}
    </body></html>`);
  w.document.close();
  w.print();
};

export const exportCsv = (rows) => {
  const cols = ['case_number', 'status', 'violation_date', 'violation_time', 'county', 'highway', 'school_bus_number', 'school_name',
    'driver_name', 'license_plate', 'plate_state', 'violator_name', 'assigned_to', 'call_no', 'charges_preferred', 'citation_number',
    'court_date', 'returned_date', 'evidence_source'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'enforcement_cases.csv';
  a.click();
};