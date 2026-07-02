import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import TechnicianMultiSelect from '@/components/TechnicianMultiSelect';

const S = {
  label: { fontSize: '9px', fontWeight: '700', letterSpacing: '0.07em', color: 'hsl(220,10%,50%)', textTransform: 'uppercase', marginBottom: '2px' },
  input: { width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' },
};

const calcElapsed = (start, end) => {
  if (!start || !end) return null;
  const diff = Math.round((new Date(end) - new Date(start)) / 60000);
  return diff > 0 ? diff : null;
};

export default function LabHoursForm({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ technicians: [], description: '', start_time: '', end_time: '' });

  const addHistoryMutation = useMutation({
    mutationFn: (data) => base44.entities.BusHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busHistory'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    const elapsed = calcElapsed(form.start_time, form.end_time);
    addHistoryMutation.mutate({
      bus_number: 'LAB HOURS',
      technician: form.technicians[0] || '',
      technicians: form.technicians,
      description: form.description,
      start_time: form.start_time,
      end_time: form.end_time,
      elapsed_time_minutes: elapsed,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.06em', color: 'hsl(220,20%,20%)' }}>
        NEW LAB / FIELD HOURS ENTRY
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={S.label}>TECHNICIANS * (ALL SELECTED GET FULL CREDIT HOURS)</div>
          <TechnicianMultiSelect value={form.technicians} onChange={v => setForm(f => ({ ...f, technicians: v }))} />
        </div>
        <div>
          <div style={S.label}>START TIME</div>
          <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={S.input} />
        </div>
        <div>
          <div style={S.label}>END TIME</div>
          <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={S.input} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={S.label}>DESCRIPTION *</div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Work performed..." rows={3} style={{ ...S.input, resize: 'vertical' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={handleSubmit} disabled={form.technicians.length === 0 || !form.description} style={{ padding: '6px 14px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: 'pointer' }}>
          SAVE ENTRY
        </button>
        <button onClick={onClose} style={{ padding: '6px 14px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,25%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", cursor: 'pointer' }}>
          CANCEL
        </button>
      </div>
    </div>
  );
}