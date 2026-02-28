import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";
const inputStyle = { width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', fontSize: '11px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };

function parseLine(line) {
  let parts = line.includes('\t') ? line.split('\t') : line.split(',');
  parts = parts.map(p => p.trim());
  if (parts.filter(Boolean).length < 2) return null;
  const busRaw = parts[0] || '';
  const issue = parts[1] || '';
  const cameraTypeRaw = (parts[2] || '').toLowerCase();
  const tech = parts[3] || '';
  const dateRaw = parts[4] || '';
  const busMatch = busRaw.match(/^(\d+)\s*(.*)?$/);
  const busNumber = busMatch ? busMatch[1].trim() : busRaw.trim();
  const lot = busMatch ? (busMatch[2] || '').trim() : '';
  let cameraType = '';
  if (cameraTypeRaw.includes('seon')) cameraType = 'Seon';
  else if (cameraTypeRaw.includes('safety') || cameraTypeRaw.includes('sv')) cameraType = 'Safety Vision';
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
  const [step, setStep] = useState('input');
  const [results, setResults] = useState([]);
  const queryClient = useQueryClient();

  const { data: workOrders = [] } = useQuery({ queryKey: ['workOrders'], queryFn: () => base44.entities.WorkOrder.list('-created_date') });

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

  const toggleRow = (i) => setParsed(prev => prev.map((r, idx) => idx === i ? { ...r, _selected: !r._selected } : r));

  const handleSubmit = async () => {
    setStep('done');
    const res = [];
    let offset = 0;
    for (const row of parsed) {
      if (row._error || !row._selected) { res.push({ ...row, _status: 'skipped' }); continue; }
      const orderNumber = generateOrderNumber(offset++);
      const issueText = [row.issue, row.cameraType ? `Camera Type: ${row.cameraType}` : '', row.lot ? `Lot: ${row.lot}` : ''].filter(Boolean).join(' | ');
      await base44.entities.WorkOrder.create({ order_number: orderNumber, bus_number: row.busNumber, base_location: row.lot || '', reported_by: row.tech || 'Transcribed', issue_description: issueText, status: 'Pending' });
      res.push({ ...row, _status: 'created', _orderNumber: orderNumber });
    }
    setResults(res);
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '8px' }}>
      <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,65%)', borderRadius: '2px', width: '100%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', fontFamily: FF }}>
        <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' }}>
          <span>⚡ QUICK TRANSCRIBE — BULK WORK ORDER IMPORT</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2px', color: 'white', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>

        <div style={{ padding: '12px', overflowY: 'auto', flex: 1 }}>
          {step === 'input' && (
            <>
              <div style={{ background: 'hsl(220,20%,97%)', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', padding: '8px', fontSize: '11px', color: 'hsl(220,10%,40%)', marginBottom: '8px', fontFamily: FF }}>
                <strong>FORMAT (tab or comma separated, one entry per line):</strong><br />
                Bus # & Lot | Issue | Camera Type (Seon / Safety Vision) | Cam Tech | Date<br />
                <span style={{ fontSize: '10px', opacity: 0.7 }}>Example: 454 M&nbsp;&nbsp;need serial number&nbsp;&nbsp;Safety Vision&nbsp;&nbsp;TE&nbsp;&nbsp;9/25/2025</span>
              </div>
              <textarea rows={10} value={rawText} onChange={e => setRawText(e.target.value)}
                placeholder={"454 M\tneed serial number\tSafety Vision\tTE\t9/25/2025\n512 N\tcamera offline\tSeon\tJD\t10/1/2025"}
                style={{ ...inputStyle, height: 200, resize: 'vertical', display: 'block', marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={handleParse} disabled={!rawText.trim()} style={{ ...btnBase, background: 'hsl(220,55%,38%)', color: 'white', borderColor: 'hsl(220,55%,30%)' }}>
                  <Zap style={{ width: 13, height: 13 }} /> PARSE ENTRIES
                </button>
                <button onClick={onClose} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>CANCEL</button>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '8px', fontFamily: FF }}>REVIEW PARSED ENTRIES — uncheck to skip:</div>
              <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', marginBottom: '8px' }}>
                <table style={{ width: '100%', fontSize: '10px', fontFamily: FF, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0 }}>
                      {['✓', 'BUS#', 'LOT', 'ISSUE', 'CAM TYPE', 'TECH', 'DATE'].map(h => (
                        <th key={h} style={{ padding: '5px 6px', textAlign: 'left', fontSize: '10px', fontWeight: '700' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((row, i) => (
                      <tr key={i} style={{ background: row._error ? 'hsl(0,70%,95%)' : i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          {row._error ? <AlertCircle style={{ width: 12, height: 12, color: 'hsl(0,65%,45%)' }} /> : <input type="checkbox" checked={row._selected} onChange={() => toggleRow(i)} />}
                        </td>
                        {row._error
                          ? <td colSpan={5} style={{ padding: '4px 6px', color: 'hsl(0,65%,40%)', fontSize: '10px' }}>PARSE ERROR: {row._raw}</td>
                          : <>
                            <td style={{ padding: '4px 6px', fontWeight: '700' }}>{row.busNumber}</td>
                            <td style={{ padding: '4px 6px' }}>{row.lot || '—'}</td>
                            <td style={{ padding: '4px 6px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.issue}</td>
                            <td style={{ padding: '4px 6px' }}>{row.cameraType || '—'}</td>
                            <td style={{ padding: '4px 6px' }}>{row.tech || '—'}</td>
                            <td style={{ padding: '4px 6px' }}>{row.dateRaw || '—'}</td>
                          </>
                        }
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={handleSubmit} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>
                  <Zap style={{ width: 13, height: 13 }} /> CREATE {parsed.filter(r => !r._error && r._selected).length} WORK ORDERS
                </button>
                <button onClick={() => setStep('input')} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>← BACK</button>
                <button onClick={onClose} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>CANCEL</button>
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '8px', color: 'hsl(140,55%,30%)', fontFamily: FF }}>IMPORT COMPLETE:</div>
              <div style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', marginBottom: '8px' }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderBottom: '1px solid hsl(220,18%,90%)', fontSize: '11px', fontFamily: FF }}>
                    {r._status === 'created'
                      ? <CheckCircle2 style={{ width: 12, height: 12, color: 'hsl(140,55%,35%)', flexShrink: 0 }} />
                      : <X style={{ width: 12, height: 12, color: 'hsl(220,10%,55%)', flexShrink: 0 }} />}
                    <span style={{ fontWeight: r._status === 'created' ? '700' : '400', color: r._status === 'created' ? 'hsl(220,20%,15%)' : 'hsl(220,10%,50%)' }}>
                      {r._status === 'created' ? `${r._orderNumber} — BUS #${r.busNumber}` : `SKIPPED: ${r._raw}`}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>
                <CheckCircle2 style={{ width: 13, height: 13 }} /> DONE
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}