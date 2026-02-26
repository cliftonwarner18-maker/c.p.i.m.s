import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Send, ClipboardCheck } from 'lucide-react';

export default function NewInspection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list(),
  });

  const generateInspNumber = () => {
    const prefix = 'INS';
    const date = moment().format('YYMMDD');
    const seq = String(inspections.length + 1).padStart(4, '0');
    return `${prefix}-${date}-${seq}`;
  };

  const [form, setForm] = useState({
    bus_number: '',
    inspector_name: '',
    camera_system_functional: false,
    lenses_condition: 'Pass',
    mounting_secure: false,
    dvr_functional: false,
    date_time_accuracy: false,
    signals_lights_functional: false,
    programming_verified: false,
    overall_status: 'Pass',
    inspection_notes: '',
    next_inspection_due: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Inspection.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      // Update bus next inspection date
      if (form.next_inspection_due && form.bus_number) {
        const bus = buses.find(b => b.bus_number === form.bus_number);
        if (bus) {
          base44.entities.Bus.update(bus.id, { next_inspection_due: form.next_inspection_due });
        }
      }
      navigate(createPageUrl('InspectionDetail') + `?id=${result.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      inspection_number: generateInspNumber(),
      inspection_date: new Date().toISOString(),
    });
  };

  const Check = ({ label, field }) => (
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

  return (
    <div className="max-w-3xl mx-auto space-y-2">
      <WinWindow title="NEW CAMERA SYSTEM INSPECTION" icon="📋">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Header Info */}
          <div className="win-panel p-2">
            <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">
              ▸ INSPECTION DETAILS
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold block mb-0.5">DATE/TIME (AUTO)</label>
                <div className="win-input w-full bg-secondary/50 text-[11px]">
                  {moment().format('MM/DD/YYYY HH:mm')}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold block mb-0.5">INSPECTION # (AUTO)</label>
                <div className="win-input w-full bg-secondary/50 text-[11px]">
                  {generateInspNumber()}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold block mb-0.5">BUS # *</label>
                <select
                  className="win-input w-full text-[11px]"
                  value={form.bus_number}
                  onChange={(e) => setForm({ ...form, bus_number: e.target.value })}
                  required
                >
                  <option value="">-- SELECT --</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.bus_number}>#{b.bus_number} — {b.camera_system_type || 'No Cam'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold block mb-0.5">INSPECTOR *</label>
                <input
                  className="win-input w-full text-[11px]"
                  value={form.inspector_name}
                  onChange={(e) => setForm({ ...form, inspector_name: e.target.value })}
                  placeholder="Inspector name..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Inspection Checklist */}
          <div className="win-panel p-2">
            <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">
              ▸ SURVEILLANCE SYSTEM INSPECTION CHECKLIST
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <Check label="CAMERA SYSTEM FUNCTIONAL" field="camera_system_functional" />
              <Check label="MOUNTING SECURE" field="mounting_secure" />
              <Check label="DVR SYSTEM FUNCTIONAL" field="dvr_functional" />
              <Check label="DATE/TIME ACCURACY" field="date_time_accuracy" />
              <Check label="SIGNALS & LIGHTS FUNCTIONAL" field="signals_lights_functional" />
              <Check label="PROGRAMMING VERIFIED" field="programming_verified" />
            </div>
            <div className="mt-2">
              <label className="text-[10px] font-bold block mb-0.5">LENS CONDITION:</label>
              <select
                className="win-input w-full text-[11px]"
                value={form.lenses_condition}
                onChange={(e) => setForm({ ...form, lenses_condition: e.target.value })}
              >
                <option value="Pass">PASS</option>
                <option value="Fail">FAIL</option>
                <option value="Needs Repair">NEEDS REPAIR</option>
              </select>
            </div>
          </div>

          {/* Result */}
          <div className="win-panel p-2">
            <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">
              ▸ INSPECTION RESULT
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold block mb-0.5">OVERALL STATUS:</label>
                <select
                  className="win-input w-full text-[11px]"
                  value={form.overall_status}
                  onChange={(e) => setForm({ ...form, overall_status: e.target.value })}
                >
                  <option value="Pass">PASS</option>
                  <option value="Fail">FAIL</option>
                  <option value="Conditional">CONDITIONAL</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold block mb-0.5">NEXT INSPECTION DUE:</label>
                <input
                  type="date"
                  className="win-input w-full text-[11px]"
                  value={form.next_inspection_due}
                  onChange={(e) => setForm({ ...form, next_inspection_due: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-[10px] font-bold block mb-0.5">INSPECTION NOTES:</label>
              <textarea
                className="win-input w-full text-[11px] h-20 resize-none"
                value={form.inspection_notes}
                onChange={(e) => setForm({ ...form, inspection_notes: e.target.value })}
                placeholder="Enter inspection notes..."
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="win-button flex items-center gap-1 !bg-primary !text-primary-foreground" disabled={createMutation.isPending}>
              <Send className="w-3 h-3" /> {createMutation.isPending ? 'SUBMITTING...' : 'SUBMIT INSPECTION'}
            </button>
            <button type="button" className="win-button" onClick={() => navigate(createPageUrl('Inspections'))}>
              CANCEL
            </button>
          </div>
        </form>
      </WinWindow>
    </div>
  );
}