import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Field, TextField, SelectField, CheckField, Section, inputCls } from './Field';
import { STATUSES, EVIDENCE_SOURCES, SCHOOL_GROUPS, COUNTIES } from './enforcementConstants';
import { printHP311 } from './printHP311';

const DIRS = ['E', 'W', 'N', 'S'];
const ALL_SCHOOLS = SCHOOL_GROUPS.flatMap((g) => g.schools);
const blank = {
  status: 'New', evidence_source: 'Stop Arm Camera', stop_arm_displayed: true,
  red_lights_activated: true, witnesses: [{ name: '', phone: '' }, { name: '', phone: '' }],
  violation_date: new Date().toISOString().slice(0, 10),
};

export default function ViolationForm({ record, onClose }) {
  const qc = useQueryClient();
  const [f, setF] = useState(record ? { ...blank, ...record, witnesses: record.witnesses?.length ? record.witnesses : blank.witnesses } : blank);
  const [error, setError] = useState('');
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const setWit = (i, k, v) => setF((p) => ({ ...p, witnesses: p.witnesses.map((w, j) => (j === i ? { ...w, [k]: v } : w)) }));

  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list() });
  const busNumbers = useMemo(() => {
    const set = new Set(buses.map((b) => b.bus_number).filter(Boolean));
    if (f.school_bus_number) set.add(f.school_bus_number);
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [buses, f.school_bus_number]);

  const save = useMutation({
    mutationFn: async () => {
      if (record?.id) {
        const { id, created_date, updated_date, created_by_id, ...data } = f;
        return base44.entities.StopArmViolation.update(record.id, data);
      }
      const total = await base44.entities.StopArmViolation.count({});
      const case_number = `SA-${new Date().getFullYear()}-${String(total + 1).padStart(4, '0')}`;
      return base44.entities.StopArmViolation.create({ ...f, case_number });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stopArmViolations'] }); onClose(); },
  });

  const submit = () => {
    if (!f.violation_date || !f.school_bus_number) { setError('Violation date and school bus number are required.'); return; }
    setError('');
    save.mutate();
  };

  return (
    <div className="space-y-2 font-mono">
      <div className="text-sm font-bold">{record ? `CASE ${record.case_number}` : 'NEW STOP ARM VIOLATION CASE'}</div>

      <Section title="Case Status">
        <SelectField label="Status" value={f.status} onChange={set('status')} options={STATUSES} />
        <SelectField label="Evidence Source" value={f.evidence_source} onChange={set('evidence_source')} options={EVIDENCE_SOURCES} />
        <TextField label="To: First Sergeant" value={f.to_sergeant} onChange={set('to_sergeant')} className="col-span-2" />
      </Section>

      <Section title="Violation">
        <TextField label="Date *" type="date" value={f.violation_date} onChange={set('violation_date')} />
        <TextField label="Time" type="time" value={f.violation_time} onChange={set('violation_time')} />
        <SelectField label="County" value={f.county} onChange={set('county')} options={COUNTIES} />
        <TextField label="On Highway / Road" value={f.highway} onChange={set('highway')} />
        <SelectField label="School Bus No. *" value={f.school_bus_number} onChange={set('school_bus_number')} options={busNumbers} />
        <Field label="From School">
          <select className={inputCls} value={f.school_name || ''} onChange={(e) => set('school_name')(e.target.value)}>
            <option value="">--</option>
            {f.school_name && !ALL_SCHOOLS.includes(f.school_name) && <option value={f.school_name}>{f.school_name}</option>}
            {SCHOOL_GROUPS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.schools.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <TextField label="Bus Driver" value={f.driver_name} onChange={set('driver_name')} />
        <TextField label="Driver Phone" value={f.driver_phone} onChange={set('driver_phone')} />
        <SelectField label="Bus Headed" value={f.bus_heading} onChange={set('bus_heading')} options={DIRS} />
        <SelectField label="Bus Stopped" value={f.stopped_activity} onChange={set('stopped_activity')} options={['Loading', 'Unloading']} />
        <div className="flex flex-col gap-1 justify-end">
          <CheckField label="Stop arm displayed" checked={f.stop_arm_displayed} onChange={set('stop_arm_displayed')} />
          <CheckField label="Red lights activated" checked={f.red_lights_activated} onChange={set('red_lights_activated')} />
        </div>
        <SelectField label="Violator Going" value={f.violator_direction} onChange={set('violator_direction')} options={DIRS} />
      </Section>

      <Section title="Violator Vehicle / Driver">
        <TextField label="Vehicle" value={f.vehicle_description} onChange={set('vehicle_description')} />
        <TextField label="Color" value={f.vehicle_color} onChange={set('vehicle_color')} />
        <TextField label="License Number" value={f.license_plate} onChange={set('license_plate')} />
        <TextField label="State" value={f.plate_state} onChange={set('plate_state')} />
        <TextField label="Driven By" value={f.violator_name} onChange={set('violator_name')} />
        <SelectField label="Sex" value={f.violator_sex} onChange={set('violator_sex')} options={['Male', 'Female']} />
        <TextField label="Race" value={f.violator_race} onChange={set('violator_race')} />
        <TextField label="Age" value={f.violator_age} onChange={set('violator_age')} />
      </Section>

      <Section title="Witnesses / Reporting">
        {f.witnesses.map((w, i) => (
          <React.Fragment key={i}>
            <TextField label={`Witness ${i + 1} Name`} value={w.name} onChange={(v) => setWit(i, 'name', v)} className="col-span-1 md:col-span-2" />
            <TextField label={`Witness ${i + 1} Phone`} value={w.phone} onChange={(v) => setWit(i, 'phone', v)} className="col-span-1 md:col-span-2" />
          </React.Fragment>
        ))}
        <TextField label="Reported By" value={f.reported_by} onChange={set('reported_by')} />
        <TextField label="Reporter Phone" value={f.reported_by_phone} onChange={set('reported_by_phone')} />
        <div className="flex flex-col gap-1 justify-end col-span-2">
          <CheckField label="Same as bus driver" checked={f.same_as_driver} onChange={set('same_as_driver')} />
          <CheckField label="Violator identifiable by witness for court" checked={f.identifiable_by_witness} onChange={set('identifiable_by_witness')} />
        </div>
      </Section>

      <Section title="Assignment / Disposition">
        <TextField label="Received By" value={f.received_by} onChange={set('received_by')} />
        <TextField label="Date Received" type="date" value={f.received_date} onChange={set('received_date')} />
        <TextField label="Assigned To" value={f.assigned_to} onChange={set('assigned_to')} />
        <TextField label="Call No." value={f.call_no} onChange={set('call_no')} />
        <TextField label="Date Assigned" type="date" value={f.assigned_date} onChange={set('assigned_date')} />
        <SelectField label="Registered Owner Contacted" value={f.owner_contacted} onChange={set('owner_contacted')} options={['Yes', 'No']} />
        {f.owner_contacted === 'No' && <TextField label="Reason Not Contacted" value={f.owner_not_contacted_reason} onChange={set('owner_not_contacted_reason')} className="col-span-2" />}
        <Field label="Action Taken (include dates and times)" className="col-span-2 md:col-span-4">
          <textarea className={inputCls} rows={3} value={f.action_taken || ''} onChange={(e) => set('action_taken')(e.target.value)} />
        </Field>
        <TextField label="Charge(s) Preferred" value={f.charges_preferred} onChange={set('charges_preferred')} className="col-span-2" />
        <TextField label="Citation Number" value={f.citation_number} onChange={set('citation_number')} />
        <TextField label="Court Date" type="date" value={f.court_date} onChange={set('court_date')} />
        <TextField label="Returned / Closed Date" type="date" value={f.returned_date} onChange={set('returned_date')} />
      </Section>

      {error && <div className="text-xs font-bold text-red-700">{error}</div>}
      {save.isError && <div className="text-xs font-bold text-red-700">Save failed. Please try again.</div>}
      <div className="flex gap-2">
        <button className="win-button" onClick={submit} disabled={save.isPending}>{save.isPending ? 'SAVING...' : 'SAVE CASE'}</button>
        <button className="win-button" onClick={() => printHP311(f)}>PRINT HP-311</button>
        <button className="win-button" onClick={onClose}>CANCEL</button>
      </div>
    </div>
  );
}