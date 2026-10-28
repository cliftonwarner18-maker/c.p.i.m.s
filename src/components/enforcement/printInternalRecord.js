import { format } from 'date-fns';
import { printHtml } from '@/utils/printHtml';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dt = (d) => (d ? format(new Date(d + 'T12:00:00'), 'MM/dd/yyyy') : '—');
const v = (x) => (x === undefined || x === null || x === '' ? '—' : esc(x));
const tf = (b) => (b === true ? 'YES' : b === false ? 'NO' : '—');

export function printInternalRecord(r) {
  const rows = [
    ['Case Number', v(r.case_number)],
    ['Status', v(r.status)],
    ['Evidence Source', v(r.evidence_source)],
    ['Violation Date', dt(r.violation_date)],
    ['Violation Time', v(r.violation_time)],
    ['County', v(r.county)],
    ['Highway / Road', v(r.highway)],
    ['School Bus No.', v(r.school_bus_number)],
    ['From School', v(r.school_name)],
    ['Bus Driver', v(r.driver_name)],
    ['Driver Phone', v(r.driver_phone)],
    ['Bus Headed', v(r.bus_heading)],
    ['Bus Stopped', v(r.stopped_activity)],
    ['Stop Arm Displayed', tf(r.stop_arm_displayed)],
    ['Red Lights Activated', tf(r.red_lights_activated)],
    ['Vehicle', v(r.vehicle_description)],
    ['Vehicle Color', v(r.vehicle_color)],
    ['License Plate', v([r.license_plate, r.plate_state].filter(Boolean).join(' · '))],
    ['Driven By', v(r.violator_name)],
    ['Sex / Race / Age', [r.violator_sex, r.violator_race, r.violator_age].filter(Boolean).map(esc).join(' / ') || '—'],
    ['Violator Direction', v(r.violator_direction)],
    ['Reported By', v(r.reported_by)],
    ['Reporter Phone', v(r.reported_by_phone)],
    ['Reporter Same as Driver', tf(r.same_as_driver)],
    ['Identifiable by Witness', tf(r.identifiable_by_witness)],
    ['Received By', v(r.received_by)],
    ['Date Received', dt(r.received_date)],
    ['Assigned To', v(r.assigned_to)],
    ['Call No.', v(r.call_no)],
    ['Date Assigned', dt(r.assigned_date)],
    ['Owner Contacted', v(r.owner_contacted)],
    ['Reason Not Contacted', v(r.owner_not_contacted_reason)],
    ['Charges Preferred', v(r.charges_preferred)],
    ['Citation Number', v(r.citation_number)],
    ['Court Date', dt(r.court_date)],
    ['Returned / Closed Date', dt(r.returned_date)],
  ];

  const witnesses = (r.witnesses || []).filter((w) => w?.name || w?.phone);
  const witHtml = witnesses.length
    ? witnesses.map((w, i) => `<div class="w">${i + 1}. ${esc(w.name)} — ${esc(w.phone)}</div>`).join('')
    : '<div class="w">—</div>';

  const html = `<!DOCTYPE html><html><head><title>Internal Record ${esc(r.case_number)}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Courier Prime','Courier New',monospace;font-size:11px;color:#111}
    @page{size:letter;margin:0.5in}
    .hdr{background:linear-gradient(to right,#142c5f,#1e3a7a);color:#fff;padding:12px 16px}
    .hdr .org{font-size:13px;font-weight:700;letter-spacing:.08em}
    .hdr .sub{font-size:9px;opacity:.85;margin-top:2px;letter-spacing:.05em}
    .hdr .ttl{font-size:12px;font-weight:700;color:#c8a830;margin-top:6px;letter-spacing:.07em}
    .bar{height:3px;background:#b88c28;margin-bottom:12px}
    .sec{background:#142c5f;color:#fff;font-weight:700;font-size:10px;letter-spacing:.06em;padding:4px 9px;margin:12px 0 0}
    table{width:100%;border-collapse:collapse}
    td{border:1px solid #c9d1e3;padding:4px 8px;font-size:10px;vertical-align:top}
    td.k{width:32%;background:#edf1fc;font-weight:700;color:#142c5f}
    .box{border:1px solid #c9d1e3;border-top:0;padding:8px 10px;font-size:10px;white-space:pre-wrap;min-height:90px;line-height:1.5}
    .box.sm{min-height:55px}
    .w{padding:1px 0}
    .ftr{margin-top:16px;background:#142c5f;color:#c8d4ee;font-size:8px;text-align:center;padding:6px}
  </style></head><body>
    <div class="hdr">
      <div class="org">NEW HANOVER COUNTY SCHOOLS — TRANSPORTATION</div>
      <div class="sub">Data-TraCs System · Enforcement Center</div>
      <div class="ttl">STOP ARM VIOLATION — INTERNAL RECORD</div>
    </div>
    <div class="bar"></div>
    <div class="sec">CASE INFORMATION</div>
    <table>${rows.map(([k, val]) => `<tr><td class="k">${k}</td><td>${val}</td></tr>`).join('')}</table>
    <div class="sec">WITNESSES</div>
    <div class="box sm">${witHtml}</div>
    <div class="sec">ACTION TAKEN (INCLUDING DATES AND TIMES)</div>
    <div class="box">${esc(r.action_taken) || '—'}</div>
    <div class="sec">NARRATIVE</div>
    <div class="box">${esc(r.narrative) || '—'}</div>
    <div class="sec">DISPOSITION</div>
    <div class="box">${esc(r.disposition) || '—'}</div>
    <div class="sec">INTERNAL NOTES</div>
    <div class="box sm">${esc(r.notes) || '—'}</div>
    <div class="ftr">NHCS Data-TraCs System · Internal Record · ${esc(r.case_number || '')} · Printed ${format(new Date(), 'MM/dd/yyyy HH:mm')}</div>
  </body></html>`;
  printHtml(html);
}