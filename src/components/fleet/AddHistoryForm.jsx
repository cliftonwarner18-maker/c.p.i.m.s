import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { X } from 'lucide-react';

export default function AddHistoryForm({ busNumber, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    technician: '',
    description: '',
    start_time: '',
    end_time: '',
  });
  const [elapsed, setElapsed] = useState(null);

  useEffect(() => {
    if (form.start_time && form.end_time) {
      const start = new Date(form.start_time);
      const end = new Date(form.end_time);
      const diff = Math.round((end - start) / 60000);
      setElapsed(diff > 0 ? diff : null);
    } else {
      setElapsed(null);
    }
  }, [form.start_time, form.end_time]);

  const formatElapsed = (mins) => {
    if (!mins || mins <= 0) return 'N/A';
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

  const Field = ({ label, children }) => (
    <div className="flex flex-col gap-0.5 mb-2">
      <label className="text-[10px] font-bold">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div style={{ minWidth: 380, maxWidth: 480 }}>
        <WinWindow title={`ADD HISTORY — BUS #${busNumber}`} icon="📝">
          <form onSubmit={handleSubmit} className="space-y-1">
            <Field label="DATE/TIME START *">
              <input
                type="datetime-local"
                className="win-input text-[11px] w-full"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </Field>
            <Field label="TECHNICIAN *">
              <input
                type="text"
                className="win-input text-[11px] w-full"
                value={form.technician}
                onChange={e => setForm({ ...form, technician: e.target.value })}
                required
                placeholder="Technician name"
              />
            </Field>
            <Field label="DESCRIPTION *">
              <textarea
                className="win-input text-[11px] w-full h-20"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
                placeholder="Describe work performed..."
              />
            </Field>
            <Field label="DATE/TIME END">
              <input
                type="datetime-local"
                className="win-input text-[11px] w-full"
                value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
              />
            </Field>
            <div className="win-border-inset px-3 py-1 text-[11px] font-bold flex justify-between bg-card">
              <span>TOTAL ELAPSED TIME:</span>
              <span className={elapsed && elapsed > 0 ? 'status-completed' : 'text-muted-foreground'}>
                {elapsed && elapsed > 0 ? formatElapsed(elapsed) : '—'}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="win-button flex-1 text-[11px] !bg-primary !text-primary-foreground"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'SAVING...' : 'SAVE ENTRY'}
              </button>
              <button type="button" className="win-button text-[11px] flex items-center gap-1" onClick={onClose}>
                <X className="w-3 h-3" /> CANCEL
              </button>
            </div>
          </form>
        </WinWindow>
      </div>
    </div>
  );
}