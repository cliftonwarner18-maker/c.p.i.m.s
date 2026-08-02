import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, PlusCircle, X, Download, Search, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import FormModal from '@/components/FormModal';
import GarageRepairForm from '@/components/garage/GarageRepairForm';

const FF = "'Courier Prime', monospace";

const STATUS_COLORS = {
  'Open':        { bg: 'hsl(45,90%,50%)',  text: '#1a1a1a', label: 'OPEN' },
  'In Progress': { bg: 'hsl(210,70%,50%)', text: 'white',   label: 'IN PROGRESS' },
  'Completed':   { bg: 'hsl(140,60%,42%)', text: 'white',   label: 'COMPLETED' },
  'Cancelled':   { bg: 'hsl(0,60%,48%)',   text: 'white',   label: 'CANCELLED' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
}

const exportGarageBoard = (repairs, tab) => {
  const rows = repairs.map(r => {
    const sc = STATUS_COLORS[r.repair_status] || STATUS_COLORS['Open'];
    return `<tr>
      <td style="font-weight:700">${r.bus_number || ''}</td>
      <td>${r.mechanic || ''}</td>
      <td>${r.model || ''}</td>
      <td>${fmtDate(r.date_parked)}</td>
      <td>${r.reason_for_parking || ''}</td>
      <td>${r.bus_location || ''}</td>
      <td>${fmtDate(r.estimated_repair_date)}</td>
      <td>${fmtDate(r.actual_repair_date)}</td>
      <td style="text-align:center"><span style="background:${sc.bg};color:${sc.text};padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700">${sc.label}</span></td>
      <td>${r.repairs_rendered || ''}</td>
      <td>${r.reason_not_completed || ''}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Garage Board Export</title>
<style>
  body { font-family:'Courier New',monospace; padding:20px; font-size:11px; }
  h1 { font-size:15px; margin:0 0 4px; letter-spacing:.08em; }
  .sub { font-size:10px; color:#555; margin-bottom:10px; }
  table { width:100%; border-collapse:collapse; font-size:10px; }
  th { background:hsl(30,60%,35%); color:white; padding:5px 6px; text-align:left; font-size:9px; letter-spacing:.05em; white-space:nowrap; }
  td { padding:4px 6px; border-bottom:1px solid #ddd; vertical-align:top; }
  tr:nth-child(even) { background:#f9f9f9; }
  .foot { margin-top:8px; font-size:9px; color:#888; }
</style></head><body>
  <h1>GARAGE BOARD — ${tab.toUpperCase()} BUS REPAIRS</h1>
  <div class="sub">NHCS Transportation — Data-TraCs System &nbsp;|&nbsp; ${new Date().toLocaleString()}</div>
  <table>
    <thead><tr><th>BUS #</th><th>MECH</th><th>MODEL</th><th>DATE PARKED</th><th>REASON</th><th>LOCATION</th><th>EST DATE</th><th>ACTUAL DATE</th><th>STATUS</th><th>REPAIRS RENDERED</th><th>PENDING NOTES</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="foot">Total: ${repairs.length} records &nbsp;|&nbsp; Garage Board Export</div>
</body></html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
};

export default function GarageBoard() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Active');
  const [search, setSearch] = useState('');
  const [locFilter, setLocFilter] = useState('All');
  const [editingRepair, setEditingRepair] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ['garage_repairs'],
    queryFn: () => base44.entities.GarageRepair.list('-date_parked'),
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.GarageRepair.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['garage_repairs'] }),
  });

  const activeBuses = buses.filter(b => b.status !== 'Retired' && b.base_location !== 'Sold');

  const activeRepairs = repairs.filter(r => r.repair_status !== 'Completed' && r.repair_status !== 'Cancelled');
  const completedRepairs = repairs.filter(r => r.repair_status === 'Completed' || r.repair_status === 'Cancelled');

  const displayList = (tab === 'Active' ? activeRepairs : completedRepairs).filter(r => {
    if (locFilter !== 'All' && r.bus_location !== locFilter) return false;
    const q = search.toLowerCase();
    return !search || r.bus_number?.toLowerCase().includes(q) || r.mechanic?.toLowerCase().includes(q) || r.reason_for_parking?.toLowerCase().includes(q) || r.bus_location?.toLowerCase().includes(q);
  });

  const btnBase = { padding: '3px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };

  const counts = {
    Open: activeRepairs.filter(r => r.repair_status === 'Open').length,
    'In Progress': activeRepairs.filter(r => r.repair_status === 'In Progress').length,
    Completed: completedRepairs.filter(r => r.repair_status === 'Completed').length,
    Cancelled: completedRepairs.filter(r => r.repair_status === 'Cancelled').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(30,60%,32%), hsl(30,55%,44%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wrench style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>GARAGE BOARD — PARKED BUS REPAIRS</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>TRACK ALL PARKED BUSES &amp; PENDING MECHANICAL ISSUES</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select value={locFilter} onChange={e => setLocFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', color: 'white', outline: 'none', cursor: 'pointer' }}>
            <option value="All" style={{ color: '#333' }}>ALL LOCATIONS</option>
            {['Main', 'North', 'Central', 'Other'].map(l => <option key={l} value={l} style={{ color: '#333' }}>{l.toUpperCase()}</option>)}
          </select>
          <Search style={{ width: 12, height: 12, opacity: 0.7 }} />
          <input placeholder="Search bus, mechanic, reason..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '4px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', color: 'white', width: '220px', outline: 'none' }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <div key={s} style={{ background: 'white', border: `1px solid hsl(220,18%,78%)`, borderLeft: `4px solid ${c.bg}`, borderRadius: '2px', padding: '8px 12px', flex: 1, minWidth: '100px' }}>
            <div style={{ fontSize: '9px', fontWeight: '700', color: 'hsl(220,20%,40%)', letterSpacing: '0.06em' }}>{c.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: c.bg, lineHeight: 1, marginTop: '3px' }}>{counts[s] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Tabs + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '6px 10px' }}>
        {['Active', 'Completed'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ ...btnBase, background: tab === t ? 'hsl(30,60%,40%)' : 'white', color: tab === t ? 'white' : 'hsl(220,20%,30%)', borderColor: tab === t ? 'hsl(30,60%,30%)' : 'hsl(220,18%,72%)' }}>
            {t.toUpperCase()} {t === 'Active' ? `(${activeRepairs.length})` : `(${completedRepairs.length})`}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => exportGarageBoard(displayList, tab)} style={{ ...btnBase, background: 'hsl(220,55%,38%)', color: 'white', borderColor: 'hsl(220,55%,28%)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Download style={{ width: 11, height: 11 }} /> EXPORT
          </button>
          <button onClick={() => { setEditingRepair(null); setShowForm(true); }} style={{ ...btnBase, background: 'hsl(30,60%,40%)', color: 'white', borderColor: 'hsl(30,60%,28%)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <PlusCircle style={{ width: 11, height: 11 }} /> ADD REPAIR
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '12px', color: 'hsl(220,10%,45%)' }}>LOADING...</div>
      ) : displayList.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '12px', color: 'hsl(220,10%,45%)', background: 'hsl(220,18%,97%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px' }}>
          {search ? 'NO RECORDS MATCH SEARCH.' : tab === 'Active' ? 'NO ACTIVE REPAIRS — ALL BUSES CLEAR.' : 'NO COMPLETED RECORDS.'}
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: FF }}>
            <thead>
              <tr style={{ background: 'hsl(30,60%,35%)', color: 'white' }}>
                {['BUS #', 'MECH', 'MODEL', 'DATE PARKED', 'REASON FOR PARKING', 'LOCATION', 'EST. DATE', 'ACTUAL DATE', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '9px', letterSpacing: '0.06em', whiteSpace: 'nowrap', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayList.map((r, i) => {
                const sc = STATUS_COLORS[r.repair_status] || STATUS_COLORS['Open'];
                return (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(30,20%,98%)', borderBottom: '1px solid hsl(220,18%,88%)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>{r.bus_number}</td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{r.mechanic || '—'}</td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{r.model || '—'}</td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{fmtDate(r.date_parked)}</td>
                    <td style={{ padding: '6px 8px', maxWidth: '260px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' }} title={r.reason_for_parking}>{r.reason_for_parking}</div>
                      {r.reason_not_completed && <div style={{ fontSize: '9px', color: 'hsl(0,55%,45%)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>⚠ {r.reason_not_completed}</div>}
                      {r.repairs_rendered && <div style={{ fontSize: '9px', color: 'hsl(140,55%,35%)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {r.repairs_rendered}</div>}
                    </td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{r.bus_location || '—'}</td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', color: r.estimated_repair_date && new Date(r.estimated_repair_date) < new Date() && r.repair_status !== 'Completed' ? 'hsl(0,65%,45%)' : 'inherit' }}>{fmtDate(r.estimated_repair_date)}</td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{fmtDate(r.actual_repair_date)}</td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                      <span style={{ background: sc.bg, color: sc.text, padding: '2px 7px', borderRadius: '2px', fontSize: '9px', fontWeight: '700', letterSpacing: '0.06em' }}>{sc.label}</span>
                      {r.return_to_service && <div style={{ fontSize: '8px', color: 'hsl(140,55%,38%)', marginTop: '2px', fontWeight: '700' }}>✓ RETURNED</div>}
                    </td>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => { setEditingRepair(r); setShowForm(true); }} style={{ padding: '3px 8px', fontSize: '9px', fontFamily: FF, fontWeight: '700', background: 'hsl(210,60%,45%)', color: 'white', border: '1px solid hsl(210,60%,33%)', borderRadius: '2px', cursor: 'pointer' }}>OPEN</button>
                        <button onClick={() => { if (window.confirm(`Delete repair record for Bus #${r.bus_number}?`)) deleteMut.mutate(r.id); }} style={{ padding: '3px 8px', fontSize: '9px', fontFamily: FF, fontWeight: '700', background: 'hsl(0,60%,48%)', color: 'white', border: '1px solid hsl(0,60%,36%)', borderRadius: '2px', cursor: 'pointer' }}>DEL</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '6px 10px', fontSize: '9px', color: 'hsl(220,10%,50%)', borderTop: '1px solid hsl(220,18%,88%)', background: 'hsl(30,15%,98%)' }}>
            {displayList.length} RECORD{displayList.length !== 1 ? 'S' : ''}
          </div>
        </div>
      )}

      {/* Form modal */}
      <FormModal open={showForm} onClose={() => { setShowForm(false); setEditingRepair(null); }} maxWidth="640px">
        <GarageRepairForm
          repair={editingRepair}
          buses={activeBuses}
          onClose={() => { setShowForm(false); setEditingRepair(null); }}
          onSaved={() => { setShowForm(false); setEditingRepair(null); }}
        />
      </FormModal>
    </div>
  );
}