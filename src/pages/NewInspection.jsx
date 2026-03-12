import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';

const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', width: '100%', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px', letterSpacing: '0.05em', color: 'hsl(220,20%,30%)' };
const sectionHeader = { background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '5px 10px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '8px' };
const sectionBox = { background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px', marginBottom: '8px' };

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

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
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
    inspection_start_time: '',
    inspection_end_time: '',
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
      if (form.next_inspection_due && form.bus_number) {
        const bus = buses.find(b => b.bus_number === form.bus_number);
        if (bus) base44.entities.Bus.update(bus.id, { next_inspection_due: form.next_inspection_due });
      }
      navigate(`/InspectionDetail?id=${result.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const elapsed = form.inspection_start_time && form.inspection_end_time
      ? Math.round((new Date(form.inspection_end_time) - new Date(form.inspection_start_time)) / 60000)
      : 0;
    createMutation.mutate({
      ...form,
      inspection_number: generateInspNumber(),
      inspection_date: new Date().toISOString(),
      elapsed_minutes: elapsed,
    });
  };

  const CheckRow = ({ label, field }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 8px', borderBottom: '1px solid hsl(220,18%,88%)', background: form[field] ? '#f0fdf4' : '#fef9f9' }}>
      <input
        type="checkbox"
        checked={form[field]}
        onChange={(e) => setForm({ ...form, [field]: e.target.checked })}
        style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
      />
      <span style={{ flex: 1, fontSize: '11px', fontWeight: '700', fontFamily: "'Courier Prime', monospace" }}>{label}</span>
      <span style={{ fontSize: '11px', fontWeight: '700', color: form[field] ? '#166534' : '#991b1b', fontFamily: "'Courier Prime', monospace" }}>
        {form[field] ? '[PASS]' : '[FAIL]'}
      </span>
    </div>
  );

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', fontFamily: "'Courier Prime', monospace" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>NEW CAMERA SYSTEM INSPECTION</div>
        <button
          type="button"
          onClick={() => navigate('/Inspections')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", cursor: 'pointer' }}
        >
          <ArrowLeft style={{ width: 13, height: 13 }} /> BACK
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Inspection Details */}
        <div style={sectionBox}>
          <div style={sectionHeader}>▸ INSPECTION DETAILS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
            <div>
              <label style={labelStyle}>DATE/TIME (AUTO)</label>
              <div style={{ ...inputStyle, background: 'hsl(220,15%,96%)', color: 'hsl(220,10%,40%)' }}>{moment().format('MM/DD/YYYY HH:mm')}</div>
            </div>
            <div>
              <label style={labelStyle}>INSPECTION # (AUTO)</label>
              <div style={{ ...inputStyle, background: 'hsl(220,15%,96%)', color: 'hsl(220,10%,40%)' }}>{generateInspNumber()}</div>
            </div>
            <div>
              <label style={labelStyle}>BUS # *</label>
              <select style={inputStyle} value={form.bus_number} onChange={e => setForm({ ...form, bus_number: e.target.value })} required>
                <option value="">-- SELECT BUS --</option>
                {buses.map(b => (
                  <option key={b.id} value={b.bus_number}>#{b.bus_number} — {b.camera_system_type || 'No Cam'}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>INSPECTOR *</label>
              <select style={inputStyle} value={form.inspector_name} onChange={e => setForm({ ...form, inspector_name: e.target.value })} required>
                <option value="">-- SELECT INSPECTOR --</option>
                {systemUsers.filter(u => u.active !== false).map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>START TIME *</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="datetime-local" style={{ ...inputStyle, flex: 1 }} value={form.inspection_start_time} onChange={e => setForm({ ...form, inspection_start_time: e.target.value })} required />
                <button type="button" onClick={() => setForm({ ...form, inspection_start_time: new Date().toISOString().slice(0, 16) })} style={{ padding: '5px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>NOW</button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>END TIME *</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="datetime-local" style={{ ...inputStyle, flex: 1 }} value={form.inspection_end_time} onChange={e => setForm({ ...form, inspection_end_time: e.target.value })} required />
                <button type="button" onClick={() => setForm({ ...form, inspection_end_time: new Date().toISOString().slice(0, 16) })} style={{ padding: '5px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>NOW</button>
              </div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div style={sectionBox}>
          <div style={sectionHeader}>▸ SURVEILLANCE SYSTEM INSPECTION CHECKLIST</div>
          <div style={{ border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', overflow: 'hidden' }}>
            <CheckRow label="CAMERA SYSTEM FUNCTIONAL" field="camera_system_functional" />
            <CheckRow label="MOUNTING SECURE" field="mounting_secure" />
            <CheckRow label="DVR SYSTEM FUNCTIONAL" field="dvr_functional" />
            <CheckRow label="DATE/TIME ACCURACY" field="date_time_accuracy" />
            <CheckRow label="SIGNALS & LIGHTS FUNCTIONAL" field="signals_lights_functional" />
            <CheckRow label="PROGRAMMING VERIFIED" field="programming_verified" />
          </div>
          <div style={{ marginTop: '8px' }}>
            <label style={labelStyle}>LENS CONDITION:</label>
            <select style={{ ...inputStyle, width: '200px' }} value={form.lenses_condition} onChange={e => setForm({ ...form, lenses_condition: e.target.value })}>
              <option value="Pass">PASS</option>
              <option value="Fail">FAIL</option>
              <option value="Needs Repair">NEEDS REPAIR</option>
            </select>
          </div>
        </div>

        {/* Result */}
        <div style={sectionBox}>
          <div style={sectionHeader}>▸ INSPECTION RESULT</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
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
              <div style={{ display: 'flex', gap: '3px', marginTop: '4px', flexWrap: 'wrap' }}>
                {[{ label: '30D', days: 30 }, { label: '60D', days: 60 }, { label: '90D', days: 90 }, { label: '1YR', days: 365 }].map(({ label, days }) => (
                  <button key={label} type="button" onClick={() => setForm({ ...form, next_inspection_due: moment().add(days, 'days').format('YYYY-MM-DD') })}
                    style={{ padding: '2px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", background: 'hsl(220,55%,38%)', color: 'white', border: '1px solid hsl(220,55%,30%)', borderRadius: '2px', cursor: 'pointer', fontWeight: '700' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>INSPECTION NOTES:</label>
            <textarea
              style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
              value={form.inspection_notes}
              onChange={e => setForm({ ...form, inspection_notes: e.target.value })}
              placeholder="Enter inspection notes..."
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            disabled={createMutation.isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '12px', fontFamily: "'Courier Prime', monospace", fontWeight: '700', cursor: createMutation.isPending ? 'default' : 'pointer', letterSpacing: '0.05em' }}
          >
            <Send style={{ width: 14, height: 14 }} />
            {createMutation.isPending ? 'SUBMITTING...' : 'SUBMIT INSPECTION'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/Inspections')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '12px', fontFamily: "'Courier Prime', monospace", cursor: 'pointer' }}
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}