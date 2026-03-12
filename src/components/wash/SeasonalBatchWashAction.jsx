import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertCircle, Zap } from 'lucide-react';

const DELETE_CODE = '877421';
const FF = "'Courier Prime', monospace";

export default function SeasonalBatchWashAction({ onSuccess }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const { data: buses = [] } = useQuery({
    queryKey: ['allBuses'],
    queryFn: () => base44.entities.Bus.list(),
    enabled: showConfirm,
  });

  const batchMutation = useMutation({
    mutationFn: async () => {
      if (code.trim() !== DELETE_CODE) {
        throw new Error('INCORRECT CODE');
      }
      
      const today = new Date().toISOString().split('T')[0];
      const orders = buses.map(bus => ({
        bus_number: bus.bus_number,
        status: 'Pending',
        assigned_date: today,
        washers: [],
      }));
      
      await base44.entities.BusWashOrder.bulkCreate(orders);
    },
    onSuccess: () => {
      setCode('');
      setError('');
      setShowConfirm(false);
      onSuccess?.();
    },
    onError: (err) => {
      if (err.message === 'INCORRECT CODE') {
        setError('INCORRECT CODE — ACCESS DENIED');
      } else {
        setError(err.message);
      }
    }
  });

  const handleConfirm = () => {
    batchMutation.mutate();
  };

  const handleCancel = () => {
    setCode('');
    setError('');
    setShowConfirm(false);
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          fontSize: '11px',
          fontFamily: FF,
          fontWeight: '700',
          background: 'linear-gradient(to right, hsl(280,65%,38%), hsl(280,55%,48%))',
          color: 'white',
          border: 'none',
          borderRadius: '2px',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        <Zap size={14} /> SEASONAL BATCH
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.55)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FF
    }}>
      <div style={{
        border: '2px solid', borderColor: 'hsl(220,15%,96%) hsl(220,15%,50%) hsl(220,15%,50%) hsl(220,15%,96%)',
        background: 'hsl(220,15%,90%)', width: '420px',
        boxShadow: '4px 4px 0 rgba(0,0,0,0.4)'
      }}>
        <div style={{
          background: 'linear-gradient(to right, hsl(280,65%,28%), hsl(280,65%,45%))',
          color: 'white', fontWeight: 'bold', padding: '3px 8px', fontSize: '11px',
          letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <AlertCircle style={{ width: 12, height: 12 }} />
          SEASONAL BATCH WASH AUTHORIZATION
        </div>

        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            border: '2px solid', borderColor: 'hsl(280,65%,40%)', background: 'hsl(280,80%,97%)',
            padding: '8px', fontSize: '11px', color: 'hsl(280,65%,30%)', fontWeight: 'bold'
          }}>
            ⚠️ You are about to create {buses.length} pending wash orders — one for every bus in the fleet.<br />
            <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'hsl(280,40%,40%)', marginTop: '4px', display: 'block' }}>This action cannot be undone.</span>
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Enter Authorization Code:
            </label>
            <input
              className="win-input"
              type="password"
              autoFocus
              style={{ width: '100%', fontSize: '13px', letterSpacing: '0.15em', fontFamily: FF }}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') handleCancel(); }}
              placeholder="••••••••"
              disabled={batchMutation.isPending}
            />
            {error && (
              <div style={{ fontSize: '10px', color: 'hsl(0,72%,45%)', fontWeight: 'bold', marginTop: '4px' }}>
                🚫 {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              style={{ flex: 1, background: 'hsl(280,65%,35%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', padding: '6px', border: 'none', borderRadius: '2px', cursor: 'pointer', opacity: batchMutation.isPending ? 0.6 : 1 }}
              onClick={handleConfirm}
              disabled={batchMutation.isPending}
            >
              <Zap style={{ width: 12, height: 12 }} /> {batchMutation.isPending ? 'CREATING...' : 'CONFIRM BATCH'}
            </button>
            <button
              style={{ flex: 1, fontSize: '11px', padding: '6px', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', cursor: 'pointer', opacity: batchMutation.isPending ? 0.6 : 1 }}
              onClick={handleCancel}
              disabled={batchMutation.isPending}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}