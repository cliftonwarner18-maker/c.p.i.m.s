import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { inspectionId } = await req.json();
    if (!inspectionId) return Response.json({ error: 'Inspection ID required' }, { status: 400 });

    const inspections = await base44.asServiceRole.entities.Inspection.list();
    const inspection = inspections.find(i => i.id === inspectionId);
    if (!inspection) return Response.json({ error: 'Inspection not found' }, { status: 404 });

    const buses = await base44.asServiceRole.entities.Bus.list();
    const bus = buses.find(b => b.bus_number === inspection.bus_number);

    const checkItems = [
      { label: 'Camera System Functional', val: inspection.camera_system_functional },
      { label: 'Mounting Secure', val: inspection.mounting_secure },
      { label: 'DVR System Functional', val: inspection.dvr_functional },
      { label: 'Date / Time Accuracy', val: inspection.date_time_accuracy },
      { label: 'Signals & Lights Functional', val: inspection.signals_lights_functional },
      { label: 'Programming Verified', val: inspection.programming_verified },
    ];

    const resultColor = inspection.overall_status === 'Pass'
      ? '#166534' : inspection.overall_status === 'Fail' ? '#991b1b' : '#92400e';

    const checksHtml = checkItems.map(item => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border:1px solid #dde2ee;margin-bottom:4px;font-size:10px;">
        <span>${item.label}</span>
        <span style="font-weight:bold;color:${item.val ? '#166534' : '#991b1b'}">${item.val ? 'PASS' : 'FAIL'}</span>
      </div>`).join('');

    const css = `body{font-family:'Courier New',monospace;font-size:10px;color:#111;}
    @page{size:letter;margin:0.55in 0.5in;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    .hdr{background:#142c5f;color:white;padding:12px 16px;}
    .hdr h1{font-size:13px;margin:0 0 2px;}
    .hdr .sub{font-size:9px;opacity:.85;}
    .hdr .title{font-size:11px;color:#c8a830;margin-top:6px;font-weight:bold;}
    .gold{background:#b88c28;height:3px;margin-bottom:12px;}
    .meta{background:#edf1fc;border:1px solid #142c5f;padding:8px 12px;margin-bottom:10px;font-size:9px;display:flex;flex-wrap:wrap;gap:12px;}
    .meta b{color:#142c5f;}
    .sh{background:#142c5f;color:white;padding:4px 10px;font-weight:bold;font-size:9px;margin:12px 0 6px;letter-spacing:.05em;}
    .overall{color:white;text-align:center;padding:10px;font-size:14px;font-weight:bold;letter-spacing:.1em;margin:14px 0;}
    .ft{background:#142c5f;color:#c8d4ee;font-size:8px;text-align:center;padding:6px;margin-top:18px;}`;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Inspection Bus #${inspection.bus_number}</title>
    <style>${css}</style>
    </head><body>
    <div class="hdr">
      <h1>NEW HANOVER COUNTY SCHOOLS</h1>
      <div class="sub">Transportation Department</div>
      <div class="title">OFFICIAL CAMERA SURVEILLANCE INSPECTION REPORT</div>
    </div>
    <div class="gold"></div>
    <div class="meta">
      <span><b>INSPECTION #:</b> ${inspection.inspection_number || '—'}</span>
      <span><b>BUS #:</b> ${inspection.bus_number || '—'}</span>
      <span><b>INSPECTOR:</b> ${inspection.inspector_name || '—'}</span>
      <span><b>DATE/TIME:</b> ${inspection.inspection_date ? moment(inspection.inspection_date).tz('America/New_York').format('MM/DD/YYYY HH:mm') : '—'}</span>
      ${bus ? `<span><b>CAMERA SYSTEM:</b> ${bus.camera_system_type || '—'}</span>` : ''}
      ${bus ? `<span><b>SERIAL #:</b> ${bus.camera_serial_number || '—'}</span>` : ''}
      <span><b>LENS CONDITION:</b> ${inspection.lenses_condition || '—'}</span>
      <span><b>GENERATED:</b> ${moment().tz('America/New_York').format('MM/DD/YYYY HH:mm')} ET</span>
    </div>
    <div class="sh">INSPECTION RESULTS</div>
    ${checksHtml}
    <div class="overall" style="background:${resultColor};">OVERALL RESULT: ${(inspection.overall_status || '—').toUpperCase()}</div>
    ${inspection.inspection_notes ? `<div class="sh">INSPECTION NOTES</div>
    <div style="padding:8px;background:#f9f9f9;border:1px solid #dde2ee;font-size:10px;">${inspection.inspection_notes}</div>` : ''}
    ${inspection.next_inspection_due ? `<div style="border:2px solid #142c5f;text-align:center;padding:8px;margin-top:12px;font-weight:bold;font-size:12px;color:#142c5f;">NEXT INSPECTION DUE: ${moment(inspection.next_inspection_due).format('MM/DD/YYYY')}</div>` : ''}
    <div class="ft">New Hanover County Schools | Transportation Department | Vehicle Surveillance System | Bus #${inspection.bus_number} | ${moment().format('MM/DD/YYYY')}</div>
    </body></html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});