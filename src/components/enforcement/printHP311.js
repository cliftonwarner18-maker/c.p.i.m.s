import { format } from 'date-fns';
import { printHtml } from '@/utils/printHtml';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const box = (on) => `<span class="cb">${on ? 'X' : '&nbsp;'}</span>`;
const fld = (v, w) => `<span class="f" style="min-width:${w}px">${esc(v) || '&nbsp;'}</span>`;
const dt = (d) => (d ? format(new Date(d + 'T12:00:00'), 'MM/dd/yyyy') : '');

function timeParts(t) {
  if (!t) return { time: '', pm: null };
  const [h, m] = t.split(':').map(Number);
  const pm = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${h12}:${String(m).padStart(2, '0')}`, pm };
}

export function printHP311(r) {
  const { time, pm } = timeParts(r.violation_time);
  const has = !!r.violation_time;
  const w = [r.witnesses?.[0] || {}, r.witnesses?.[1] || {}];
  const dir = (d, x) => box(d === x);
  const html = `<!DOCTYPE html><html><head><title>HP-311 ${esc(r.case_number)}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;font-size:11.5px;color:#000;padding:0}
    @page{size:letter;margin:0.45in 0.5in}
    .hd{display:flex;justify-content:space-between}
    .ctr{text-align:center;font-size:15px;margin-top:2px}
    .ttl{text-align:center;font-weight:bold;font-size:17px;margin:8px 0 22px}
    .row{margin:9px 0;line-height:1.5}
    .f{display:inline-block;border-bottom:1px solid #000;padding:0 3px;font-weight:bold;vertical-align:bottom;min-height:14px}
    .cb{display:inline-block;width:12px;height:12px;border:1px solid #000;text-align:center;line-height:10px;font-size:10px;font-weight:bold;vertical-align:middle;margin:0 2px}
    .wit{display:flex;gap:20px;margin-top:6px}.wit div{flex:1;border-bottom:1px solid #000;min-height:24px;padding-top:8px;font-weight:bold}
    .lbl{display:flex;gap:20px;font-size:9px;text-align:center}.lbl div{flex:1}
    .note{margin-top:14px;font-size:11px;padding-left:55px;text-indent:-55px}
  </style></head><body>
  <div class="hd"><div style="font-size:10px">HP-311<br>Rev. 12/2014</div><div></div><div style="width:60px"></div></div>
  <div class="ctr" style="margin-top:-24px">North Carolina<br>State Highway Patrol</div>
  <div class="ttl">REPORT OF VIOLATION OF<br>SCHOOL BUS LAW (G.S. 20-217)</div>

  <div class="row">To: First Sergeant ${fld(r.to_sergeant, 520)}</div>
  <div class="row">Violation occurred on ${fld(dt(r.violation_date), 110)} at ${fld(time, 60)} ${box(has && !pm)}am ${box(has && pm)}pm in ${fld(r.county, 170)} County</div>
  <div class="row">on Highway ${fld(r.highway, 600)} .</div>
  <div class="row">School Bus No. ${fld(r.school_bus_number, 80)} from ${fld(r.school_name, 380)} School</div>
  <div class="row">was driven by ${fld(r.driver_name, 300)} Phone Number: ${fld(r.driver_phone, 110)}</div>
  <div class="row">It was headed ${dir(r.bus_heading, 'E')}E ${dir(r.bus_heading, 'W')}W ${dir(r.bus_heading, 'N')}N ${dir(r.bus_heading, 'S')}S and was stopped ${box(r.stopped_activity === 'Loading')}loading / ${box(r.stopped_activity === 'Unloading')}unloading school children. The mechanical stop arm ${box(r.stop_arm_displayed === true)}was / ${box(r.stop_arm_displayed === false)}was not displayed. The flashing red stoplight ${box(r.red_lights_activated === true)}was / ${box(r.red_lights_activated === false)}was not activated.</div>
  <div class="row">Vehicle: ${fld(r.vehicle_description, 150)} Color: ${fld(r.vehicle_color, 80)} License Number: ${fld(r.license_plate, 110)} State: ${fld(r.plate_state, 80)}</div>
  <div class="row">Driven By: ${fld(r.violator_name, 230)} Sex: ${box(r.violator_sex === 'Male')}Male ${box(r.violator_sex === 'Female')}Female &nbsp; Race: ${fld(r.violator_race, 80)} Age: ${fld(r.violator_age, 80)}</div>
  <div class="row">Going ${dir(r.violator_direction, 'E')}E ${dir(r.violator_direction, 'W')}W ${dir(r.violator_direction, 'N')}N ${dir(r.violator_direction, 'S')}S passed unlawfully.</div>
  <div class="row">Witnesses available for prosecution:</div>
  <div class="wit"><div>${esc(w[0].name)}</div><div>${esc(w[0].phone)}</div></div>
  <div class="lbl"><div>(Name)</div><div>(Phone Number)</div></div>
  <div class="wit"><div>${esc(w[1].name)}</div><div>${esc(w[1].phone)}</div></div>
  <div class="lbl"><div>(Name)</div><div>(Phone Number)</div></div>
  <div class="row">Reported By: ${fld(r.reported_by, 330)} Phone Number: ${fld(r.reported_by_phone, 130)}</div>
  <div class="row">Same as Bus Driver? ${box(r.same_as_driver === true)}Yes ${box(r.same_as_driver === false)}No &nbsp; Is violator identifiable by witness for court? ${box(r.identifiable_by_witness === true)}Yes ${box(r.identifiable_by_witness === false)}No</div>
  <div class="row">Received By: ${fld(r.received_by, 400)} on ${fld(dt(r.received_date), 110)}</div>
  <div class="row">Assigned To: ${fld(r.assigned_to, 280)} Call No.: ${fld(r.call_no, 80)} on ${fld(dt(r.assigned_date), 110)}</div>
  <div class="row">Was the registered owner of the violator vehicle contacted? ${box(r.owner_contacted === 'Yes')}Yes ${box(r.owner_contacted === 'No')}No (provide reason) ${fld(r.owner_not_contacted_reason, 190)}</div>
  <div class="row">Action Taken (to include dates and times): <div style="border-bottom:1px solid #000;min-height:70px;font-weight:bold;white-space:pre-wrap;margin-top:4px">${esc(r.action_taken)}</div></div>
  <div class="row">Charge(s) Preferred: ${fld(r.charges_preferred, 560)}</div>
  <div class="row">Citation Number (if applicable) ${fld(r.citation_number, 270)} Court Date: ${fld(dt(r.court_date), 110)}</div>
  <div class="row">Returned:</div>
  <div class="wit" style="margin-top:0"><div>${esc(dt(r.returned_date))}</div><div></div><div>${esc(r.call_no)}</div></div>
  <div class="lbl"><div>(Date)</div><div>(Signature)</div><div>(Call No.)</div></div>
  <div class="note">NOTE: Prepared in duplicate. Original delivered to Trooper, duplicate retained in District File. When assignment is completed, the original is returned to the District First Sergeant for filing for one year. Duplicate may then be destroyed.</div>
  </body></html>`;
  printHtml(html);
}