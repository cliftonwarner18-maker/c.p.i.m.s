import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportFieldWorkOrdersPDF({ orders }) {
  const cards = orders.map(wo => `
    <div style="border:1px solid #ccc;padding:10px 12px;margin-bottom:14px;page-break-inside:avoid;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:6px;">
        <strong style="font-size:12px;">ORDER #${wo.order_number} &nbsp;|&nbsp; BUS #${wo.bus_number}</strong>
        <span style="font-size:9px;color:#555;">Reported by: ${wo.reported_by || '—'} | ${moment(wo.created_date).format('MM/DD/YYYY HH:mm')}</span>
      </div>
      <div style="font-size:9px;margin-bottom:8px;"><strong>ISSUE:</strong><br/><span style="padding-left:8px;">${wo.issue_description || '—'}</span></div>
      <div style="font-size:9px;margin-bottom:6px;"><strong>[ ] REPAIR COMPLETE</strong></div>
      <table style="width:100%;border:none;font-size:9px;">
        <tr>
          <td style="width:50%;padding:3px 0;">Start Time: ____________________</td>
          <td style="width:50%;padding:3px 0;">End Time: ____________________</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:3px 0;">Technician Name: ______________________________________________</td>
        </tr>
      </table>
      <div style="font-size:9px;margin-top:6px;"><strong>REPAIRS PERFORMED:</strong></div>
      <div style="border:1px solid #ccc;height:52px;margin-top:4px;"></div>
    </div>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>NHCS Field Work Orders</title>
  <style>
    ${PRINT_BASE_CSS}
    .instruction { font-size:9px;font-style:italic;color:#555;margin-bottom:12px;padding:6px 8px;background:#f9f9f9;border:1px solid #dde2ee; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Field Assignment Clipboard</div>
    <div class="title">FIELD WORK ORDERS — ${moment().format('MM/DD/YYYY')}</div>
  </div>
  <div class="gold-bar"></div>
  <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:10px;">
    <span>Technician Name: ________________________________</span>
    <span>Date: ${moment().format('MM/DD/YYYY')}</span>
  </div>
  <div class="instruction">
    INSTRUCTIONS: Complete each work order in the field. Check box when complete. Record time, technician name, and repairs performed.
  </div>
  ${cards || '<p style="text-align:center;color:#888;padding:20px;">No pending work orders found.</p>'}
  <div class="page-footer">New Hanover County Schools | Transportation Department | Field Work Order Assignment</div>
  </body></html>`;

  printHtml(html);
}