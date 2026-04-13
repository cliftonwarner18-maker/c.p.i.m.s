import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { busIds } = body;

    let buses = await base44.entities.Bus.list();
    if (busIds && busIds.length > 0) {
      const idSet = new Set(busIds);
      buses = buses.filter(b => idSet.has(b.id));
    }

    const rows = buses.map((b, i) => {
      const total = ((b.cameras_inside || 0) + (b.cameras_outside || 0)) || '—';
      const bg = i % 2 === 0 ? '#fff' : '#f5f7fd';
      return `<tr style="background:${bg}">
        <td><b>${b.bus_number || '—'}</b></td>
        <td>${b.bus_type || '—'}</td>
        <td>${b.base_location || '—'}</td>
        <td>${b.year || '—'}</td>
        <td>${[b.make, b.model].filter(Boolean).join(' ') || '—'}</td>
        <td>${b.status || '—'}</td>
        <td>${b.camera_system_type || '—'}</td>
        <td>${b.cameras_inside ?? '—'}</td>
        <td>${b.cameras_outside ?? '—'}</td>
        <td><b>${total}</b></td>
        <td>${b.stop_arm_cameras ? 'YES' : 'NO'}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Fleet Inventory</title>
    <style>
      body { font-family: 'Courier New', monospace; font-size: 10px; }
      @page { size: letter landscape; margin: 0.5in; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      h1 { font-size: 15px; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background: #142c5f; color: white; }
      th, td { padding: 4px 7px; border-bottom: 1px solid #dde2ee; text-align: left; font-size: 9px; }
      tfoot td { background: #142c5f; color: #c8a830; font-weight: bold; padding: 5px 7px; }
    </style>
    </head><body>
    <h1>NEW HANOVER COUNTY SCHOOLS — FLEET INVENTORY REPORT</h1>
    <p style="margin:0 0 10px; font-size:9px;">Generated: ${moment().tz('America/New_York').format('MM/DD/YYYY HH:mm')} ET &nbsp;|&nbsp; Vehicles: ${buses.length}</p>
    <table>
      <thead><tr><th>BUS #</th><th>TYPE</th><th>LOCATION</th><th>YEAR</th><th>MAKE/MODEL</th><th>STATUS</th><th>CAM SYS</th><th>IN</th><th>OUT</th><th>TOTAL</th><th>STOP ARM</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="10">TOTAL VEHICLES</td><td>${buses.length}</td></tr></tfoot>
    </table>
    </body></html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});