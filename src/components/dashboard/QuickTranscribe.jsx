import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Zap, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import moment from 'moment';

// Parses a tab-separated or comma-separated line like:
// "454 M  need serial number  Safety Vision  TE  9/25/2025"
// Columns: Bus# & Lot | Issue | Camera Type | Tech | Date
function parseLine(line) {
  // Try tab split first, then comma
  let parts = line.includes('\t') ? line.split('\t') : line.split(',');
  parts = parts.map(p => p.trim());

  // Need at least bus# and issue
  if (parts.filter(Boolean).length < 2) return null;

  const busRaw = parts[0] || '';
  const issue = parts[1] || '';
  const cameraTypeRaw = (parts[2] || '').toLowerCase();
  const tech = parts[3] || '';
  const dateRaw = parts[4] || '';

  // Split bus number and lot — bus# is the leading number(s), lot is the rest
  const busMatch = busRaw.match(/^(\d+)\s*(.*)?$/);
  const busNumber = busMatch ? busMatch[1].trim() : busRaw.trim();
  const lot = busMatch ? (busMatch[2] || '').trim() : '';

  // Normalize camera type
  let cameraType = '';
  if (cameraTypeRaw.includes('seon')) cameraType = 'Seon';
  else if (cameraTypeRaw.includes('safety') || cameraTypeRaw.includes('sv')) cameraType = 'Safety Vision';

  // Parse date
  let parsedDate = null;
  if (dateRaw) {
    const d = moment(dateRaw, ['M/D/YYYY', 'MM/DD/YYYY', 'M/D/YY', 'MM/DD/YY'], true);
    if (d.isValid()) parsedDate = d.toISOString();
  }

  return { busNumber, lot, issue, cameraType, tech, dateRaw, parsedDate };
}

