import { format } from 'date-fns';
import { printHtml } from '@/utils/printHtml';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dt = (d) => (d ? format(new Date(d + 'T12:00:00'), 'MM/dd/yyyy') : '—');
const v = (x) => (x === undefined || x === null || x === '' ? '—' : esc(x));
export function printInternalRecord(r) {
  const witnesses = (r.witnesses || []).filter((w) => w?.name || w?.phone);
  const witHtml = witnesses.length
    ? witnesses.map((w, i) => `<div class="w">${i + 1}. ${esc(w.name)} — ${esc(w.phone)}</div>`).join('')
    : '<div class="w">—</div>';

  const fld = (l, val, span = 's4') => `<div class="fld ${span}"><div class="lbl">${l}</div><div class="fvl">${val}</div></div>`;
  const cb = (b) => (b === true ? '☒' : '☐');

  const html = `<!DOCTYPE html><html><head><title>Internal Record ${esc(r.case_number)}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Courier Prime','Courier New',monospace;font-size:11px;color:#000;background:#fff}
    @page{size:letter;margin:0.4in}
    .sheet{border:3px solid #000;padding:8px}
    .hdr{display:flex;border:1px solid #000}
    .hdr .left{flex:1;padding:6px 9px;border-right:1px solid #000}
    .hdr .agency{font-size:8px;letter-spacing:.16em;font-weight:700}
    .hdr .ttl{font-size:15px;font-weight:700;letter-spacing:.06em;margin-top:4px}
    .hdr .sub{font-size:8.5px;margin-top:3px;letter-spacing:.05em}
    .hdr .right{width:158px;padding:5px 7px}
    .sechd{background:#000;color:#fff;font-size:9px;font-weight:700;letter-spacing:.14em;padding:2px 6px;margin-top:6px}
    .grid{display:grid;grid-template-columns:repeat(12,1fr);border-left:1px solid #000}
    .fld{border-right:1px solid #000;border-bottom:1px solid #000;padding:2px 5px 3px;min-height:32px}
    .lbl{font-size:7px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}
    .fvl{font-size:11px;padding-top:3px;word-break:break-word}
    .s2{grid-column:span 2}.s3{grid-column:span 3}.s4{grid-column:span 4}.s5{grid-column:span 5}
    .s6{grid-column:span 6}.s8{grid-column:span 8}.s12{grid-column:span 12}
    .box{border:1px solid #000;border-top:0;padding:6px 8px;font-size:10.5px;white-space:pre-wrap;line-height:1.45;min-height:70px}
    .box.sm{min-height:42px}
    .box .w{padding:1px 0}
    .sig{display:flex;gap:26px;margin-top:16px}
    .sig div{flex:1;border-top:1px solid #000;padding-top:3px;font-size:8px;letter-spacing:.08em}
    .ftr{margin-top:10px;border-top:1px solid #000;padding-top:4px;font-size:7.5px;display:flex;justify-content:space-between;letter-spacing:.05em}
    .hdr{background:linear-gradient(to right,#142c5f,#1e3a7a);color:#fff;padding:12px 16px}
    .hdr .org{font-size:13px;font-weight:700;letter-spacing:.08em}
    .hdr .sub{font-size:9px;opacity:.85;margin-top:2px;letter-spacing:.05em}
    .hdr .ttl{font-size:12px;font-weight:700;color:#c8a830;margin-top:6px;letter-spacing:.07em}
    .bar{height:3px;background:#b88c28;margin-bottom:12px}
  </style></head><body>
    <div class="sheet">

      <div class="hdr">
        <div class="left">
          <div class="agency">NEW HANOVER COUNTY SCHOOLS — TRANSPORTATION</div>
          <div class="ttl">STOP ARM VIOLATION — INTERNAL CASE RECORD</div>
          <div class="sub">Data-TraCs System · Enforcement Center · INTERNAL USE ONLY</div>
        </div>
        <div class="right">
          <div class="lbl">Case No.</div>
          <div class="fvl" style="font-size:13px;font-weight:700">${v(r.case_number)}</div>
          <div class="lbl" style="margin-top:6px">Status</div>
          <div class="fvl">${v(r.status)}</div>
        </div>
      </div>

      <div class="sechd">VIOLATION</div>
      <div class="grid">
        ${fld('Date of Violation', dt(r.violation_date), 's3')}
        ${fld('Time', v(r.violation_time), 's3')}
        ${fld('County', v(r.county), 's3')}
        ${fld('Evidence Source', v(r.evidence_source), 's3')}
        ${fld('Highway / Road', v(r.highway), 's6')}
        ${fld('From School', v(r.school_name), 's6')}
        ${fld('School Bus No.', v(r.school_bus_number), 's2')}
        ${fld('Bus Headed', v(r.bus_heading), 's2')}
        ${fld('Bus Stopped For', v(r.stopped_activity), 's4')}
        ${fld('Stop Arm Displayed', `<span class="cb">${cb(r.stop_arm_displayed)} YES</span>`, 's2')}
        ${fld('Red Lights Activated', `<span class="cb">${cb(r.red_lights_activated)} YES</span>`, 's2')}
      </div>

      <div class="sechd">BUS DRIVER / REPORTING PARTY</div>
      <div class="grid">
        ${fld('Bus Driver', v(r.driver_name), 's6')}
        ${fld('Driver Phone', v(r.driver_phone), 's3')}
        ${fld('Same as Reporter', `<span class="cb">${cb(r.same_as_driver)}</span>`, 's3')}
        ${fld('Reported By', v(r.reported_by), 's6')}
        ${fld('Reporter Phone', v(r.reported_by_phone), 's3')}
        ${fld('Identifiable by Witness', `<span class="cb">${cb(r.identifiable_by_witness)}</span>`, 's3')}
      </div>

      <div class="sechd">VIOLATOR VEHICLE</div>
      <div class="grid">
        ${fld('Vehicle (Year / Make / Model)', v(r.vehicle_description), 's6')}
        ${fld('Color', v(r.vehicle_color), 's2')}
        ${fld('Direction of Travel', v(r.violator_direction), 's2')}
        ${fld('License Plate', v(r.license_plate), 's2')}
        ${fld('Plate State', v(r.plate_state), 's4')}
        ${fld('Driven By', v(r.violator_name), 's4')}
        ${fld('Sex / Race / Age', [r.violator_sex, r.violator_race, r.violator_age].filter(Boolean).map(esc).join(' / ') || '—', 's4')}
      </div>

      <div class="sechd">WITNESSES AVAILABLE FOR PROSECUTION</div>
      <div class="box sm">${witHtml}</div>

      <div class="sechd">RECEIPT / ASSIGNMENT / FOLLOW-UP</div>
      <div class="grid">
        ${fld('Received By', v(r.received_by), 's4')}
        ${fld('Date Received', dt(r.received_date), 's4')}
        ${fld('Assigned To', v(r.assigned_to), 's4')}
        ${fld('Call No.', v(r.call_no), 's3')}
        ${fld('Date Assigned', dt(r.assigned_date), 's3')}
        ${fld('Owner Contacted', v(r.owner_contacted), 's3')}
        ${fld('Reason Not Contacted', v(r.owner_not_contacted_reason), 's3')}
        ${fld('Charge(s) Preferred', v(r.charges_preferred), 's6')}
        ${fld('Citation No.', v(r.citation_number), 's3')}
        ${fld('Court Date', dt(r.court_date), 's3')}
        ${fld('Returned / Closed', dt(r.returned_date), 's3')}
      </div>

      <div class="sechd">ACTION TAKEN (INCLUDING DATES AND TIMES)</div>
      <div class="box">${esc(r.action_taken) || '—'}</div>

      <div class="sechd">TRANSPORTATION INVESTIGATION — INTERNAL ONLY</div>
      <div class="grid">
        ${fld('Camera Pulled', `<span class="cb">${cb(r.investigation_camera_pulled)}</span>`, 's3')}
        ${fld('Date Pulled', dt(r.camera_pulled_date), 's3')}
        ${fld('Pulled By', v(r.camera_pulled_by), 's6')}
        ${fld('Violations Validated / Found', `<span class="cb">${r.investigation_outcome === 'Violations Validated / Found' ? '☒' : '☐'}</span>`, 's6')}
        ${fld('No Violations Witnessed / False Alarm', `<span class="cb">${r.investigation_outcome === 'No Violations Witnessed / False Alarm' ? '☒' : '☐'}</span>`, 's6')}
      </div>

      <div class="sechd">TRANSPORTATION INVESTIGATOR'S NOTES</div>
      <div class="box">${esc(r.investigator_notes) || '—'}</div>

      <div class="sechd">TRANSPORTATION DISPOSITION</div>
      <div class="box sm">${esc(r.transportation_disposition) || '—'}</div>

      <div class="sechd">NARRATIVE</div>
      <div class="box">${esc(r.narrative) || '—'}</div>

      <div class="sechd">DISPOSITION</div>
      <div class="box">${esc(r.disposition) || '—'}</div>

      <div class="sechd">INTERNAL NOTES</div>
      <div class="box sm">${esc(r.notes) || '—'}</div>

      <div class="sig">
        <div>TRANSPORTATION INVESTIGATOR — SIGNATURE</div>
        <div>SUPERVISOR — SIGNATURE</div>
        <div>DATE</div>
      </div>

      <div class="ftr">
        <span>NHCS Data-TraCs System · Internal Record · Case ${esc(r.case_number || '')}</span>
        <span>Printed ${format(new Date(), 'MM/dd/yyyy HH:mm')}</span>
      </div>
    </div>
  </body></html>`;
  printHtml(html);
}