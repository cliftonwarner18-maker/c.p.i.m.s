import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { busNumber } = await req.json();
    if (!busNumber) return Response.json({ error: 'Bus number required' }, { status: 400 });

    const buses = await base44.asServiceRole.entities.Bus.list();
    const bus = buses.find(b => b.bus_number === busNumber);
    if (!bus) return Response.json({ error: 'Bus not found' }, { status: 404 });

    const [workOrders, inspections, history] = await Promise.all([
      base44.asServiceRole.entities.WorkOrder.filter({ bus_number: busNumber }, '-created_date'),
      base44.asServiceRole.entities.Inspection.filter({ bus_number: busNumber }, '-created_date'),
      base44.asServiceRole.entities.BusHistory.filter({ bus_number: busNumber }, '-start_time'),
    ]);

    const woRows = workOrders.slice(0, 50).map((wo, i) => {
      const elapsed = wo.elapsed_time_minutes ? `${Math.floor(wo.elapsed_time_minutes/60)}h ${wo.elapsed_time_minutes%60}m` : '—';
      return `
        <tr style="background:${i%2===0?'#fff':'#f5f7fd'}">
          <td><b>${wo.order_number || wo.id?.slice(-6) || '—'}</b></td>
          <td>${wo.created_date ? moment(wo.created_date).format('MM/DD/YYYY') : '—'}</td>
          <td>${wo.status || '—'}</td>
          <td>${wo.technician_name || '—'}</td>
          <td>${elapsed}</td>
        </tr>
        ${wo.issue_description ? `<tr><td colspan="5" style="font-size:8px;color:#555;padding:1px 7px 5px 20px;">Issue: ${wo.issue_description}</td></tr>` : ''}
        ${wo.repairs_rendered ? `<tr><td colspan="5" style="font-size:8px;padding:1px 7px 5px 20px;"><b>Repairs:</b> ${wo.repairs_rendered}</td></tr>` : ''}`;
    }).join('');

    const inspRows = inspections.slice(0, 20).map((insp, i) => `
      <tr style="background:${i%2===0?'#fff':'#f5f7fd'}">
        <td><b>${insp.inspection_number || '—'}</b></td>
        <td>${insp.inspection_date ? moment(insp.inspection_date).format('MM/DD/YYYY') : '—'}</td>
        <td>${insp.inspector_name || '—'}</td>
        <td style="color:${insp.overall_status === 'Pass' ? '#166534' : '#991b1b'};font-weight:bold;">${insp.overall_status || '—'}</td>
        <td>${insp.inspection_notes || '—'}</td>
      </tr>`).join('');

    const histRows = history.slice(0, 30).map((h, i) => `
      <tr style="background:${i%2===0?'#fff':'#f5f7fd'}">
        <td>${h.start_time ? moment(h.start_time).format('MM/DD/YY HH:mm') : '—'}</td>
        <td>${h.technician || '—'}</td>
        <td>${h.elapsed_time_minutes ? h.elapsed_time_minutes + ' min' : '—'}</td>
        <td>${h.description || '—'}</td>
      </tr>`).join('');

    const css = `body{font-family:'Courier New',monospace;font-size:10px;color:#111;}
    @page{size:letter;margin:0.55in 0.5in;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    .hdr{background:#142c5f;color:white;padding:12px 16px;margin-bottom:0;}
    .hdr h1{font-size:14px;margin:0 0 3px;}
    .hdr .sub{font-size:9px;opacity:0.85;}
    .hdr .title{font-size:12px;color:#c8a830;margin-top:6px;font-weight:bold;}
    .gold{background:#b88c28;height:3px;margin-bottom:12px;}
    .meta{background:#edf1fc;border:1px solid #142c5f;padding:8px 12px;margin-bottom:10px;font-size:9px;display:flex;flex-wrap:wrap;gap:14px;}
    .meta b{color:#142c5f;}
    .sh{background:#142c5f;color:white;padding:4px 10px;font-weight:bold;font-size:9px;margin:12px 0 3px;letter-spacing:.05em;}
    table{width:100%;border-collapse:collapse;font-size:9px;}
    thead tr{background:#142c5f;color:white;}
    th{padding:5px 7px;text-align:left;font-size:8px;}
    td{padding:4px 7px;border-bottom:1px solid #dde2ee;}
    .ft{background:#142c5f;color:#c8d4ee;font-size:8px;text-align:center;padding:6px;margin-top:16px;}`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Bus #${busNumber} History</title>
    <style>${css}</style>
    </head><body>
    <div class="hdr">
      <h1>NEW HANOVER COUNTY SCHOOLS</h1>
      <div class="sub">Transportation Department — Vehicle History Transcript</div>
      <div class="title">BUS #${bus.bus_number} — ${[bus.year, bus.make, bus.model].filter(Boolean).join(' ')}</div>
    </div>
    <div class="gold"></div>
    <div class="meta">
      <span><b>BUS TYPE:</b> ${bus.bus_type || '—'}</span>
      <span><b>VIN:</b> ${bus.vin || '—'}</span>
      <span><b>BASE LOCATION:</b> ${bus.base_location || '—'}</span>
      <span><b>STATUS:</b> ${bus.status || '—'}</span>
      <span><b>CAMERA SYSTEM:</b> ${bus.camera_system_type || 'None'}</span>
      <span><b>NEXT INSPECTION:</b> ${bus.next_inspection_due ? moment(bus.next_inspection_due).format('MM/DD/YYYY') : 'Not Set'}</span>
      <span><b>GENERATED:</b> ${moment().tz('America/New_York').format('MMMM D, YYYY [at] h:mm A')} ET</span>
    </div>

    <div class="sh">REPAIR WORK ORDERS (${workOrders.length})</div>
    <table><thead><tr><th>ORDER #</th><th>DATE</th><th>STATUS</th><th>TECHNICIAN</th><th>ELAPSED</th></tr></thead>
    <tbody>${woRows || '<tr><td colspan="5" style="text-align:center;color:#888;">No repair history</td></tr>'}</tbody></table>

    <div class="sh">INSPECTION HISTORY (${inspections.length})</div>
    <table><thead><tr><th>INSP #</th><th>DATE</th><th>INSPECTOR</th><th>RESULT</th><th>NOTES</th></tr></thead>
    <tbody>${inspRows || '<tr><td colspan="5" style="text-align:center;color:#888;">No inspection history</td></tr>'}</tbody></table>

    <div class="sh">MANUAL SERVICE LOG (${history.length})</div>
    <table><thead><tr><th>DATE / TIME</th><th>TECHNICIAN</th><th>ELAPSED</th><th>DESCRIPTION</th></tr></thead>
    <tbody>${histRows || '<tr><td colspan="4" style="text-align:center;color:#888;">No log entries</td></tr>'}</tbody></table>

    ${bus.legacy_upload ? `<div class="sh">LEGACY AUDIT / REPAIR LOG</div>
    <div style="font-size:8px;white-space:pre-wrap;padding:7px;background:#f9f9f9;border:1px solid #dde2ee;">${bus.legacy_upload}</div>` : ''}

    <div class="ft">New Hanover County Schools | Transportation Department | Vehicle Surveillance System | Bus #${busNumber} | ${moment().format('MM/DD/YYYY')}</div>
    </body></html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});