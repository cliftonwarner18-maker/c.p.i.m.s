import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportHDriveAuditHTML({ drives, custodyLogs = [], userFilter = '', locationFilter = '', title = 'H-DRIVE CHAIN OF CUSTODY AUDIT' }) {
  const now = moment().format('MM/DD/YYYY HH:mm');

  let filtered = drives;
  if (userFilter) filtered = filtered.filter(d => d.current_user === userFilter);
  if (locationFilter) filtered = filtered.filter(d => d.current_lot === locationFilter);

  const active = filtered.filter(d => !d.seized);
  const seized = filtered.filter(d => d.seized);

  const driveRows = active.map(d => `
    <tr>
      <td><strong>${d.serial_number || '—'}</strong></td>
      <td>${d.make || '—'}</td>
      <td>${d.model || '—'}</td>
      <td>${d.current_user || '—'}</td>
      <td>${d.current_location || '—'}</td>
      <td style="color:#166534;font-weight:700;">ACTIVE</td>
    </tr>`).join('');

  const seizedRows = seized.map(d => `
    <tr style="background:#fef2f2;">
      <td><strong>${d.serial_number || '—'}</strong></td>
      <td>${d.make || '—'}</td>
      <td>${d.model || '—'}</td>
      <td>${d.seizing_agency || '—'}</td>
      <td>${d.seizing_person || '—'}</td>
      <td>${d.seizure_case_number || '—'}</td>
      <td>${d.seizure_date ? moment(d.seizure_date).format('MM/DD/YYYY') : '—'}</td>
      <td>${d.seizure_reason || '—'}</td>
    </tr>`).join('');

  const logRows = custodyLogs
    .filter(l => !locationFilter || filtered.some(d => d.serial_number === l.hdrive_serial))
    .slice(0, 200)
    .map(l => `
    <tr>
      <td>${l.hdrive_serial || '—'}</td>
      <td>${l.transfer_date ? moment(l.transfer_date).format('MM/DD/YYYY HH:mm') : '—'}</td>
      <td>${l.transferred_from || '—'}</td>
      <td>${l.transferred_to || '—'}</td>
      <td>${l.previous_location || '—'}</td>
      <td>${l.new_location || '—'}</td>
      <td>${l.reason || '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS H-Drive Audit Report</title>
  <style>
    ${PRINT_BASE_CSS}
    @page { size: letter landscape; margin: 0.4in 0.5in; }
    table { font-size: 9px; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — H-Drive Management</div>
    <div class="title">${title}</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    ${userFilter ? `<div class="meta-item"><strong>USER FILTER:</strong> ${userFilter}</div>` : ''}
    ${locationFilter ? `<div class="meta-item"><strong>LOT FILTER:</strong> ${locationFilter}</div>` : ''}
    <div class="meta-item"><strong>TOTAL DRIVES:</strong> ${filtered.length}</div>
    <div class="meta-item"><strong>ACTIVE:</strong> ${active.length}</div>
    <div class="meta-item"><strong>SEIZED:</strong> ${seized.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${now}</div>
  </div>

  <div class="section-header">ACTIVE H-DRIVES (${active.length})</div>
  <table>
    <thead>
      <tr><th>SERIAL NUMBER</th><th>MAKE</th><th>MODEL</th><th>CURRENT USER</th><th>CURRENT LOCATION</th><th>STATUS</th></tr>
    </thead>
    <tbody>${driveRows || '<tr><td colspan="6" style="text-align:center;padding:12px;">NO ACTIVE DRIVES</td></tr>'}</tbody>
  </table>

  ${seized.length > 0 ? `
  <div class="section-header" style="background:#7f1d1d;">SEIZED H-DRIVES (${seized.length})</div>
  <table>
    <thead>
      <tr><th>SERIAL NUMBER</th><th>MAKE</th><th>MODEL</th><th>SEIZING AGENCY</th><th>SEIZING PERSON</th><th>CASE #</th><th>SEIZURE DATE</th><th>REASON</th></tr>
    </thead>
    <tbody>${seizedRows}</tbody>
  </table>` : ''}

  ${custodyLogs.length > 0 ? `
  <div class="section-header">CHAIN OF CUSTODY LOG (${Math.min(custodyLogs.length, 200)} records)</div>
  <table>
    <thead>
      <tr><th>SERIAL</th><th>DATE/TIME</th><th>FROM</th><th>TO</th><th>PREV LOCATION</th><th>NEW LOCATION</th><th>REASON</th></tr>
    </thead>
    <tbody>${logRows || '<tr><td colspan="7" style="text-align:center;padding:12px;">NO LOGS</td></tr>'}</tbody>
  </table>` : ''}

  <div style="margin-top:30px;border-top:1px solid #dde2ee;padding-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:24px;font-size:10px;">
    <div><strong>AUTHORIZED SIGNATURE:</strong><br/><br/><div style="border-top:1px solid #555;margin-top:28px;padding-top:4px;">Print Name / Date</div></div>
    <div><strong>SUPERVISOR APPROVAL:</strong><br/><br/><div style="border-top:1px solid #555;margin-top:28px;padding-top:4px;">Print Name / Date</div></div>
  </div>
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — H-Drive Chain of Custody</div>
  </body></html>`;

  printHtml(html);
}