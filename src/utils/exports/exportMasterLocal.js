import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportMasterHTMLReport({ buses, workOrders, inspections, serializedAssets, nonSerializedAssets, hdrives }) {
  const now = moment().format('MM/DD/YYYY [at] HH:mm');

  // --- Fleet ---
  const fleetRows = buses.map(b => `
    <tr>
      <td><strong>${b.bus_number || '—'}</strong></td>
      <td>${b.bus_type || '—'}</td>
      <td>${b.base_location || '—'}</td>
      <td>${b.year || '—'}</td>
      <td>${[b.make, b.model].filter(Boolean).join(' ') || '—'}</td>
      <td>${b.status || '—'}</td>
      <td>${b.camera_system_type || '—'}</td>
      <td>${b.samsara_enabled ? 'YES' : 'NO'}</td>
    </tr>`).join('');

  // --- Work Orders ---
  const woRows = workOrders.map(wo => {
    const elapsed = wo.elapsed_time_minutes ? `${Math.floor(wo.elapsed_time_minutes / 60)}h ${wo.elapsed_time_minutes % 60}m` : '—';
    return `
    <tr>
      <td><strong>${wo.order_number || '—'}</strong></td>
      <td>${wo.bus_number || '—'}</td>
      <td>${wo.work_order_type || '—'}</td>
      <td>${wo.reported_by || '—'}</td>
      <td>${wo.technician_name || '—'}</td>
      <td>${wo.status || '—'}</td>
      <td>${elapsed}</td>
      <td>${wo.created_date ? moment(wo.created_date).format('MM/DD/YY') : '—'}</td>
    </tr>`;
  }).join('');

  // --- Inspections ---
  const inspRows = inspections.map(ins => `
    <tr>
      <td><strong>${ins.bus_number || '—'}</strong></td>
      <td>${ins.inspector_name || '—'}</td>
      <td>${ins.inspection_date ? moment(ins.inspection_date).format('MM/DD/YY') : '—'}</td>
      <td style="font-weight:700;color:${ins.overall_status === 'Pass' ? '#166534' : ins.overall_status === 'Fail' ? '#991b1b' : '#92400e'}">${ins.overall_status || '—'}</td>
      <td>${ins.next_inspection_due ? moment(ins.next_inspection_due).format('MM/DD/YY') : '—'}</td>
    </tr>`).join('');

  // --- Serialized Assets ---
  const saRows = serializedAssets.map(a => `
    <tr>
      <td>${a.asset_number || '—'}</td>
      <td>${a.brand || '—'}</td>
      <td>${a.model || '—'}</td>
      <td>${a.serial_number || '—'}</td>
      <td>${a.asset_type || '—'}</td>
      <td>${a.status || '—'}</td>
      <td>${a.assigned_bus_number || '—'}</td>
    </tr>`).join('');

  // --- Non-Serialized Assets ---
  const nsaRows = nonSerializedAssets.map(a => {
    const isLow = a.low_level_threshold > 0 && (a.quantity_on_hand || 0) <= a.low_level_threshold;
    return `
    <tr style="${isLow ? 'background:#fef2f2;' : ''}">
      <td>${a.part_name || '—'}</td>
      <td>${a.brand || '—'}</td>
      <td>${a.model_number || '—'}</td>
      <td style="font-weight:700;${isLow ? 'color:#991b1b;' : ''}">${a.quantity_on_hand ?? 0}</td>
      <td>${a.low_level_threshold || '—'}</td>
      <td>${a.current_location || '—'}</td>
    </tr>`;
  }).join('');

  // --- H-Drives ---
  const hdRows = hdrives.map(d => `
    <tr style="${d.seized ? 'background:#fef2f2;' : ''}">
      <td><strong>${d.serial_number || '—'}</strong></td>
      <td>${d.make || '—'}</td>
      <td>${d.model || '—'}</td>
      <td>${d.current_user || '—'}</td>
      <td>${d.current_location || '—'}</td>
      <td style="font-weight:700;color:${d.seized ? '#991b1b' : '#166534'}">${d.seized ? 'SEIZED' : 'ACTIVE'}</td>
    </tr>`).join('');

  const section = (title) => `
    <div style="background:#142c5f;color:white;padding:3px 8px;font-weight:700;font-size:9px;letter-spacing:0.06em;margin:10px 0 3px;">
      ${title}
    </div>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Master Backup Report</title>
  <style>
    ${PRINT_BASE_CSS}
    body { font-size: 8px; }
    table { font-size: 7.5px; margin-bottom: 6px; border-collapse: collapse; width: 100%; }
    th, td { padding: 2px 4px !important; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
    th { font-size: 7px; letter-spacing: 0.04em; }
    tr { border-bottom: 1px solid #ddd; }
    .meta-box { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: 8px; padding: 4px 0; }
    .meta-item { font-size: 8px; }
    .page-header .title { font-size: 12px; }
    .page-header .dept { font-size: 9px; }
    .page-header .org { font-size: 13px; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Data-TraCs System</div>
    <div class="title">MASTER BACKUP REPORT — ALL SYSTEM DATA</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>VEHICLES:</strong> ${buses.length}</div>
    <div class="meta-item"><strong>WORK ORDERS:</strong> ${workOrders.length}</div>
    <div class="meta-item"><strong>INSPECTIONS:</strong> ${inspections.length}</div>
    <div class="meta-item"><strong>SERIALIZED ASSETS:</strong> ${serializedAssets.length}</div>
    <div class="meta-item"><strong>SPARE PARTS:</strong> ${nonSerializedAssets.length}</div>
    <div class="meta-item"><strong>H-DRIVES:</strong> ${hdrives.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${now}</div>
  </div>

  ${section('FLEET VEHICLES')}
  <table>
    <thead><tr><th>BUS #</th><th>TYPE</th><th>LOC</th><th>YEAR</th><th>MAKE/MODEL</th><th>STATUS</th><th>CAM SYSTEM</th><th>SAMSARA</th></tr></thead>
    <tbody>${fleetRows || '<tr><td colspan="8">No data</td></tr>'}</tbody>
  </table>

  ${section('WORK ORDERS')}
  <table>
    <thead><tr><th>ORDER #</th><th>BUS #</th><th>TYPE</th><th>REPORTED BY</th><th>TECHNICIAN</th><th>STATUS</th><th>ELAPSED</th><th>DATE</th></tr></thead>
    <tbody>${woRows || '<tr><td colspan="8">No data</td></tr>'}</tbody>
  </table>

  ${section('INSPECTIONS')}
  <table>
    <thead><tr><th>BUS #</th><th>INSPECTOR</th><th>DATE</th><th>RESULT</th><th>NEXT DUE</th></tr></thead>
    <tbody>${inspRows || '<tr><td colspan="5">No data</td></tr>'}</tbody>
  </table>

  ${section('SERIALIZED ASSETS')}
  <table>
    <thead><tr><th>ASSET #</th><th>BRAND</th><th>MODEL</th><th>SERIAL #</th><th>TYPE</th><th>STATUS</th><th>BUS #</th></tr></thead>
    <tbody>${saRows || '<tr><td colspan="7">No data</td></tr>'}</tbody>
  </table>

  ${section('NON-SERIALIZED SPARE PARTS')}
  <table>
    <thead><tr><th>PART NAME</th><th>BRAND</th><th>MODEL #</th><th>QTY</th><th>THRESHOLD</th><th>LOCATION</th></tr></thead>
    <tbody>${nsaRows || '<tr><td colspan="6">No data</td></tr>'}</tbody>
  </table>

  ${section('H-DRIVES')}
  <table>
    <thead><tr><th>SERIAL #</th><th>MAKE</th><th>MODEL</th><th>CURRENT USER</th><th>LOCATION</th><th>STATUS</th></tr></thead>
    <tbody>${hdRows || '<tr><td colspan="6">No data</td></tr>'}</tbody>
  </table>

  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Master Backup | Generated ${now}</div>
  </body></html>`;

  printHtml(html);
}