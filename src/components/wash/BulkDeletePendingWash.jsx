import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertTriangle } from 'lucide-react';

const DELETE_CODE = '877421';
const FF = "'Courier Prime', monospace";

export default function BulkDeletePendingWash({ onSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const orders = await base44.entities.BusWashOrder.filter({ status: 'Pending' });
      if (orders.length === 0) return 0;
      
      // Delete in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        await Promise.all(batch.map(order => base44.entities.BusWashOrder.delete(order.id)));
        // Small delay between batches
        if (i + batchSize < orders.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      return orders.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['busWashOrders'] });
      setCode('');
      setError('');
      setShowModal(false);
      if (onSuccess) onSuccess();
    }
  });

  const handleConfirm = () => {
    if (code.trim() === DELETE_CODE) {
      bulkDeleteMutation.mutate();
    } else {
      setError('INCORRECT CODE — ACCESS DENIED');
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          fontSize: '11px',
          fontFamily: FF,
          fontWeight: '700',
          background: 'hsl(0,65%,48%)',
          color: 'white',
          border: 'none',
          borderRadius: '2px',
          cursor: 'pointer'
        }}
      >
        <Trash2 size={14} /> CLEAR ALL PENDING
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.55)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FF
        }}>
          <div style={{
            border: '2px solid', borderColor: 'hsl(220,15%,96%) hsl(220,15%,50%) hsl(220,15%,50%) hsl(220,15%,96%)',
            background: 'hsl(220,15%,90%)', width: '400px',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.4)'
          }}>
            {/* Title bar */}
            <div style={{
              background: 'linear-gradient(to right, hsl(0,65%,28%), hsl(0,65%,45%))',
              color: 'white', fontWeight: 'bold', padding: '3px 8px', fontSize: '11px',
              letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <AlertTriangle style={{ width: 12, height: 12 }} />
              BULK DELETE — PENDING WASH ORDERS
            </div>

            {/* Body */}
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                border: '2px solid', borderColor: 'hsl(0,65%,40%)', background: 'hsl(0,80%,97%)',
                padding: '8px', fontSize: '11px', color: 'hsl(0,65%,30%)', fontWeight: 'bold'
              }}>
                ⚠️ This will DELETE ALL PENDING wash orders. This action CANNOT be undone.
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Enter Authorization Code:
                </label>
                <input
                  type="password"
                  autoFocus
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    letterSpacing: '0.15em',
                    fontFamily: FF,
                    padding: '6px 8px',
                    border: '1px solid hsl(220,18%,70%)',
                    borderRadius: '2px',
                    boxSizing: 'border-box'
                  }}
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') { setShowModal(false); setCode(''); setError(''); } }}
                  placeholder="••••••••"
                />
                {error && (
                  <div style={{ fontSize: '10px', color: 'hsl(0,72%,45%)', fontWeight: 'bold', marginTop: '4px' }}>
                    🚫 {error}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  disabled={bulkDeleteMutation.isPending}
                  style={{
                    flex: 1,
                    background: 'hsl(0,65%,35%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: FF,
                    padding: '6px 12px',
                    border: '1px solid hsl(0,65%,25%)',
                    borderRadius: '2px',
                    opacity: bulkDeleteMutation.isPending ? 0.6 : 1,
                    cursor: bulkDeleteMutation.isPending ? 'not-allowed' : 'pointer'
                  }}
                  onClick={handleConfirm}
                >
                  <Trash2 style={{ width: 12, height: 12 }} /> {bulkDeleteMutation.isPending ? 'DELETING...' : 'CONFIRM DELETE'}
                </button>
                <button
                  disabled={bulkDeleteMutation.isPending}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: FF,
                    padding: '6px 12px',
                    border: '1px solid hsl(220,18%,70%)',
                    borderRadius: '2px',
                    background: 'hsl(220,18%,88%)',
                    cursor: bulkDeleteMutation.isPending ? 'not-allowed' : 'pointer',
                    opacity: bulkDeleteMutation.isPending ? 0.6 : 1
                  }}
                  onClick={() => { setShowModal(false); setCode(''); setError(''); }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}