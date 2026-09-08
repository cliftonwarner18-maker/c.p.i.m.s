import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { History, Search, FileDown } from 'lucide-react';

const FF = "'Courier Prime', monospace";

const STATUS_COLORS = {
  'Available': 'hsl(140,60%,45%)',
  'Subbed Out': 'hsl(28,100%,52%)',
  'Dead Line': 'hsl(0,70%,50%)',
  'MI': 'hsl(210,70%,50%)',
  'PM': 'hsl(45,90%,50%)',
  'In Shop': 'hsl(56,100%,55%)',
  'Active Trip': 'hsl(280,55%,48%)',
  'Parked OOS': 'hsl(220,8%,45%)',
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || 'hsl(220,10%,50%)';
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '2px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em', background: c, color: status === 'PM' || status === 'In Shop' ? '#1a1a1a' : 'white' }}>
      {status || '—'}
    </span>
  );
}

export default function WhiteBoardAuditTrail() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('recent'); // 'recent' | 'lastPerBus'

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['whiteBoardAudits'],
    queryFn: () => base44.entities.WhiteBoardAudit.list('-changed_at', 500),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return audits;
    return audits.filter(a =>
      (a.bus_number || '').toLowerCase().includes(q) ||
      (a.changed_by_email || '').toLowerCase().includes(q) ||
      (a.changed_by_name || '').toLowerCase().includes(q) ||
      (a.previous_status || '').toLowerCase().includes(q) ||
      (a.new_status || '').toLowerCase().includes(q)
    );
  }, [audits, search]);

  // Last change per bus
  const lastPerBus = useMemo(() => {
    const map = {};
    audits.forEach(a => {
      if (!map[a.bus_number] || new Date(a.changed_at) > new Date(map[a.bus_number].changed_at)) {
        map[a.bus_number] = a;
      }
    });
    return Object.values(map).sort((a, b) => (a.bus_number || '').localeCompare(b.bus_number || ''));
  }, [audits]);

  const display = view === 'recent' ? filtered : lastPerBus.filter(a => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (a.bus_number || '').toLowerCase().includes(q) ||
      (a.changed_by_email || '').toLowerCase().includes(q) ||
      (a.changed_by_name || '').toLowerCase().includes(q);
  });

  const handleExport = () => {
    const rows = display.map(a => `<tr>
      <td style="text-align:center;font-weight:700">${a.bus_number || ''}</td>
      <td style="text-align:center">${a.previous_status || '—'}</td>
      <td style="text-align:center;font-weight:700">${a.new_status || '—'}</td>
      <td>${a.changed_by_name || ''}</td>
      <td>${a.changed_by_email || ''}</td>
      <td>${a.source || ''}</td>
      <td>${a.subbed_for_bus ? '#' + a.subbed_for_bus : '—'}</td>
      <td>${a.changed_at ? new Date(a.changed_at).toLocaleString() : ''}</td>
    </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>White Board Audit Trail</title>
<style>
  body { font-family: 'Courier New', monospace; padding: 20px; }
  h1 { font-size: 14px; letter-spacing: 0.08em; }
  .sub { font-size: 11px; color: #555; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: hsl(220,50%,30%); color: white; padding: 5px 8px; text-align: left; font-size: 10px; letter-spacing: 0.05em; }
  td { padding: 4px 8px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) { background: #f7f7f7; }
</style></head><body>
  <h1>WHITE BOARD — AUDIT TRAIL</h1>
  <div class="sub">NHCS Transportation — Data-TraCs System | ${new Date().toLocaleString()} | ${display.length} entries (${view === 'recent' ? 'recent changes' : 'last change per bus'})</div>
  <table><thead><tr><th>BUS #</th><th>PREV</th><th>NEW</th><th>CHANGED BY</th><th>EMAIL / LOGIN</th><th>SOURCE</th><th>SUBBED FOR</th><th>WHEN</th></tr></thead>
  <tbody>${rows}</tbody></table>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const inp = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none' };
  const btnBase = { padding: '4px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(260,50%,32%), hsl(260,45%,42%))', color: 'white', padding: '8px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
        <History style={{ width: 14, height: 14 }} /> WHITE BOARD — AUDIT TRAIL
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', borderBottom: '1px solid hsl(220,18%,88%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Search style={{ width: 13, height: 13, color: 'hsl(220,20%,45%)' }} />
          <input placeholder="Search bus #, user, email, status..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, width: '280px' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setView('recent')} style={{ ...btnBase, background: view === 'recent' ? 'hsl(260,50%,40%)' : 'white', color: view === 'recent' ? 'white' : 'hsl(220,20%,30%)', borderColor: view === 'recent' ? 'hsl(260,50%,40%)' : 'hsl(220,18%,72%)' }}>RECENT CHANGES</button>
          <button onClick={() => setView('lastPerBus')} style={{ ...btnBase, background: view === 'lastPerBus' ? 'hsl(260,50%,40%)' : 'white', color: view === 'lastPerBus' ? 'white' : 'hsl(220,20%,30%)', borderColor: view === 'lastPerBus' ? 'hsl(260,50%,40%)' : 'hsl(220,18%,72%)' }}>LAST CHANGE PER BUS</button>
        </div>
        <button onClick={handleExport} style={{ ...btnBase, display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'hsl(220,55%,38%)', color: 'white', borderColor: 'hsl(220,55%,28%)' }}>
          <FileDown style={{ width: 11, height: 11 }} /> EXPORT
        </button>
        <span style={{ fontSize: '10px', color: 'hsl(220,10%,50%)', marginLeft: 'auto' }}>{display.length} ENTRIES</span>
      </div>

      <div style={{ maxHeight: '440px', overflow: 'auto' }}>
        <table style={{ width: '100%', fontSize: '11px', fontFamily: FF, borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'hsl(220,18%,94%)', zIndex: 2 }}>
            <tr>
              <th style={{ padding: '5px 8px', textAlign: 'left', borderBottom: '1px solid hsl(220,18%,78%)' }}>BUS #</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid hsl(220,18%,78%)' }}>PREV</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid hsl(220,18%,78%)' }}>NEW</th>
              <th style={{ padding: '5px 8px', textAlign: 'left', borderBottom: '1px solid hsl(220,18%,78%)' }}>CHANGED BY</th>
              <th style={{ padding: '5px 8px', textAlign: 'left', borderBottom: '1px solid hsl(220,18%,78%)' }}>EMAIL / LOGIN</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid hsl(220,18%,78%)' }}>SOURCE</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid hsl(220,18%,78%)' }}>SUBBED FOR</th>
              <th style={{ padding: '5px 8px', textAlign: 'left', borderBottom: '1px solid hsl(220,18%,78%)' }}>WHEN</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>LOADING AUDIT TRAIL...</td></tr>}
            {!isLoading && display.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>NO AUDIT ENTRIES YET — STATUS CHANGES WILL APPEAR HERE</td></tr>
            )}
            {display.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,15%,97%)', borderBottom: '1px solid hsl(220,18%,92%)' }}>
                <td style={{ padding: '5px 8px', fontWeight: '700' }}>{a.bus_number}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}><StatusBadge status={a.previous_status} /></td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}><StatusBadge status={a.new_status} /></td>
                <td style={{ padding: '5px 8px' }}>{a.changed_by_name || '—'}</td>
                <td style={{ padding: '5px 8px', color: 'hsl(220,10%,40%)', fontSize: '10px' }}>{a.changed_by_email || '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', fontSize: '10px' }}>{a.source || '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', fontSize: '10px' }}>{a.subbed_for_bus ? `#${a.subbed_for_bus}` : '—'}</td>
                <td style={{ padding: '5px 8px', fontSize: '10px', color: 'hsl(220,10%,40%)' }}>{a.changed_at ? new Date(a.changed_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}