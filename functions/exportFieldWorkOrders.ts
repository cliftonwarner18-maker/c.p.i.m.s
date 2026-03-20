import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const workOrders = await base44.entities.WorkOrder.list();
    const pending = workOrders
      .filter(wo => wo.status === 'Pending')
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    const cards = pending.map(wo => `
      <div style="border:1px solid #ccc;padding:10px 12px;margin-bottom:14px;page-break-inside:avoid;">
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:6px;">
          <strong style="font-size:12px;">ORDER #${wo.order_number} &nbsp;|&nbsp; BUS #${wo.bus_number}</strong>
          <span style="font-size:8px;color:#555;">Reported by: ${wo.reported_by || '—'} | ${moment(wo.created_date).tz('America/New_York').format('MM/DD/YYYY HH:mm')}</span>
        </div>
        <div style="font-size:9px;margin-bottom:7px;"><strong>ISSUE:</strong><br/><span style="padding-left:8px;">${wo.issue_description || '—'}</span></div>
        <div style="font-size:9px;margin-bottom:5px;"><strong>[ ] REPAIR COMPLETE</strong></div>
        <div style="font-size:9px;margin-bottom:4px;">Start Time: ____________________&nbsp;&nbsp;&nbsp;End Time: ____________________</div>
        <div style="font-size:9px;margin-bottom:6px;">Technician Name: ______________________________________________</div>
        <div style="font-size:9px;font-weight:bold;margin-bottom:3px;">REPAIRS PERFORMED:</div>
        <div style="border:1px solid #ccc;height:52px;"></div>
      </div>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Field Work Orders</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 10px; color: #111; }
      @page { size: letter; margin: 0.55in 0.5in; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      .hdr { background: #142c5f; color: white; padding: 12px 16px; margin-bottom: 0; }
      .hdr h1 { font-size: 13px; margin: 0 0 2px; }
      .gold { background: #b88c28; height: 3px; margin-bottom: 12px; }
      .meta { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 10px; }
      .note { font-size: 8px; font-style: italic; color: #555; margin-bottom: 10px; padding: 5px 8px; background: #f9f9f9; border: 1px solid #dde2ee; }
      .ft { background: #142c5f; color: #c8d4ee; font-size: 8px; text-align: center; padding: 6px; margin-top: 16px; }
    </style>
    </head><body>
    <div class="hdr">
      <h1>NEW HANOVER COUNTY SCHOOLS — Field Work Orders Clipboard</h1>
    </div>
    <div class="gold"></div>
    <div class="meta">
      <span>Technician Name: ________________________________</span>
      <span>Date: ${moment().tz('America/New_York').format('MM/DD/YYYY')}</span>
    </div>
    <div class="note">INSTRUCTIONS: Complete each work order in the field. Check box when complete. Record time, technician name, and repairs performed.</div>
    ${cards || '<p style="text-align:center;color:#888;padding:20px;">No pending work orders found.</p>'}
    <div class="ft">New Hanover County Schools | Transportation Department | Field Work Order Assignment</div>
    </body></html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});