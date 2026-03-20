import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

const STATUS_BADGE = {
  Pending: 'badge-pending',
  'In Progress': 'badge-progress',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled',
};

export function exportWorkOrdersPDF({ orders, statusFilter = 'All', typeFilter = 'All' }) {
  const filterLabel = statusFilter === 'All' ? 'ALL STATUSES' : statusFilter.toUpperCase();
  const typeLabel = typeFilter === 'All' ? 'ALL TYPES' : typeFilter.toUpperCase();

  // Generate individual work order forms
  const workOrderForms = orders.map((wo) => {
    const elapsed = wo.elapsed_time_minutes
      ? `${Math.floor(wo.elapsed_time_minutes / 60)}h ${wo.elapsed_time_minutes % 60}m` : '—';
    const statusColor = wo.status === 'Pending' ? '#d4a574' : wo.status === 'In Progress' ? '#1e3c78' : wo.status === 'Completed' ? '#166534' : '#991b1b';
    const createdDate = moment(wo.created_date).format('MM/DD/YYYY');
    const completedDate = wo.completed_date ? moment(wo.completed_date).format('MM/DD/YYYY') : '—';
    
    return `
      <div style="page-break-after:always;border:2px solid #1e3c78;padding:16px;margin-bottom:20px;background:#fafbff;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div><strong style="font-size:12px;">ORDER #:</strong><br/><span style="font-size:14px;font-weight:700;color:#1e3c78;">${wo.order_number || '—'}</span></div>
          <div style="text-align:right;"><strong style="font-size:12px;">STATUS:</strong><br/><span style="font-size:13px;font-weight:700;color:${statusColor};">${(wo.status || 'PENDING').toUpperCase()}</span></div>
        </div>
        
        <div style="border-bottom:2px solid #1e3c78;padding-bottom:12px;margin-bottom:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px;">
            <div><strong>VEHICLE #:</strong> ${wo.bus_number || '—'}</div>
            <div><strong>LOT:</strong> ${wo.lot || '—'}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><strong>WORK TYPE:</strong> ${wo.work_order_type || '—'}</div>
            <div><strong>REPORTED BY:</strong> ${wo.reported_by || '—'}</div>
          </div>
        </div>

        <div style="background:white;border:1px solid #dde2ee;padding:10px;margin-bottom:12px;font-size:10px;">
          <strong style="display:block;margin-bottom:4px;">ISSUE DESCRIPTION:</strong>
          <div style="white-space:pre-wrap;line-height:1.5;">${wo.issue_description || '—'}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div><strong>CREATED:</strong> ${createdDate}</div>
          <div><strong>COMPLETED:</strong> ${completedDate}</div>
        </div>

        ${wo.technician_name ? `
        <div style="background:#e8ecf5;border-left:3px solid #1e3c78;padding:10px;margin-bottom:12px;">
          <strong>REPAIR TECHNICIAN:</strong> ${wo.technician_name}<br/>
          <strong>ELAPSED TIME:</strong> ${elapsed}
          ${wo.repairs_rendered ? `<br/><strong style="display:block;margin-top:6px;">REPAIRS RENDERED:</strong><div style="white-space:pre-wrap;margin-top:2px;">${wo.repairs_rendered}</div>` : ''}
        </div>` : ''}

        <div style="display:flex;gap:20px;margin-top:16px;font-size:9px;">
          <div style="flex:1;border-top:1px solid #999;padding-top:4px;">Technician Signature / Date</div>
          <div style="flex:1;border-top:1px solid #999;padding-top:4px;">Supervisor Approval / Date</div>
        </div>
      </div>`;
  }).join('');

  // Generate summary table
  const rows = orders.map((wo, i) => {
    const elapsed = wo.elapsed_time_minutes
      ? `${Math.floor(wo.elapsed_time_minutes / 60)}h ${wo.elapsed_time_minutes % 60}m` : '—';
    const badge = STATUS_BADGE[wo.status] || '';
    return `
      <tr>
        <td><strong>${wo.order_number || '—'}</strong></td>
        <td>${wo.work_order_type || '—'}</td>
        <td>${moment(wo.created_date).format('MM/DD/YY')}</td>
        <td><strong>${wo.bus_number || '—'}</strong></td>
        <td>${wo.lot || '—'}</td>
        <td>${wo.reported_by || '—'}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${(wo.issue_description||'').replace(/"/g,'&quot;')}">${wo.issue_description || '—'}</td>
        <td>${wo.technician_name || '—'}</td>
        <td><span class="badge ${badge}">${(wo.status||'').toUpperCase()}</span></td>
        <td>${elapsed}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Work Orders Report</title>
  <style>
    ${PRINT_BASE_CSS}
    .form-field { margin-bottom:8px; }
    .form-field label { font-weight:700; font-size:10px; display:block; margin-bottom:2px; color:#1e3c78; }
    .form-field input, .form-field textarea { width:100%; padding:6px 8px; border:1px solid #dde2ee; font-family:monospace; font-size:10px; box-sizing:border-box; }
  </style>
  </head><body>
  
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Data-TraCs System</div>
    <div class="title">WORK ORDER FIELD FORMS — TECHNICIAN DOCUMENTATION</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>STATUS FILTER:</strong> ${filterLabel}</div>
    <div class="meta-item"><strong>TYPE FILTER:</strong> ${typeLabel}</div>
    <div class="meta-item"><strong>TOTAL ORDERS:</strong> ${orders.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY [at] HH:mm')} ET</div>
  </div>

  <div style="margin-bottom:20px;padding:12px;background:#e8ecf5;border-left:3px solid #1e3c78;font-size:9px;">
    <strong>INSTRUCTIONS:</strong> Technicians must complete all work order forms legibly. Sign and date upon completion. Submit to supervisor for approval.
  </div>

  ${workOrderForms}

  <div style="page-break-before:always;margin-top:40px;">
    <div class="section-header">WORK ORDER SUMMARY TABLE</div>
    <table style="margin-top:12px;">
      <thead>
        <tr>
          <th>ORDER #</th><th>TYPE</th><th>DATE</th><th>BUS #</th><th>LOT</th>
          <th>REPORTED BY</th><th>ISSUE</th><th>TECHNICIAN</th><th>STATUS</th><th>ELAPSED</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr class="totals-row">
          <td colspan="9">TOTAL RECORDS</td>
          <td>${orders.length}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Data-TraCs System</div>
  </body></html>`;

  printHtml(html);
}