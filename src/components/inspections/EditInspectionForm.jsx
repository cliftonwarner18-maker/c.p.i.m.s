import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { X, Save } from 'lucide-react';

const Check = ({ label, field, form, setForm }) => (
  <label className="flex items-center gap-2 text-[11px] p-1 win-panel-inset cursor-pointer">
    <input
      type="checkbox"
      checked={form[field]}
      onChange={(e) => setForm({ ...form, [field]: e.target.checked })}
      className="accent-primary w-4 h-4"
    />
    <span className="font-bold">{label}</span>
    <span className={`ml-auto font-bold ${form[field] ? 'status-completed' : 'status-cancelled'}`}>
      {form[field] ? '[PASS]' : '[FAIL]'}
    </span>
  </label>
);

export default function EditInspectionForm({ inspection, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    bus_number: inspection.bus_number || '',
    inspector_name: inspection.inspector_name || '',
    camera_system_functional: inspection.camera_system_functional || false,
    lenses_condition: inspection.lenses_condition || 'Pass',
    mounting_secure: inspection.mounting_secure || false,
    dvr_functional: inspection.dvr_functional || false,
    date_time_accuracy: inspection.date_time_accuracy || false,
    signals_lights_functional: inspection.signals_lights_functional || false,
    programming_verified: inspection.programming_verified || false,
    overall_status: inspection.overall_status || 'Pass',
    inspection_notes: inspection.inspection_notes || '',
    next_inspection_due: inspection.next_inspection_due || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Inspection.update(inspection.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      onSaved();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 overflow-auto">
      <div className="win-panel w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="win-titlebar flex items-center justify-between">
          <span className="text-xs tracking-wider uppercase">✏️ EDIT INSPECTION — {inspection.inspection_number}</span>
          <button className="win-button !p-0 w-5 h-4 flex items-center justify-center" onClick={onClose}>
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="p-3 overflow-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="win-panel p-2">
              <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">▸ INSPECTION DETAILS</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold block mb-0.5">BUS # *</label>
                  <input className="win-input w-full text-[11px]" value={form.bus_number} onChange={(e) => setForm({ ...form, bus_number: e.target.value })} required />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-0.5">INSPECTOR *</label>
                  <input className="win-input w-full text-[11px]" value={form.inspector_name} onChange={(e) => setForm({ ...form, inspector_name: e.target.value })} required />
                </div>
              </div>
            </div>

            <div className="win-panel p-2">
              <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">▸ CHECKLIST</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <Check label="CAMERA SYSTEM FUNCTIONAL" field="camera_system_functional" form={form} setForm={setForm} />
                <Check label="MOUNTING SECURE" field="mounting_secure" form={form} setForm={setForm} />
                <Check label="DVR SYSTEM FUNCTIONAL" field="dvr_functional" form={form} setForm={setForm} />
                <Check label="DATE/TIME ACCURACY" field="date_time_accuracy" form={form} setForm={setForm} />
                <Check label="SIGNALS & LIGHTS FUNCTIONAL" field="signals_lights_functional" form={form} setForm={setForm} />
                <Check label="PROGRAMMING VERIFIED" field="programming_verified" form={form} setForm={setForm} />
              </div>
              <div className="mt-2">
                <label className="text-[10px] font-bold block mb-0.5">LENS CONDITION:</label>
                <select className="win-input w-full text-[11px]" value={form.lenses_condition} onChange={(e) => setForm({ ...form, lenses_condition: e.target.value })}>
                  <option value="Pass">PASS</option>
                  <option value="Fail">FAIL</option>
                  <option value="Needs Repair">NEEDS REPAIR</option>
                </select>
              </div>
            </div>

            <div className="win-panel p-2">
              <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">▸ RESULT</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold block mb-0.5">OVERALL STATUS:</label>
                  <select className="win-input w-full text-[11px]" value={form.overall_status} onChange={(e) => setForm({ ...form, overall_status: e.target.value })}>
                    <option value="Pass">PASS</option>
                    <option value="Fail">FAIL</option>
                    <option value="Conditional">CONDITIONAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-0.5">NEXT INSPECTION DUE:</label>
                  <input type="date" className="win-input w-full text-[11px]" value={form.next_inspection_due} onChange={(e) => setForm({ ...form, next_inspection_due: e.target.value })} />
                </div>
              </div>
              <div className="mt-2">
                <label className="text-[10px] font-bold block mb-0.5">NOTES:</label>
                <textarea className="win-input w-full text-[11px] h-16 resize-none" value={form.inspection_notes} onChange={(e) => setForm({ ...form, inspection_notes: e.target.value })} />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="win-button flex items-center gap-1 !bg-primary !text-primary-foreground text-[11px]" disabled={updateMutation.isPending}>
                <Save className="w-3 h-3" /> {updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
              <button type="button" className="win-button text-[11px]" onClick={onClose}>CANCEL</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}