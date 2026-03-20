import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [buses, workOrders, inspections, serializedAssets, nonSerializedAssets, hdrives, users, custodyLogs, busHistory] = await Promise.all([
      base44.entities.Bus.list(),
      base44.entities.WorkOrder.list(),
      base44.entities.Inspection.list(),
      base44.entities.SerializedAsset.list(),
      base44.entities.NonSerializedAsset.list(),
      base44.entities.HDrive.list(),
      base44.entities.User.list(),
      base44.entities.CustodyLog.list(),
      base44.entities.BusHistory.list(),
    ]);

    const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const busRows = buses.map((b, i) => `
      <tr style="background:${i%2===0?'#fff':'#f5f7fd'}">
        <td><b>${esc(b.bus_number)}</b></td>
        <td>${esc(b.bus_type)}</td>
        <td>${esc([b.year,b.make,b.model].filter(Boolean).join(' '))}</td>
        <td>${esc(b.vin)}</td>
        <td>${esc(b.base_location)}</td>
        <td>${esc(b.status)}</td>
        <td>${esc(b.camera_system_type || 'None')}</td>
        <td>${b.next_inspection_due ? moment(b.next_inspection_due).format('MM/DD/YYYY') : '—'}</td>
      </tr>`).join('');

    const woRows = workOrders.map((wo, i) => `
      <tr style="background:${i%2===0?'#fff':'#f5f7fd'}">
        <td><b>${esc(wo.order_number)}</b></td>
        <td>${esc(wo.bus_number)}</td>
        <td>${esc(wo.status)}</td>
        <td>${esc(wo.technician_name)}</td>
        <td>${wo.created_date ? moment(wo.created_date).format('MM/DD/YY') : '—'}</td>
        <td style="max-width:200px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${esc(wo.issue_description)}</td>
      </tr>`).join('');

    const inspRows = inspections.map((insp, i) => `
      <tr style="background:${i%2===0?'#fff':'#f5f7fd'}">
        <td><b>${esc(insp.inspection_number)}</b></td>
        <td>${esc(insp.bus_number)}</td>
        <td>${esc(insp.inspector_name)}</td>
        <td style="color:${insp.overall_status==='Pass'?'#166534':'#991b1b'};font-weight:bold;">${esc(insp.overall_status)}</td>
        <td>${insp.inspection_date ? moment(insp.inspection_date).format('MM/DD/YY') : '—'}</td>
      </tr>`).join('');

    const assetRows = serializedAssets.map((a, i) => `
      <tr style="background:${i%2===0?'#fff':'#f5f7fd'}">
        <td><b>${esc(a.asset_number)}</b></td>
        <td>${esc(a.brand)}</td>
        <td>${esc(a.model)}</td>
        <td>${esc(a.serial_number)}</td>
        <td>${esc(a.status)}</td>
        <td>${esc(a.assigned_bus_number)}</td>
      </tr>`).join('');

    const techHours = {};
    workOrders.forEach(wo => {
      if (wo.technician_name && wo.elapsed_time_minutes) {
        if (!techHours[wo.technician_name]) techHours[wo.technician_name] = 0;
        techHours[wo.technician_name] += wo.elapsed_time_minutes;
      }
    });
    const techRows = Object.entries(techHours).map(([tech, min]) => `
      <tr><td>${esc(tech)}</td><td>${min} min</td><td>${(min/60).toFixed(1)} hrs</td></tr>`).join('');

    const css = `body{font-family:'Courier New',monospace;font-size:10px;color:#111;}
    @page{size:letter;margin:0.5in;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    .hdr{background:#142c5f;color:white;padding:14px 18px;}
    .hdr h1{font-size:15px;margin:0 0 2px;}
    .hdr .sub{font-size:9px;opacity:.85;}
    .gold{background:#b88c28;height:3px;margin-bottom:14px;}
    .summary{background:#edf1fc;border:1px solid #142c5f;padding:10px 14px;margin-bottom:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:9px;}
    .summary b{color:#142c5f;}
    .sh{background:#142c5f;color:white;padding:5px 10px;font-weight:bold;font-size:10px;margin:14px 0 4px;letter-spacing:.05em;}
    table{width:100%;border-collapse:collapse;font-size:9px;margin-bottom:8px;}
    thead tr{background:#142c5f;color:white;}
    th{padding:5px 7px;text-align:left;font-size:8px;}
    td{padding:4px 7px;border-bottom:1px solid #dde2ee;}
    .ft{background:#142c5f;color:#c8d4ee;font-size:8px;text-align:center;padding:7px;margin-top:20px;}`;

    const now = moment().format('MMMM D, YYYY [at] h:mm A');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>NHCS Master System Backup</title>
    <style>${css}</style>
    </head><body>
    <div class="hdr">
      <h1>NEW HANOVER COUNTY SCHOOLS</h1>
      <div class="sub">Transportation Department | Master System Backup</div>
    </div>
    <div class="gold"></div>
    <div class="summary">
      <span><b>Fleet Vehicles:</b> ${buses.length}</span>
      <span><b>Work Orders:</b> ${workOrders.length}</span>
      <span><b>Inspections:</b> ${inspections.length}</span>
      <span><b>Service History:</b> ${busHistory.length}</span>
      <span><b>Serialized Assets:</b> ${serializedAssets.length}</span>
      <span><b>Spare Parts:</b> ${nonSerializedAssets.length}</span>
      <span><b>H-Drives:</b> ${hdrives.length}</span>
      <span><b>Custody Logs:</b> ${custodyLogs.length}</span>
      <span><b>Generated:</b> ${now} EST</span>
    </div>

    <div class="sh">FLEET VEHICLES</div>
    <table><thead><tr><th>BUS #</th><th>TYPE</th><th>YEAR/MAKE/MODEL</th><th>VIN</th><th>BASE</th><th>STATUS</th><th>CAMERA SYS</th><th>NEXT INSP</th></tr></thead>
    <tbody>${busRows}</tbody></table>

    <div class="sh">WORK ORDERS</div>
    <table><thead><tr><th>ORDER #</th><th>BUS #</th><th>STATUS</th><th>TECHNICIAN</th><th>DATE</th><th>ISSUE</th></tr></thead>
    <tbody>${woRows}</tbody></table>

    <div class="sh">INSPECTIONS</div>
    <table><thead><tr><th>INSP #</th><th>BUS #</th><th>INSPECTOR</th><th>RESULT</th><th>DATE</th></tr></thead>
    <tbody>${inspRows}</tbody></table>

    <div class="sh">SERIALIZED ASSETS</div>
    <table><thead><tr><th>ASSET #</th><th>BRAND</th><th>MODEL</th><th>SERIAL #</th><th>STATUS</th><th>BUS</th></tr></thead>
    <tbody>${assetRows}</tbody></table>

    ${techRows ? `<div class="sh">TECHNICIAN HOURS SUMMARY</div>
    <table><thead><tr><th>TECHNICIAN</th><th>MINUTES</th><th>HOURS</th></tr></thead>
    <tbody>${techRows}</tbody></table>` : ''}

    <div class="ft">Master Backup | ${moment().format('MM/DD/YYYY HH:mm')} EST | Exported by: ${esc(user.full_name || user.email)} | Powered by Base44</div>
    </body></html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});