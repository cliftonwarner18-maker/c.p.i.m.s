import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Clock, User, FileText, Calendar } from 'lucide-react';

export default function AddHistoryForm({ busNumber, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ technician: '', description: '', start_time: '', end_time: '' });
  const [elapsed, setElapsed] = useState(null);

  useEffect(() => {
    if (form.start_time && form.end_time) {
      const diff = Math.round((new Date(form.end_time) - new Date(form.start_time)) / 60000);
      setElapsed(diff > 0 ? diff : null);
    } else {
      setElapsed(null);
    }
  }, [form.start_time, form.end_time]);

  const formatElapsed = (mins) => {
    if (!mins || mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.BusHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busHistory', busNumber] });
      onSaved();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      bus_number: busNumber,
      technician: form.technician,
      description: form.description,
      start_time: form.start_time,
      end_time: form.end_time || null,
      elapsed_minutes: elapsed || 0,
    });
  };

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '12px',
    fontFamily: "'Courier Prime', monospace",
    border: '1px solid hsl(220,18%,72%)', borderRadius: '2px',
    background: 'white', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)',
    letterSpacing: '0.07em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '2px', border: '1px solid hsl(220,18%,70%)', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(to right, hsl(220,50%,28%), hsl(220,45%,38%))', color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.07em' }}>ADD HISTORY ENTRY</div>
            <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '1px' }}>Bus #{busNumber}</div>
          </div>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', cursor: 'pointer', color: 'white' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: "'Courier Prime', monospace" }}>
          {/* Start / End times side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={labelStyle}><Calendar style={{ width: 10, height: 10 }} /> DATE/TIME START *</div>
              <input type="datetime-local" style={inputStyle} value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
            </div>
            <div>
              <div style={labelStyle}><Calendar style={{ width: 10, height: 10 }} /> DATE/TIME END</div>
              <input type="datetime-local" style={inputStyle} value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          {/* Elapsed time display */}
          {elapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'hsl(140,55%,92%)', border: '1px solid hsl(140,55%,75%)', borderRadius: '2px' }}>
              <Clock style={{ width: 13, height: 13, color: 'hsl(140,55%,35%)' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(140,55%,30%)' }}>ELAPSED TIME: {formatElapsed(elapsed)}</span>
            </div>
          )}

          {/* Technician */}
          <div>
            <div style={labelStyle}><User style={{ width: 10, height: 10 }} /> TECHNICIAN *</div>
            <input type="text" placeholder="Technician name" style={inputStyle} value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} required />
          </div>

          {/* Description */}
          <div>
            <div style={labelStyle}><FileText style={{ width: 10, height: 10 }} /> DESCRIPTION *</div>
            <textarea placeholder="Describe work performed..." style={{ ...inputStyle, height: '90px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid hsl(220,18%,88%)' }}>
            <button type="submit" disabled={mutation.isPending} style={{ flex: 1, padding: '8px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '12px', fontWeight: '700', fontFamily: "'Courier Prime', monospace", letterSpacing: '0.05em', cursor: mutation.isPending ? 'default' : 'pointer' }}>
              {mutation.isPending ? 'SAVING...' : 'SAVE ENTRY'}
            </button>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'white', color: 'hsl(220,20%,30%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', fontSize: '12px', fontWeight: '600', fontFamily: "'Courier Prime', monospace", cursor: 'pointer' }}>
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}