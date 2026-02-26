import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { Upload, X } from 'lucide-react';

// Parse a single line into a history entry
// Expected format (tab or comma separated):
// technician, description, start_time, end_time
// OR just: technician, description
function parseLine(line) {
  const parts = line.includes('\t')
    ? line.split('\t')
    : line.split(',');

  const clean = parts.map(p => p.trim());
  if (clean.length < 2 || !clean[0] || !clean[1]) return null;

  const entry = {
    technician: clean[0],
    description: clean[1],
  };

  if (clean[2]) entry.start_time = clean[2];
  if (clean[3]) entry.end_time = clean[3];

  if (entry.start_time && entry.end_time) {
    const start = new Date(entry.start_time);
    const end = new Date(entry.end_time);
    if (!isNaN(start) && !isNaN(end)) {
      entry.elapsed_minutes = Math.round((end - start) / 60000);
    }
  }

  return entry;
}

export default function BulkImportHistory({ busNumber, onClose, onSaved }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [step, setStep] = useState('input'); // 'input' | 'review' | 'done'
  const queryClient = useQueryClient();

  const bulkCreate = useMutation({
    mutationFn: (entries) =>
      base44.entities.BusHistory.bulkCreate(
        entries.map(e => ({ ...e, bus_number: busNumber }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busHistory', busNumber] });
      setStep('done');
      onSaved();
    },
  });

  const handleParse = () => {
    const lines = text.split('\n').filter(l => l.trim());
    const entries = lines.map(parseLine).filter(Boolean);
    setParsed(entries);
    setStep('review');
  };

  const handleImport = () => {
    bulkCreate.mutate(parsed);
  };

  return (
    <WinWindow title="BULK IMPORT — MANUAL HISTORY ENTRIES" icon="📂">
      <div className="space-y-2">
        {step === 'input' && (
          <>
            <div className="text-[10px] text-muted-foreground win-panel-inset p-2">
              <strong>FORMAT (one entry per line):</strong><br />
              Technician, Description, Start Time (optional), End Time (optional)<br />
              <span className="opacity-70">Example: J.Smith, Replaced DVR unit, 2026-01-15 09:00, 2026-01-15 10:30</span>
            </div>
            <textarea
              className="win-input w-full text-[11px] font-mono"
              rows={10}
              placeholder={"J.Smith, Replaced DVR unit, 2026-01-15 09:00, 2026-01-15 10:30\nT.Jones, Cleaned camera lenses"}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button className="win-button text-[11px]" onClick={onClose}>
                <X className="w-3 h-3 inline mr-1" /> CANCEL
              </button>
              <button
                className="win-button text-[11px] !bg-primary !text-primary-foreground"
                onClick={handleParse}
                disabled={!text.trim()}
              >
                PARSE ENTRIES →
              </button>
            </div>
          </>
        )}

        {step === 'review' && parsed && (
          <>
            <div className="text-[11px] font-bold text-primary mb-1">
              REVIEW: {parsed.length} entries found
            </div>
            <div className="win-panel-inset overflow-auto" style={{ maxHeight: '300px' }}>
              <table className="w-full text-[10px] font-mono">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-1 text-left">#</th>
                    <th className="p-1 text-left">TECHNICIAN</th>
                    <th className="p-1 text-left">DESCRIPTION</th>
                    <th className="p-1 text-left">START</th>
                    <th className="p-1 text-left">END</th>
                    <th className="p-1 text-left">ELAPSED</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((e, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-background'}>
                      <td className="p-1">{i + 1}</td>
                      <td className="p-1">{e.technician}</td>
                      <td className="p-1">{e.description}</td>
                      <td className="p-1">{e.start_time || '—'}</td>
                      <td className="p-1">{e.end_time || '—'}</td>
                      <td className="p-1">{e.elapsed_minutes ? `${e.elapsed_minutes}m` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="win-button text-[11px]" onClick={() => setStep('input')}>
                ← BACK
              </button>
              <button
                className="win-button text-[11px] !bg-primary !text-primary-foreground"
                onClick={handleImport}
                disabled={bulkCreate.isPending}
              >
                <Upload className="w-3 h-3 inline mr-1" />
                {bulkCreate.isPending ? 'IMPORTING...' : `IMPORT ${parsed.length} ENTRIES`}
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="text-center p-4 status-completed font-bold text-[13px]">
            ✓ {parsed?.length} ENTRIES IMPORTED SUCCESSFULLY
            <div className="mt-2">
              <button className="win-button text-[11px]" onClick={onClose}>CLOSE</button>
            </div>
          </div>
        )}
      </div>
    </WinWindow>
  );
}