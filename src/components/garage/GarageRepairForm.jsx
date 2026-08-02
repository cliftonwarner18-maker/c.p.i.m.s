import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const FF = "'Courier Prime', monospace";
const inp = { width: '100%', padding: '5px 8px', fontSize: '12px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', boxSizing: 'border-box' };
const lbl = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' };

const STATUSES = ['Open', 'In Progress', 'Completed', 'Cancelled'];
const STATUS_COLORS = {
  'Open': 'hsl(45,90%,45%)',
  'In Progress': 'hsl(210,70%,50%)',
  'Completed': 'hsl(140,60%,40%)',
  'Cancelled': 'hsl(0,60%,48%)',
};

function calcMinutes(start, end) {
  if (!start || !end) return null;
  const diff = (new Date(end) - new Date(start)) / 60000;
  return diff > 0 ? Math.round(diff) : null;
}

export default function GarageRepairForm({ repair, buses = [], onClose, onSaved }) {
  const queryClient = useQueryClient();
  const isNew = !repair?.id;

  const [form, setForm] = useState({
    bus_number: '',
    mechanic: '',
    model: '',
    date_parked: new Date().toISOString().slice(0, 10),
    reason_for_parking: '',
    bus_location: 'Main',
    estimated_repair_date: '',
    actual_repair_date: '',
    repair_status: 'Open',
    repairs_rendered: '',
    reason_not_completed: '',
    start_time: '',
    end_time: '',
    elapsed_minutes: null,
    return_to_service: false,
    notes: '',
  });

  useEffect(() => {
    if (repair) setForm({ ...form, ...repair });
  }, [repair?.id]);

  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    if (k === 'start_time' || k === 'end_time') {
      const mins = calcMinutes(k === 'start_time' ? v : f.start_time, k === 'end_time' ? v : f.end_time);
      next.elapsed_minutes = mins;
    }
    return next;
  });

  const saveMut = useMutation({
    mutationFn: async (data) => {
      // If marking return to service, update the bus whiteboard status too
      if (data.return_to_service && !repair?.return_to_service) {
        const matchBus = buses.find(b => b.bus_number === data.bus_number);
        if (matchBus) {
          await base44.entities.Bus.update(matchBus.id, { board_status: 'Available' });
        }
      }
      if (isNew) return base44.entities.GarageRepair.create(data);
      return base44.entities.GarageRepair.update(repair.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage_repairs'] });
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      onSaved?.();
      onClose?.();
    },
  });

  const handleSubmit = () => {
    if (!form.bus_number || !form.date_parked || !form.reason_for_parking) return;
    saveMut.mutate(form);
  };

  const fmtMins = (m) => {
    if (!m) return '';
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  return (
    <div style={{ fontFamily: FF, background: 'white' }}>
      {/* Title bar */}
      <div style={{ background: 'linear-gradient(to right, hsl(30,70%,35%), hsl(30,65%,48%))', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🔧 {isNew ? 'ADD GARAGE REPAIR' : `REPAIR — BUS #${repair.bus_number}`}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '80vh', overflowY: 'auto' }}>

        {/* Status badge */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => set('repair_status', s)} style={{
              padding: '4px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '2px solid', borderRadius: '2px', cursor: 'pointer', letterSpacing: '0.06em',
              background: form.repair_status === s ? STATUS_COLORS[s] : 'white',
              color: form.repair_status === s ? 'white' : 'hsl(220,20%,35%)',
              borderColor: form.repair_status === s ? STATUS_COLORS[s] : 'hsl(220,18%,70%)',
            }}>{s.toUpperCase()}</button>
          ))}
        </div>

        {/* Bus info row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={lbl}>BUS #*</label>
            {isNew && buses.length > 0 ? (
              <select value={form.bus_number} onChange={e => { set('bus_number', e.target.value); const b = buses.find(x => x.bus_number === e.target.value); if (b) set('model', b.model || b.make || ''); }} style={inp}>
                <option value="">-- Select --</option>
                {buses.map(b => <option key={b.id} value={b.bus_number}>Bus #{b.bus_number}</option>)}
              </select>
            ) : (
              <input value={form.bus_number} onChange={e => set('bus_number', e.target.value)} style={inp} placeholder="e.g. 410" />
            )}
          </div>
          <div>
            <label style={lbl}>MECHANIC</label>
            <input value={form.mechanic} onChange={e => set('mechanic', e.target.value)} style={inp} placeholder="Initials / Name" />
          </div>
          <div>
            <label style={lbl}>MODEL</label>
            <input value={form.model} onChange={e => set('model', e.target.value)} style={inp} placeholder="IC, C2, GMC..." />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={lbl}>DATE PARKED*</label>
            <input type="date" value={form.date_parked} onChange={e => set('date_parked', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>LOCATION</label>
            <select value={form.bus_location} onChange={e => set('bus_location', e.target.value)} style={inp}>
              {['Main', 'North', 'Central', 'Other'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={lbl}>REASON FOR PARKING / INITIAL COMPLAINT*</label>
          <textarea value={form.reason_for_parking} onChange={e => set('reason_for_parking', e.target.value)} style={{ ...inp, minHeight: '60px', resize: 'vertical' }} placeholder="Describe the issue..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label style={lbl}>EST. REPAIR DATE</label>
            <input type="date" value={form.estimated_repair_date} onChange={e => set('estimated_repair_date', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>ACTUAL REPAIR DATE</label>
            <input type="date" value={form.actual_repair_date} onChange={e => set('actual_repair_date', e.target.value)} style={inp} />
          </div>
        </div>

        {/* Time tracking */}
        <div style={{ background: 'hsl(210,50%,97%)', border: '1px solid hsl(210,40%,82%)', borderRadius: '2px', padding: '8px 10px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(210,60%,35%)', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock style={{ width: 10, height: 10 }} /> MECHANIC TIME TRACKING</span>
            <span style={{ color: 'hsl(220,20%,30%)' }}>MECHANIC: <span style={{ color: 'hsl(210,60%,35%)' }}>{form.mechanic || '— NOT SET —'}</span></span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={lbl}>START TIME</label>
              <input type="datetime-local" value={form.start_time ? form.start_time.slice(0, 16) : ''} onChange={e => set('start_time', e.target.value ? new Date(e.target.value).toISOString() : '')} style={inp} />
            </div>
            <div>
              <label style={lbl}>END TIME</label>
              <input type="datetime-local" value={form.end_time ? form.end_time.slice(0, 16) : ''} onChange={e => set('end_time', e.target.value ? new Date(e.target.value).toISOString() : '')} style={inp} />
            </div>
            <div>
              <label style={lbl}>ELAPSED</label>
              <div style={{ ...inp, background: 'hsl(220,15%,96%)', color: 'hsl(210,60%,35%)', fontWeight: '700' }}>
                {form.elapsed_minutes ? fmtMins(form.elapsed_minutes) : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Repairs rendered */}
        <div>
          <label style={lbl}>REPAIRS RENDERED / REMEDY</label>
          <textarea value={form.repairs_rendered} onChange={e => set('repairs_rendered', e.target.value)} style={{ ...inp, minHeight: '70px', resize: 'vertical' }} placeholder="Describe all repairs performed..." />
        </div>

        <div>
          <label style={lbl}>REASON NOT COMPLETED / PENDING NOTES</label>
          <textarea value={form.reason_not_completed} onChange={e => set('reason_not_completed', e.target.value)} style={{ ...inp, minHeight: '50px', resize: 'vertical' }} placeholder="Parts on order, waiting for vendor, etc." />
        </div>

        <div>
          <label style={lbl}>ADDITIONAL NOTES</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inp, minHeight: '40px', resize: 'vertical' }} />
        </div>

        {/* Return to service toggle */}
        <div style={{ background: form.return_to_service ? 'hsl(140,60%,96%)' : 'hsl(0,0%,97%)', border: `2px solid ${form.return_to_service ? 'hsl(140,60%,45%)' : 'hsl(220,18%,78%)'}`, borderRadius: '2px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => set('return_to_service', !form.return_to_service)}>
          <div style={{ width: '18px', height: '18px', border: `2px solid ${form.return_to_service ? 'hsl(140,60%,45%)' : 'hsl(220,18%,65%)'}`, borderRadius: '2px', background: form.return_to_service ? 'hsl(140,60%,45%)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {form.return_to_service && <CheckCircle style={{ width: 14, height: 14, color: 'white' }} />}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: form.return_to_service ? 'hsl(140,60%,35%)' : 'hsl(220,20%,30%)', letterSpacing: '0.06em' }}>RETURN TO SERVICE — UPDATE WHITEBOARD TO AVAILABLE</div>
            <div style={{ fontSize: '10px', color: 'hsl(220,10%,50%)' }}>Checking this will automatically set Bus #{form.bus_number || '??'} status to AVAILABLE on the White Board.</div>
          </div>
        </div>

        {saveMut.isError && (
          <div style={{ background: 'hsl(0,80%,97%)', border: '1px solid hsl(0,60%,70%)', borderRadius: '2px', padding: '6px 10px', fontSize: '11px', color: 'hsl(0,65%,40%)' }}>
            <AlertTriangle style={{ width: 12, height: 12, display: 'inline', marginRight: '4px' }} />
            Error saving. Please try again.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button onClick={handleSubmit} disabled={saveMut.isPending || !form.bus_number || !form.reason_for_parking} style={{ flex: 1, padding: '8px', fontSize: '12px', fontFamily: FF, fontWeight: '700', background: 'hsl(30,65%,42%)', color: 'white', border: '1px solid hsl(30,65%,30%)', borderRadius: '2px', cursor: 'pointer', opacity: saveMut.isPending ? 0.7 : 1, letterSpacing: '0.06em' }}>
            {saveMut.isPending ? 'SAVING...' : isNew ? 'ADD TO GARAGE BOARD' : 'SAVE CHANGES'}
          </button>
          <button onClick={onClose} style={{ padding: '8px 16px', fontSize: '11px', fontFamily: FF, background: 'hsl(220,18%,90%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', cursor: 'pointer' }}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}