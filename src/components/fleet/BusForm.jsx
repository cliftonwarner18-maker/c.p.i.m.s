import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { Save, X } from 'lucide-react';

export default function BusForm({ bus, onClose, onSaved }) {
  const [form, setForm] = useState({
    bus_number: '', bus_type: 'School Bus', base_location: 'Main', year: '', make: '', model: '',
    vin: '', engine: '', passenger_capacity: '', wheelchair_accessible: false,
    asset_number: '', camera_system_type: 'None', camera_serial_number: '',
    camera_model_number: '', samsara_enabled: false, samsara_av_enabled: false,
    samsara_inputs_enabled: false, dash_cam_sid: '', gateway_sid: '',
    next_inspection_due: '', status: 'Active', notes: '',
  });

  useEffect(() => {
    if (bus) {
      setForm({
        bus_number: bus.bus_number || '',
        bus_type: bus.bus_type || 'School Bus',
        base_location: bus.base_location || 'Main',
        year: bus.year || '',
        make: bus.make || '',
        model: bus.model || '',
        vin: bus.vin || '',
        engine: bus.engine || '',
        passenger_capacity: bus.passenger_capacity || '',
        wheelchair_accessible: bus.wheelchair_accessible || false,
        asset_number: bus.asset_number || '',
        camera_system_type: bus.camera_system_type || 'None',
        camera_serial_number: bus.camera_serial_number || '',
        camera_model_number: bus.camera_model_number || '',
        samsara_enabled: bus.samsara_enabled || false,
        samsara_av_enabled: bus.samsara_av_enabled || false,
        samsara_inputs_enabled: bus.samsara_inputs_enabled || false,
        dash_cam_sid: bus.dash_cam_sid || '',
        gateway_sid: bus.gateway_sid || '',
        next_inspection_due: bus.next_inspection_due || '',
        status: bus.status || 'Active',
        notes: bus.notes || '',
      });
    }
  }, [bus]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Bus.create(data),
    onSuccess: onSaved,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Bus.update(bus.id, data),
    onSuccess: onSaved,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, passenger_capacity: form.passenger_capacity ? Number(form.passenger_capacity) : null };
    if (bus) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const Field = ({ label, children }) => (
    <div>
      <label className="text-[10px] font-bold block mb-0.5">{label}</label>
      {children}
    </div>
  );

  const Check = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-primary" />
      {label}
    </label>
  );

  return (
    <WinWindow title={bus ? `EDIT VEHICLE — BUS #${bus.bus_number}` : 'ADD NEW VEHICLE'} icon="🚌">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Vehicle Info */}
        <div className="win-panel p-2">
          <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">▸ VEHICLE INFORMATION</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="BUS # *">
              <input className="win-input w-full text-[11px]" value={form.bus_number} onChange={e => setForm({...form, bus_number: e.target.value})} required />
            </Field>
            <Field label="BUS TYPE *">
              <select className="win-input w-full text-[11px]" value={form.bus_type} onChange={e => setForm({...form, bus_type: e.target.value})} required>
                <option value="School Bus">School Bus</option>
                <option value="Activity Bus">Activity Bus</option>
              </select>
            </Field>
            <Field label="YEAR">
              <input className="win-input w-full text-[11px]" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
            </Field>
            <Field label="MAKE">
              <input className="win-input w-full text-[11px]" value={form.make} onChange={e => setForm({...form, make: e.target.value})} />
            </Field>
            <Field label="MODEL">
              <input className="win-input w-full text-[11px]" value={form.model} onChange={e => setForm({...form, model: e.target.value})} />
            </Field>
            <Field label="VIN">
              <input className="win-input w-full text-[11px]" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} />
            </Field>
            <Field label="ENGINE">
              <input className="win-input w-full text-[11px]" value={form.engine} onChange={e => setForm({...form, engine: e.target.value})} />
            </Field>
            <Field label="CAPACITY">
              <input type="number" className="win-input w-full text-[11px]" value={form.passenger_capacity} onChange={e => setForm({...form, passenger_capacity: e.target.value})} />
            </Field>
            <Field label="BASE LOCATION">
              <select className="win-input w-full text-[11px]" value={form.base_location} onChange={e => setForm({...form, base_location: e.target.value})}>
                <option value="Main">Main</option>
                <option value="North">North</option>
                <option value="Central">Central</option>
                <option value="Sold">Sold</option>
              </select>
            </Field>
            <Field label="STATUS">
              <select className="win-input w-full text-[11px]" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Active">Active</option>
                <option value="Out of Service">Out of Service</option>
                <option value="Retired">Retired</option>
              </select>
            </Field>
            <Field label="INSP. DUE">
              <input type="date" className="win-input w-full text-[11px]" value={form.next_inspection_due} onChange={e => setForm({...form, next_inspection_due: e.target.value})} />
            </Field>
            <div className="flex items-end">
              <Check label="WHEELCHAIR" checked={form.wheelchair_accessible} onChange={e => setForm({...form, wheelchair_accessible: e.target.checked})} />
            </div>
          </div>
        </div>

        {/* Camera System */}
        <div className="win-panel p-2">
          <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">▸ CAMERA SYSTEM</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="CAMERA SYSTEM">
              <select className="win-input w-full text-[11px]" value={form.camera_system_type} onChange={e => setForm({...form, camera_system_type: e.target.value})}>
                <option value="Seon">Seon</option>
                <option value="Safety Vision">Safety Vision</option>
                <option value="None">None</option>
              </select>
            </Field>
            <Field label="SERIAL #">
              <input className="win-input w-full text-[11px]" value={form.camera_serial_number} onChange={e => setForm({...form, camera_serial_number: e.target.value})} />
            </Field>
            <Field label="MODEL #">
              <input className="win-input w-full text-[11px]" value={form.camera_model_number} onChange={e => setForm({...form, camera_model_number: e.target.value})} />
            </Field>
          </div>
        </div>

        {/* AI Camera / Samsara */}
        <div className="win-panel p-2">
          <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">▸ AI CAMERA SYSTEM (SAMSARA)</div>
          <div className="flex flex-wrap gap-4 mb-2">
            <Check label="Samsara" checked={form.samsara_enabled} onChange={e => setForm({...form, samsara_enabled: e.target.checked})} />
            <Check label="Sam AV" checked={form.samsara_av_enabled} onChange={e => setForm({...form, samsara_av_enabled: e.target.checked})} />
            <Check label="Sam Inputs" checked={form.samsara_inputs_enabled} onChange={e => setForm({...form, samsara_inputs_enabled: e.target.checked})} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="DASH CAM SID#">
              <input className="win-input w-full text-[11px]" value={form.dash_cam_sid} onChange={e => setForm({...form, dash_cam_sid: e.target.value})} />
            </Field>
            <Field label="GATEWAY SID#">
              <input className="win-input w-full text-[11px]" value={form.gateway_sid} onChange={e => setForm({...form, gateway_sid: e.target.value})} />
            </Field>
          </div>
        </div>

        {/* Notes */}
        <div className="win-panel p-2">
          <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">▸ NOTES</div>
          <textarea className="win-input w-full text-[11px] h-16 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </div>

        <div className="flex gap-2">
          <button type="submit" className="win-button flex items-center gap-1 !bg-primary !text-primary-foreground" disabled={isPending}>
            <Save className="w-3 h-3" /> {isPending ? 'SAVING...' : 'SAVE VEHICLE'}
          </button>
          <button type="button" className="win-button flex items-center gap-1" onClick={onClose}>
            <X className="w-3 h-3" /> CANCEL
          </button>
        </div>
      </form>
    </WinWindow>
  );
}