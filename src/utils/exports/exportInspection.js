import { printHtml, PRINT_BASE_CSS } from '../printHtml';
import moment from 'moment';

export function exportInspectionPDF({ inspection, bus }) {
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

  const elapsedMin = (inspection.elapsed_minutes || 0);
  const elapsedHrs = (elapsedMin / 60).toFixed(2);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Inspection Report Bus #${inspection.bus_number}</title>
  <style>
    ${PRINT_BASE_CSS}
    .check-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:12px 0; }
    .check-item { display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border:1px solid #dde2ee; font-size:10px; background:#fafbff; }
    .overall-bar { background:${resultColor}; color:white; text-align:center; padding:12px; font-size:14px; font-weight:700; letter-spacing:0.1em; margin:14px 0; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department — Vehicle Surveillance System</div>
    <div class="title">CAMERA SYSTEM INSPECTION REPORT</div>
  </div>
  <div class="gold-bar"></div>
  
  <div class="meta-box">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div><strong>INSPECTION #:</strong> ${inspection.inspection_number || '—'}</div>
      <div><strong>BUS #:</strong> ${inspection.bus_number || '—'}</div>
      <div><strong>INSPECTOR:</strong> ${inspection.inspector_name || '—'}</div>
      <div><strong>INSPECTION DATE:</strong> ${inspection.inspection_date ? moment(inspection.inspection_date).format('MM/DD/YYYY') : '—'}</div>
      ${bus ? `<div><strong>CAMERA SYSTEM:</strong> ${bus.camera_system_type || '—'}</div>` : ''}
      ${bus ? `<div><strong>SERIAL #:</strong> ${bus.camera_serial_number || '—'}</div>` : ''}
      <div><strong>LENS CONDITION:</strong> ${inspection.lenses_condition || '—'}</div>
      <div><strong>ELAPSED TIME:</strong> ${elapsedMin} min (${elapsedHrs} hrs)</div>
    </div>
  </div>

  <div class="section-header">INSPECTION CHECKLIST</div>
  <div class="check-grid">
    ${checkItems.map(item => `
      <div class="check-item">
        <span>${item.label}</span>
        <span style="font-weight:700;color:${item.val ? '#166534' : '#991b1b'}">${item.val ? '✓ PASS' : '✗ FAIL'}</span>
      </div>`).join('')}
  </div>

  <div class="overall-bar">OVERALL RESULT: ${(inspection.overall_status || '—').toUpperCase()}</div>

  ${inspection.inspection_notes ? `
  <div class="section-header">INSPECTOR NOTES</div>
  <div style="padding:10px;background:#f9f9f9;border:1px solid #dde2ee;font-size:10px;line-height:1.5;">${inspection.inspection_notes}</div>
  ` : ''}

  <div style="border:2px solid #1e3c78;padding:10px;margin-top:14px;font-weight:700;font-size:11px;color:#1e3c78;background:#e8ecf5;">
    NEXT INSPECTION DUE: ${inspection.next_inspection_due ? moment(inspection.next_inspection_due).format('MM/DD/YYYY') : 'TBD'}
  </div>

  <div class="page-footer">NEW HANOVER COUNTY SCHOOLS — Transportation Department — Camera Surveillance System</div>
  </body></html>`;

  printHtml(html);
}