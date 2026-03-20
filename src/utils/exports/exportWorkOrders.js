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
  <style>${PRINT_BASE_CSS}</style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Data-TraCs System</div>
    <div class="title">VEHICLE MAINTENANCE WORK ORDER REPORT</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>STATUS FILTER:</strong> ${filterLabel}</div>
    <div class="meta-item"><strong>TYPE FILTER:</strong> ${typeLabel}</div>
    <div class="meta-item"><strong>RECORDS:</strong> ${orders.length}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY [at] HH:mm')} ET</div>
  </div>
  <table>
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
  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Data-TraCs System</div>
  </body></html>`;

  printHtml(html);
}