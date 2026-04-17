import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';


export function exportWorkOrdersPDF({ orders, statusFilter = 'All', typeFilter = 'All' }) {
  const filterLabel = statusFilter === 'All' ? 'ALL STATUSES' : statusFilter.toUpperCase();
  const typeLabel = typeFilter === 'All' ? 'ALL TYPES' : typeFilter.toUpperCase();

  // Generate compact work order cards — 3-4 per page
  const cards = orders.map((wo) => {
    const statusColor = wo.status === 'Pending' ? '#b45309' : wo.status === 'In Progress' ? '#1e3c78' : wo.status === 'Completed' ? '#166534' : '#991b1b';
    const createdDate = moment(wo.created_date).format('MM/DD/YY');
    const startTime = wo.repair_start_time ? moment(wo.repair_start_time).format('MM/DD/YY HH:mm') : '_______________';
    const endTime = wo.repair_end_time ? moment(wo.repair_end_time).format('MM/DD/YY HH:mm') : '_______________';
    return `
      <div class="wo-card">
        <div class="wo-card-header">
          <span>ORDER #: <strong>${wo.order_number || '—'}</strong> &nbsp;|&nbsp; BUS #: <strong>${wo.bus_number || '—'}</strong> &nbsp;|&nbsp; LOT: ${wo.lot || '—'} &nbsp;|&nbsp; DATE: ${createdDate}</span>
          <span style="font-weight:700;">[${(wo.status || 'PENDING').toUpperCase()}]</span>
        </div>
        <div class="wo-card-body">
          <div class="wo-row">
            <div class="wo-field"><span class="wo-label">TYPE</span><span class="wo-val">${wo.work_order_type || '—'}</span></div>
            <div class="wo-field"><span class="wo-label">REPORTED BY</span><span class="wo-val">${wo.reported_by || '—'}</span></div>
            <div class="wo-field"><span class="wo-label">TECHNICIAN</span><span class="wo-val">${wo.technician_name || '___________________'}</span></div>
          </div>
          <div class="wo-row" style="grid-template-columns:1fr 1fr;">
            <div class="wo-field"><span class="wo-label">START TIME</span><span class="wo-val">${startTime}</span></div>
            <div class="wo-field"><span class="wo-label">END TIME</span><span class="wo-val">${endTime}</span></div>
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

  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Data-TraCs System</div>
  </body></html>`;

  printHtml(html);
}