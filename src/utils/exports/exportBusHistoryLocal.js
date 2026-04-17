import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportBusHistoryPDF({ bus, workOrders, inspections, busHistory }) {
  const now = moment().format('MM/DD/YYYY HH:mm');

  const historyRows = busHistory.map(h => `
    <tr>
      <td>${h.start_time ? moment(h.start_time).format('MM/DD/YYYY') : moment(h.created_date).format('MM/DD/YYYY')}</td>
      <td>${h.technician || '—'}</td>
      <td>${h.start_time ? moment(h.start_time).format('HH:mm') : '—'}</td>
      <td>${h.end_time ? moment(h.end_time).format('HH:mm') : '—'}</td>
      <td>${h.elapsed_time_minutes ? `${h.elapsed_time_minutes} min` : '—'}</td>
      <td>${h.description || '—'}</td>
    </tr>`).join('');

  const woRows = workOrders.map(wo => `
    <tr>
      <td><strong>${wo.order_number || '—'}</strong></td>
      <td>${wo.work_order_type || '—'}</td>
      <td>${wo.created_date ? moment(wo.created_date).format('MM/DD/YYYY') : '—'}</td>
      <td>${wo.reported_by || '—'}</td>
      <td>${wo.issue_description || '—'}</td>
      <td>${wo.technician_name || '—'}</td>
      <td style="font-weight:700;color:${wo.status === 'Completed' ? '#166534' : wo.status === 'Pending' ? '#92400e' : '#1e40af'}">${wo.status || '—'}</td>
      <td>${wo.elapsed_time_minutes ? `${Math.floor(wo.elapsed_time_minutes/60)}h ${wo.elapsed_time_minutes%60}m` : '—'}</td>
    </tr>`).join('');

  const inspRows = inspections.map(ins => `
    <tr>
      <td>${ins.inspection_date ? moment(ins.inspection_date).format('MM/DD/YYYY') : moment(ins.created_date).format('MM/DD/YYYY')}</td>
      <td>${ins.inspector_name || '—'}</td>
      <td style="font-weight:700;color:${ins.overall_status === 'Pass' ? '#166534' : ins.overall_status === 'Fail' ? '#991b1b' : '#92400e'}">${ins.overall_status || '—'}</td>
      <td style="text-align:center">${ins.camera_system_functional ? '✓' : '✗'}</td>
      <td style="text-align:center">${ins.dvr_functional ? '✓' : '✗'}</td>
      <td style="text-align:center">${ins.signals_lights_functional ? '✓' : '✗'}</td>
      <td>${ins.next_inspection_due ? moment(ins.next_inspection_due).format('MM/DD/YYYY') : '—'}</td>
      <td>${ins.inspection_notes || '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Bus #${bus?.bus_number} — Vehicle History</title>
  <style>
    ${PRINT_BASE_CSS}
    table { font-size: 9.5px; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Vehicle Profile</div>
    <div class="title">BUS #${bus?.bus_number || '?'} — COMPLETE VEHICLE HISTORY</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>BUS #:</strong> ${bus?.bus_number || '—'}</div>
    <div class="meta-item"><strong>MAKE/MODEL:</strong> ${[bus?.year, bus?.make, bus?.model].filter(Boolean).join(' ') || '—'}</div>
    <div class="meta-item"><strong>TYPE:</strong> ${bus?.bus_type || '—'}</div>
    <div class="meta-item"><strong>LOCATION:</strong> ${bus?.base_location || '—'}</div>
    <div class="meta-item"><strong>STATUS:</strong> ${bus?.status || '—'}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${now}</div>
  </div>

  <div class="section-header">VEHICLE DETAILS</div>
  <table>
    <thead><tr><th>VIN</th><th>ENGINE</th><th>CAPACITY</th><th>ASSET #</th><th>CAMERA SYSTEM</th><th>CAMERA S/N</th><th>SAMSARA</th><th>NEXT INSPECTION</th></tr></thead>
    <tbody>
      <tr>
        <td>${bus?.vin || '—'}</td>
        <td>${bus?.engine || '—'}</td>
        <td>${bus?.passenger_capacity ? bus.passenger_capacity + ' pass.' : '—'}</td>
        <td>${bus?.asset_number || '—'}</td>
        <td>${bus?.camera_system_type || '—'}</td>
        <td>${bus?.camera_serial_number || '—'}</td>
        <td>${bus?.samsara_enabled ? 'YES' : 'NO'}</td>
        <td>${bus?.next_inspection_due ? moment(bus.next_inspection_due).format('MM/DD/YYYY') : '—'}</td>
      </tr>
    </tbody>
  </table>

  ${busHistory.length > 0 ? `
  <div class="section-header">MANUAL SERVICE LOG (${busHistory.length} entries)</div>
  <table>
    <thead><tr><th>DATE</th><th>TECHNICIAN</th><th>START</th><th>END</th><th>ELAPSED</th><th>DESCRIPTION</th></tr></thead>
    <tbody>${historyRows}</tbody>
  </table>` : ''}

  ${workOrders.length > 0 ? `
  <div class="section-header">WORK ORDERS (${workOrders.length})</div>
  <table>
    <thead><tr><th>ORDER #</th><th>TYPE</th><th>DATE</th><th>REPORTED BY</th><th>ISSUE</th><th>TECHNICIAN</th><th>STATUS</th><th>ELAPSED</th></tr></thead>
    <tbody>${woRows}</tbody>
  </table>` : ''}

  ${inspections.length > 0 ? `
  <div class="section-header">INSPECTION RECORDS (${inspections.length})</div>
  <table>
    <thead><tr><th>DATE</th><th>INSPECTOR</th><th>OVERALL</th><th>CAMERA</th><th>DVR</th><th>SIGNALS</th><th>NEXT DUE</th><th>NOTES</th></tr></thead>
    <tbody>${inspRows}</tbody>
  </table>` : ''}

  ${bus?.notes ? `<div class="section-header">NOTES</div><div style="padding:10px;background:white;border:1px solid #dde2ee;font-size:10px;white-space:pre-wrap;">${bus.notes}</div>` : ''}

  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Vehicle History Report</div>
  </body></html>`;

  printHtml(html);
}