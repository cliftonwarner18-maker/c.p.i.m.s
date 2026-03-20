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

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Inspection Bus #${inspection.bus_number}</title>
  <style>
    ${PRINT_BASE_CSS}
    .check-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:8px 0; }
    .check-item { display:flex; justify-content:space-between; align-items:center; padding:5px 8px; border:1px solid #dde2ee; font-size:10px; }
    .overall-bar { background:${resultColor}; color:white; text-align:center; padding:10px; font-size:14px; font-weight:700; letter-spacing:0.1em; margin:14px 0; }
  </style>
  </head><body>
  <div class="page-header">
    <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
    <div class="dept">Transportation Department</div>
    <div class="title">OFFICIAL CAMERA SURVEILLANCE INSPECTION REPORT</div>
  </div>
  <div class="gold-bar"></div>
  <div class="meta-box">
    <div class="meta-item"><strong>INSPECTION #:</strong> ${inspection.inspection_number || '—'}</div>
    <div class="meta-item"><strong>BUS #:</strong> ${inspection.bus_number || '—'}</div>
    <div class="meta-item"><strong>INSPECTOR:</strong> ${inspection.inspector_name || '—'}</div>
    <div class="meta-item"><strong>DATE / TIME:</strong> ${inspection.inspection_date ? moment(inspection.inspection_date).format('MM/DD/YYYY HH:mm') : '—'}</div>
    ${bus ? `<div class="meta-item"><strong>CAMERA SYSTEM:</strong> ${bus.camera_system_type || '—'}</div>` : ''}
    ${bus ? `<div class="meta-item"><strong>SERIAL #:</strong> ${bus.camera_serial_number || '—'}</div>` : ''}
    <div class="meta-item"><strong>LENS CONDITION:</strong> ${inspection.lenses_condition || '—'}</div>
    <div class="meta-item"><strong>GENERATED:</strong> ${moment().format('MM/DD/YYYY HH:mm')} ET</div>
  </div>

  <div class="section-header">INSPECTION RESULTS</div>
  <div class="check-grid">
    ${checkItems.map(item => `
      <div class="check-item">
        <span>${item.label}</span>
        <span class="${item.val ? 'pass' : 'fail'}">${item.val ? 'PASS' : 'FAIL'}</span>
      </div>`).join('')}
  </div>

  <div class="overall-bar">OVERALL RESULT: ${(inspection.overall_status || '—').toUpperCase()}</div>

  ${inspection.inspection_notes ? `
  <div class="section-header">INSPECTION NOTES</div>
  <div style="padding:8px;background:#f9f9f9;border:1px solid #dde2ee;font-size:10px;">${inspection.inspection_notes}</div>
  ` : ''}

  ${inspection.next_inspection_due ? `
  <div style="border:2px solid #142c5f;text-align:center;padding:8px;margin-top:12px;font-weight:700;font-size:12px;color:#142c5f;">
    NEXT INSPECTION DUE: ${moment(inspection.next_inspection_due).format('MM/DD/YYYY')}
  </div>` : ''}

  <div class="page-footer">New Hanover County Schools | Transportation Department | Vehicle Surveillance System | Bus #${inspection.bus_number} | ${moment().format('MM/DD/YYYY')}</div>
  </body></html>`;

  printHtml(html);
}