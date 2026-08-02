import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Search, X } from 'lucide-react';
import FormModal from '../components/FormModal';

const FF = "'Courier Prime', monospace";

const STATUS_META = {
  'Available':  { label: 'AVAILABLE',  bg: 'hsl(140,60%,45%)',  border: 'hsl(140,60%,32%)', text: 'white',  glow: '0 0 10px hsl(140,60%,45%)' },
  'Dead Line':  { label: 'DEAD LINE',  bg: 'hsl(0,70%,50%)',    border: 'hsl(0,70%,38%)',   text: 'white',  glow: '0 0 10px hsl(0,70%,50%)' },
  'MI':         { label: 'MI',         bg: 'hsl(210,70%,50%)',  border: 'hsl(210,70%,38%)', text: 'white',  glow: '0 0 10px hsl(210,70%,50%)' },
  'PM':         { label: 'PM',         bg: 'hsl(45,90%,50%)',   border: 'hsl(45,90%,38%)',  text: '#1a1a1a', glow: '0 0 10px hsl(45,90%,50%)' },
};

const STATUS_ORDER = ['Available', 'Dead Line', 'MI', 'PM'];

export default function WhiteBoard() {
  const queryClient = useQueryClient();
  const [lotFilter, setLotFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);

  const { data: buses = [], isLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, board_status }) => base44.entities.Bus.update(id, { board_status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buses'] }),
  });

  const activeBuses = buses.filter(b => b.status !== 'Retired' && b.base_location !== 'Sold' && b.whiteboard_tracking !== false && (b.bus_number || '').toUpperCase() !== 'LAB HOURS');

  const filtered = activeBuses.filter(b => {
    const lotMatch = lotFilter === 'All' || b.base_location === lotFilter;
    const typeMatch = typeFilter === 'All' || b.bus_type === typeFilter;
    const q = search.toLowerCase();
    const searchMatch = !search || b.bus_number?.toLowerCase().includes(q) || b.make?.toLowerCase().includes(q) || b.model?.toLowerCase().includes(q);
    return lotMatch && typeMatch && searchMatch;
  });

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = activeBuses.filter(b => (b.board_status || 'Available') === s).length;
    return acc;
  }, {});

  const handleSetStatus = (status) => {
    if (!selectedBus) return;
    updateMutation.mutate({ id: selectedBus.id, board_status: status });
    setSelectedBus(null);
  };

  const btnBase = { padding: '3px 8px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutGrid style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>WHITE BOARD — BUS STATUS BOARD</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>REAL-TIME FLEET AVAILABILITY — CLICK A BUS TO CHANGE STATUS</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Search style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.7)' }} />
          <input
            placeholder="Search bus #, make, model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', color: 'white', width: '220px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Legend / Stats */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {STATUS_ORDER.map(s => {
          const m = STATUS_META[s];
          return (
            <div key={s} style={{ background: 'white', border: `1px solid hsl(220,18%,78%)`, borderLeft: `4px solid ${m.bg}`, borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '120px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: m.bg, border: `1px solid ${m.border}`, borderRadius: '2px' }} />
                <span style={{ fontSize: '9px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>{m.label}</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: m.bg, lineHeight: 1, marginTop: '4px' }}>{counts[s]}</div>
            </div>
          );
        })}
      </div>

      {/* Lot Filter */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>LOT:</span>
        {['All', 'Main', 'North'].map(l => (
          <button key={l} onClick={() => setLotFilter(l)} style={{ ...btnBase, background: lotFilter === l ? 'hsl(220,55%,38%)' : 'white', color: lotFilter === l ? 'white' : 'hsl(220,20%,30%)', borderColor: lotFilter === l ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)' }}>
            {l.toUpperCase()}
          </button>
        ))}
        <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginLeft: '8px' }}>TYPE:</span>
        {['All', 'School Bus', 'Activity Bus'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{ ...btnBase, background: typeFilter === t ? 'hsl(220,55%,38%)' : 'white', color: typeFilter === t ? 'white' : 'hsl(220,20%,30%)', borderColor: typeFilter === t ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)' }}>
            {t === 'All' ? 'ALL' : t.toUpperCase()}
          </button>
        ))}
        <span style={{ fontSize: '10px', color: 'hsl(220,10%,50%)', marginLeft: 'auto' }}>SHOWING {filtered.length} BUSES</span>
      </div>

      {/* Board */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: FF, color: 'hsl(220,10%,45%)', fontSize: '12px' }}>LOADING FLEET...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: FF, color: 'hsl(220,10%,45%)', fontSize: '12px' }}>NO BUSES MATCH FILTER</div>
      ) : (
        <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
            {filtered.map(b => {
              const status = b.board_status || 'Available';
              const m = STATUS_META[status];
              const isSub = (b.route_class || 'Permanent') === 'Substitute';
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBus(b)}
                  style={{
                    background: m.bg, color: m.text,
                    border: isSub ? `3px dashed hsl(330,80%,55%)` : `2px solid ${m.border}`,
                    borderRadius: '4px',
                    padding: '10px 6px', cursor: 'pointer', fontFamily: FF,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    boxShadow: isSub ? `0 0 10px hsl(330,80%,60%), inset 0 0 12px rgba(255,105,180,0.35)` : m.glow,
                    transition: 'transform 0.1s', minHeight: '78px',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {isSub && <div style={{ position: 'absolute', top: '2px', right: '3px', fontSize: '7px', fontWeight: '700', letterSpacing: '0.08em', background: 'hsl(330,80%,55%)', color: 'white', padding: '1px 4px', borderRadius: '2px' }}>SUB</div>}
                  <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '0.05em', lineHeight: 1 }}>{b.bus_number}</div>
                  <div style={{ fontSize: '8px', fontWeight: '700', letterSpacing: '0.1em', opacity: 0.9, background: 'rgba(0,0,0,0.18)', padding: '1px 6px', borderRadius: '2px' }}>{m.label}</div>
                  {b.make && <div style={{ fontSize: '8px', opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{b.make}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status picker modal */}
      <FormModal open={!!selectedBus} onClose={() => setSelectedBus(null)} maxWidth="420px">
        {selectedBus && (
          <div style={{ background: 'white', borderRadius: '2px', fontFamily: FF }}>
            <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>BUS #{selectedBus.bus_number} — SET STATUS</span>
              <button onClick={() => setSelectedBus(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X style={{ width: 14, height: 14 }} /></button>
            </div>
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '10px', color: 'hsl(220,10%,45%)' }}>
                Current: <strong style={{ color: STATUS_META[selectedBus.board_status || 'Available'].bg }}>{STATUS_META[selectedBus.board_status || 'Available'].label}</strong>
                {selectedBus.make ? ` — ${selectedBus.make} ${selectedBus.model || ''}`.trim() : ''}
              </div>
              {STATUS_ORDER.map(s => {
                const m = STATUS_META[s];
                const isCurrent = (selectedBus.board_status || 'Available') === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleSetStatus(s)}
                    disabled={isCurrent}
                    style={{
                      background: m.bg, color: m.text, border: `2px solid ${m.border}`, borderRadius: '4px',
                      padding: '12px', fontFamily: FF, fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em',
                      cursor: isCurrent ? 'default' : 'pointer', opacity: isCurrent ? 0.55 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span>● {m.label}</span>
                    {isCurrent && <span style={{ fontSize: '9px', opacity: 0.8 }}>CURRENT</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}