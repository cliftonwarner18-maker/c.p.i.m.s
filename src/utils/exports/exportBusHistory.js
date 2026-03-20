import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportBusHistoryPDF({ bus, workOrders, inspections, history }) {
  const woRows = workOrders.length === 0
    ? '<tr><td colspan="5" style="text-align:center;color:#888;">No repair history</td></tr>'
    : workOrders.slice(0, 50).map(wo => {
        const elapsed = wo.elapsed_time_minutes
          ? `${Math.floor(wo.elapsed_time_minutes/60)}h ${wo.elapsed_time_minutes%60}m` : '—';
        return `
          <tr>
            <td><strong>${wo.order_number || wo.id?.slice(-6) || '—'}</strong></td>
            <td>${wo.created_date ? moment(wo.created_date).format('MM/DD/YYYY') : '—'}</td>
            <td>${wo.status || '—'}</td>
            <td>${wo.technician_name || '—'}</td>
            <td>${elapsed}</td>
          </tr>
          ${wo.issue_description ? `<tr><td colspan="5" style="font-size:9px;color:#555;padding:2px 8px 6px 16px;">Issue: ${wo.issue_description}</td></tr>` : ''}
          ${wo.repairs_rendered ? `<tr><td colspan="5" style="font-size:9px;color:#333;padding:2px 8px 8px 16px;"><strong>Repairs:</strong> ${wo.repairs_rendered}</td></tr>` : ''}`;
      }).join('');

  const inspRows = inspections.length === 0
    ? '<tr><td colspan="5" style="text-align:center;color:#888;">No inspection history</td></tr>'
    : inspections.slice(0, 20).map(insp => `
        <tr>
          <td><strong>${insp.inspection_number || '—'}</strong></td>
          <td>${insp.inspection_date ? moment(insp.inspection_date).format('MM/DD/YYYY') : '—'}</td>
          <td>${insp.inspector_name || '—'}</td>
          <td><span class="${insp.overall_status === 'Pass' ? 'pass' : 'fail'}">${insp.overall_status || '—'}</span></td>
          <td>${insp.inspection_notes || '—'}</td>
        </tr>`).join('');

  const histRows = history.length === 0
    ? '<tr><td colspan="4" style="text-align:center;color:#888;">No log entries</td></tr>'
    : history.slice(0, 30).map(h => `
        <tr>
          <td>${h.start_time ? moment(h.start_time).format('MM/DD/YY HH:mm') : '—'}</td>
          <td>${h.technician || '—'}</td>
          <td>${h.elapsed_time_minutes ? h.elapsed_time_minutes + ' min' : '—'}</td>
          <td>${h.description || '—'}</td>
        </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Bus #${bus.bus_number} Vehicle History</title>
  <style>${PRINT_BASE_CSS}</style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Vehicle History Transcript</div>
    <div class="title">BUS #${bus.bus_number} — ${[bus.year, bus.make, bus.model].filter(Boolean).join(' ')}</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>BUS TYPE:</strong> ${bus.bus_type || '—'}</div>
    <div class="meta-item"><strong>VIN:</strong> ${bus.vin || '—'}</div>
    <div class="meta-item"><strong>BASE LOCATION:</strong> ${bus.base_location || '—'}</div>
    <div class="meta-item"><strong>STATUS:</strong> ${bus.status || '—'}</div>
    <div class="meta-item"><strong>CAMERA SYSTEM:</strong> ${bus.camera_system_type || 'None'}</div>
    <div class="meta-item"><strong>NEXT INSPECTION:</strong> ${bus.next_inspection_due ? moment(bus.next_inspection_due).format('MM/DD/YYYY') : 'Not Set'}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MMMM D, YYYY [at] h:mm A')} ET</div>
  </div>

  <div class="section-header">REPAIR WORK ORDERS (${workOrders.length})</div>
  <table>
    <thead><tr><th>ORDER #</th><th>DATE</th><th>STATUS</th><th>TECHNICIAN</th><th>ELAPSED</th></tr></thead>
    <tbody>${woRows}</tbody>
  </table>

  <div class="section-header">INSPECTION HISTORY (${inspections.length})</div>
  <table>
    <thead><tr><th>INSP #</th><th>DATE</th><th>INSPECTOR</th><th>RESULT</th><th>NOTES</th></tr></thead>
    <tbody>${inspRows}</tbody>
  </table>

  <div class="section-header">MANUAL SERVICE LOG (${history.length})</div>
  <table>
    <thead><tr><th>DATE / TIME</th><th>TECHNICIAN</th><th>ELAPSED</th><th>DESCRIPTION</th></tr></thead>
    <tbody>${histRows}</tbody>
  </table>

  ${bus.legacy_upload ? `
  <div class="section-header">LEGACY AUDIT / REPAIR LOG</div>
  <div style="font-size:9px;white-space:pre-wrap;padding:8px;background:#f9f9f9;border:1px solid #dde2ee;">${bus.legacy_upload}</div>
  ` : ''}

  <div class="page-footer">New Hanover County Schools | Transportation Department | Vehicle Surveillance System | Bus #${bus.bus_number} | ${moment().format('MM/DD/YYYY')}</div>
  </body></html>`;

  printHtml(html);
}