export default function QuickTranscribe({ onClose }) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [step, setStep] = useState('input'); // input | review | done
  const [results, setResults] = useState([]);
  const queryClient = useQueryClient();

  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const generateOrderNumber = (index = 0) => {
    const today = moment().format('YYYYMMDD');
    const base = workOrders.length + 1 + index;
    return `WO-${today}-${String(base).padStart(3, '0')}`;
  };

  const handleParse = () => {
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedLines = lines.map((line, i) => {
      const p = parseLine(line);
      if (!p) return { _raw: line, _error: true };
      return { ...p, _raw: line, _error: false, _selected: true, _index: i };
    });
    setParsed(parsedLines);
    setStep('review');
  };

  const toggleRow = (i) => {
    setParsed(prev => prev.map((r, idx) => idx === i ? { ...r, _selected: !r._selected } : r));
  };

  const handleSubmit = async () => {
    setStep('done');
    const res = [];
    let offset = 0;
    for (const row of parsed) {
      if (row._error || !row._selected) { res.push({ ...row, _status: 'skipped' }); continue; }
      const orderNumber = generateOrderNumber(offset++);
      const issueText = [
        row.issue,
        row.cameraType ? `Camera Type: ${row.cameraType}` : '',
        row.lot ? `Lot: ${row.lot}` : '',
      ].filter(Boolean).join(' | ');

      await base44.entities.WorkOrder.create({
        order_number: orderNumber,
        bus_number: row.busNumber,
        base_location: row.lot || '',
        reported_by: row.tech || 'Transcribed',
        issue_description: issueText,
        status: 'Pending',
      });
      res.push({ ...row, _status: 'created', _orderNumber: orderNumber });
    }
    setResults(res);
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2">
      <div className="win-panel w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Title bar */}
        <div className="win-titlebar flex items-center justify-between">
          <span className="text-xs tracking-wider uppercase">⚡ QUICK TRANSCRIBE — BULK WORK ORDER IMPORT</span>
          <button className="win-button !p-0 w-5 h-4 flex items-center justify-center" onClick={onClose}>
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3 overflow-auto flex-1">
          {step === 'input' && (
            <>
              <div className="text-[11px] text-muted-foreground mb-2 win-border-inset p-2 bg-card">
                <strong>FORMAT (tab or comma separated, one entry per line):</strong><br />
                Bus # &amp; Lot (e.g. 454 M or 454 N) &nbsp;|&nbsp; Issue &nbsp;|&nbsp; Camera Type (Seon / Safety Vision) &nbsp;|&nbsp; Cam Tech &nbsp;|&nbsp; Date<br />
                <span className="text-[10px] opacity-70">Example: 454 M&#9;need serial number&#9;Safety Vision&#9;TE&#9;9/25/2025</span>
              </div>
              <textarea
                className="win-input w-full text-[11px] font-mono"
                rows={10}
                placeholder={"454 M\tneed serial number\tSafety Vision\tTE\t9/25/2025\n512 N\tcamera offline\tSeon\tJD\t10/1/2025"}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button className="win-button text-[11px] flex items-center gap-1" onClick={handleParse} disabled={!rawText.trim()}>
                  <Zap className="w-3 h-3" /> PARSE ENTRIES
                </button>
                <button className="win-button text-[11px]" onClick={onClose}>CANCEL</button>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <div className="text-[11px] font-bold mb-2">REVIEW PARSED ENTRIES — uncheck to skip:</div>
              <div className="win-panel-inset overflow-auto" style={{ maxHeight: '380px' }}>
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr className="bg-primary text-primary-foreground sticky top-0">
                      <th className="p-1">✓</th>
                      <th className="p-1 text-left">BUS#</th>
                      <th className="p-1 text-left">LOT</th>
                      <th className="p-1 text-left">ISSUE</th>
                      <th className="p-1 text-left">CAM TYPE</th>
                      <th className="p-1 text-left">TECH</th>
                      <th className="p-1 text-left">DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((row, i) => (
                      <tr key={i} className={row._error ? 'bg-destructive/10' : (i % 2 === 0 ? 'bg-card' : 'bg-background')}>
                        <td className="p-1 text-center">
                          {row._error
                            ? <AlertCircle className="w-3 h-3 text-destructive inline" />
                            : <input type="checkbox" checked={row._selected} onChange={() => toggleRow(i)} />
                          }
                        </td>
                        {row._error
                          ? <td colSpan={5} className="p-1 text-destructive text-[10px]">PARSE ERROR: {row._raw}</td>
                          : <>
                            <td className="p-1 font-bold">{row.busNumber}</td>
                            <td className="p-1">{row.lot || '—'}</td>
                            <td className="p-1 max-w-[120px] truncate">{row.issue}</td>
                            <td className="p-1">{row.cameraType || '—'}</td>
                            <td className="p-1">{row.tech || '—'}</td>
                            <td className="p-1">{row.dateRaw || '—'}</td>
                          </>
                        }
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="win-button text-[11px] flex items-center gap-1 !bg-primary !text-primary-foreground" onClick={handleSubmit}>
                  <Zap className="w-3 h-3" /> CREATE {parsed.filter(r => !r._error && r._selected).length} WORK ORDERS
                </button>
                <button className="win-button text-[11px]" onClick={() => setStep('input')}>← BACK</button>
                <button className="win-button text-[11px]" onClick={onClose}>CANCEL</button>
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              <div className="text-[11px] font-bold mb-2 status-completed">IMPORT COMPLETE:</div>
              <div className="win-panel-inset overflow-auto" style={{ maxHeight: '380px' }}>
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 p-1 border-b border-border text-[11px] font-mono">
                    {r._status === 'created'
                      ? <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                      : <X className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    }
                    <span className={r._status === 'created' ? 'font-bold' : 'text-muted-foreground'}>
                      {r._status === 'created' ? `${r._orderNumber} — BUS #${r.busNumber}` : `SKIPPED: ${r._raw}`}
                    </span>
                  </div>
                ))}
              </div>
              <button className="win-button text-[11px] mt-2 flex items-center gap-1 !bg-primary !text-primary-foreground" onClick={onClose}>
                <CheckCircle2 className="w-3 h-3" /> DONE
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}