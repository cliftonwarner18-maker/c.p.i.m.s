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

  // Generate compact work order cards — 3 per page
  const cards = orders.map((wo) => {
    const statusColor = wo.status === 'Pending' ? '#b45309' : wo.status === 'In Progress' ? '#1e3c78' : wo.status === 'Completed' ? '#166534' : '#991b1b';
    const createdDate = moment(wo.created_date).format('MM/DD/YY');
    return `
      <div class="wo-card">
        <div class="wo-card-header">
          <span>ORDER #: <strong>${wo.order_number || '—'}</strong> &nbsp;|&nbsp; BUS #: <strong>${wo.bus_number || '—'}</strong> &nbsp;|&nbsp; LOT: ${wo.lot || '—'} &nbsp;|&nbsp; DATE: ${createdDate}</span>
          <span style="font-weight:700;color:${statusColor};">[${(wo.status || 'PENDING').toUpperCase()}]</span>
        </div>
        <div class="wo-card-body">
          <div class="wo-row">
            <div class="wo-field"><span class="wo-label">TYPE</span><span class="wo-val">${wo.work_order_type || '—'}</span></div>
            <div class="wo-field"><span class="wo-label">REPORTED BY</span><span class="wo-val">${wo.reported_by || '—'}</span></div>
            <div class="wo-field"><span class="wo-label">TECHNICIAN</span><span class="wo-val">${wo.technician_name || '___________________'}</span></div>
          </div>
          <div class="wo-issue"><span class="wo-label">ISSUE:</span> ${wo.issue_description || '—'}</div>
          ${wo.repairs_rendered ? `<div class="wo-issue"><span class="wo-label">REPAIRS RENDERED:</span> ${wo.repairs_rendered}</div>` : '<div class="wo-issue wo-blank"><span class="wo-label">REPAIRS RENDERED:</span> &nbsp;</div>'}
          <div class="wo-sigs">
            <div class="wo-sig-line">Technician Signature &amp; Date</div>
            <div class="wo-sig-line">Supervisor Approval &amp; Date</div>
          </div>
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
  <title>NHCS Work Order Work Book</title>
  <style>
    ${PRINT_BASE_CSS}
    body { font-size: 9px; }
    .wo-card { border: 1.5px solid #1e3c78; margin-bottom: 8px; page-break-inside: avoid; background: #fafbff; }
    .wo-card-header { background: #1e3c78; color: white; padding: 4px 8px; font-size: 9px; font-weight: 700; display: flex; justify-content: space-between; align-items: center; }
    .wo-card-body { padding: 6px 8px; }
    .wo-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-bottom: 4px; }
    .wo-field { display: flex; flex-direction: column; }
    .wo-label { font-size: 7.5px; font-weight: 700; color: #1e3c78; text-transform: uppercase; letter-spacing: 0.04em; }
    .wo-val { font-size: 9px; border-bottom: 1px solid #bbb; padding-bottom: 1px; }
    .wo-issue { font-size: 8.5px; margin-bottom: 4px; line-height: 1.3; border-left: 2px solid #1e3c78; padding-left: 5px; }
    .wo-blank { min-height: 22px; border: 1px dashed #ccc; border-left: 2px solid #1e3c78; padding: 2px 5px; }
    .wo-sigs { display: flex; gap: 16px; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #bbb; }
    .wo-sig-line { flex: 1; border-top: 1px solid #666; padding-top: 2px; font-size: 7.5px; color: #444; }
    @media print {
      .wo-card { page-break-inside: avoid; }
    }
  </style>
  </head><body>
  
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Data-TraCs System</div>
    <div class="title">WORK ORDER WORK BOOK — ACTIVE / PENDING</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>TYPE FILTER:</strong> ${typeLabel}</div>
    <div class="meta-item"><strong>TOTAL ORDERS:</strong> ${orders.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY [at] HH:mm')} ET</div>
  </div>

  ${cards}

  <div style="page-break-before:always;">
    <div class="section-header">WORK ORDER SUMMARY TABLE</div>
    <table style="margin-top:8px;font-size:8px;">
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