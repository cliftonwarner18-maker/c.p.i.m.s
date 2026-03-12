import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Save } from 'lucide-react';
import moment from 'moment';

const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', width: '100%', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px', letterSpacing: '0.05em', color: 'hsl(220,20%,30%)' };
const sectionHeader = { background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '5px 10px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '8px' };

const Check = ({ label, field, form, setForm }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderBottom: '1px solid hsl(220,18%,88%)', background: form[field] ? '#f0fdf4' : '#fef9f9', cursor: 'pointer' }}>
    <input type="checkbox" checked={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.checked })} style={{ width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }} />
    <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', fontFamily: "'Courier Prime', monospace" }}>{label}</span>
    <span style={{ fontSize: '11px', fontWeight: '700', color: form[field] ? '#166534' : '#991b1b', fontFamily: "'Courier Prime', monospace" }}>{form[field] ? '[PASS]' : '[FAIL]'}</span>
  </div>
);

export default function EditInspectionForm({ inspection, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });

  const [form, setForm] = useState({
    bus_number: inspection.bus_number || '',
    inspector_name: inspection.inspector_name || '',
    inspection_start_time: inspection.inspection_start_time || '',
    inspection_end_time: inspection.inspection_end_time || '',
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
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      onSaved();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const elapsed = form.inspection_start_time && form.inspection_end_time
      ? Math.round((new Date(form.inspection_end_time) - new Date(form.inspection_start_time)) / 60000)
      : 0;
    updateMutation.mutate({ ...form, elapsed_minutes: elapsed });
    if (form.next_inspection_due && form.bus_number) {
      const bus = buses.find(b => b.bus_number === form.bus_number);
      if (bus) base44.entities.Bus.update(bus.id, { next_inspection_due: form.next_inspection_due });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '8px', overflowY: 'auto' }}>
      <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,65%)', borderRadius: '2px', width: '100%', maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', fontFamily: "'Courier Prime', monospace" }}>
        {/* Title bar */}
        <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' }}>
          <span>✏️ EDIT INSPECTION — {inspection.inspection_number}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2px', color: 'white', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>

        <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleSubmit}>
            {/* Details */}
            <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px', marginBottom: '8px' }}>
              <div style={sectionHeader}>▸ INSPECTION DETAILS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>BUS # *</label>
                  <input style={inputStyle} value={form.bus_number} onChange={e => setForm({ ...form, bus_number: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>INSPECTOR *</label>
                  <input style={inputStyle} value={form.inspector_name} onChange={e => setForm({ ...form, inspector_name: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>START TIME</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="datetime-local" style={{ ...inputStyle, flex: 1 }} value={form.inspection_start_time} onChange={e => setForm({ ...form, inspection_start_time: e.target.value })} />
                    <button type="button" onClick={() => setForm({ ...form, inspection_start_time: new Date().toISOString().slice(0, 16) })} style={{ padding: '5px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>NOW</button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>END TIME</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="datetime-local" style={{ ...inputStyle, flex: 1 }} value={form.inspection_end_time} onChange={e => setForm({ ...form, inspection_end_time: e.target.value })} />
                    <button type="button" onClick={() => setForm({ ...form, inspection_end_time: new Date().toISOString().slice(0, 16) })} style={{ padding: '5px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>NOW</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px', marginBottom: '8px' }}>
              <div style={sectionHeader}>▸ CHECKLIST</div>
              <div style={{ border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                <Check label="CAMERA SYSTEM FUNCTIONAL" field="camera_system_functional" form={form} setForm={setForm} />
                <Check label="MOUNTING SECURE" field="mounting_secure" form={form} setForm={setForm} />
                <Check label="DVR SYSTEM FUNCTIONAL" field="dvr_functional" form={form} setForm={setForm} />
                <Check label="DATE/TIME ACCURACY" field="date_time_accuracy" form={form} setForm={setForm} />
                <Check label="SIGNALS & LIGHTS FUNCTIONAL" field="signals_lights_functional" form={form} setForm={setForm} />
                <Check label="PROGRAMMING VERIFIED" field="programming_verified" form={form} setForm={setForm} />
              </div>
              <div>
                <label style={labelStyle}>LENS CONDITION:</label>
                <select style={{ ...inputStyle, width: '200px' }} value={form.lenses_condition} onChange={e => setForm({ ...form, lenses_condition: e.target.value })}>
                  <option value="Pass">PASS</option>
                  <option value="Fail">FAIL</option>
                  <option value="Needs Repair">NEEDS REPAIR</option>
                </select>
              </div>
            </div>

            {/* Result */}
            <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px', marginBottom: '8px' }}>
              <div style={sectionHeader}>▸ RESULT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                <div>
                  <label style={labelStyle}>OVERALL STATUS:</label>
                  <select style={inputStyle} value={form.overall_status} onChange={e => setForm({ ...form, overall_status: e.target.value })}>
                    <option value="Pass">PASS</option>
                    <option value="Fail">FAIL</option>
                    <option value="Conditional">CONDITIONAL</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>NEXT INSPECTION DUE:</label>
                  <input type="date" style={inputStyle} value={form.next_inspection_due} onChange={e => setForm({ ...form, next_inspection_due: e.target.value })} />
                  <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                    {[{ label: '30D', days: 30 }, { label: '60D', days: 60 }, { label: '90D', days: 90 }, { label: '1YR', days: 365 }].map(({ label, days }) => (
                      <button key={label} type="button" onClick={() => setForm({ ...form, next_inspection_due: moment().add(days, 'days').format('YYYY-MM-DD') })}
                        style={{ padding: '2px 7px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", background: 'hsl(220,55%,38%)', color: 'white', border: '1px solid hsl(220,55%,30%)', borderRadius: '2px', cursor: 'pointer', fontWeight: '700' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>NOTES:</label>
                <textarea style={{ ...inputStyle, height: '64px', resize: 'vertical' }} value={form.inspection_notes} onChange={e => setForm({ ...form, inspection_notes: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" disabled={updateMutation.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '700', cursor: 'pointer' }}>
                <Save style={{ width: 13, height: 13 }} /> {updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
              <button type="button" onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", cursor: 'pointer' }}>
                CANCEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}