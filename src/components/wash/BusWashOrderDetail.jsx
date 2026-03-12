import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Plus, Trash2 } from 'lucide-react';

const FF = "'Courier Prime', monospace";

const checklistItems = [
  { key: 'washed_exterior', label: 'Washed Exterior' },
  { key: 'windows', label: 'Windows' },
  { key: 'interior_sweep', label: 'Interior Sweep' },
  { key: 'mop', label: 'Mop' },
  { key: 'wipe_clean_seats', label: 'Wipe Clean All Seats' },
  { key: 'clean_inside_windows', label: 'Clean Inside Windows' }
];

export default function BusWashOrderDetail({ order, onClose, onComplete }) {
  const [washers, setWashers] = useState(order.washers || []);
  const [checklist, setChecklist] = useState(order.checklist || {});
  const [washDate, setWashDate] = useState(order.assigned_date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(order.start_time || '');
  const [endTime, setEndTime] = useState(order.end_time || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [newWasher, setNewWasher] = useState('');

  const queryClient = useQueryClient();

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list(),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      let elapsedMinutes = 0;
      if (startTime && endTime) {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        elapsedMinutes = Math.round((end - start) / 60000);
      }

      await base44.entities.BusWashOrder.update(order.id, {
        washers,
        checklist,
        assigned_date: washDate,
        start_time: startTime,
        end_time: endTime,
        elapsed_time_minutes: elapsedMinutes,
        notes,
        status: 'Completed',
        completed_date: new Date().toISOString()
      });

      queryClient.invalidateQueries({ queryKey: ['busWashOrders'] });
      onComplete();
    }
  });

  const toggleChecklist = (key) => {
    setChecklist({ ...checklist, [key]: !checklist[key] });
  };

  const addWasher = () => {
    if (newWasher && !washers.includes(newWasher)) {
      setWashers([...washers, newWasher]);
      setNewWasher('');
    }
  };

  const removeWasher = (name) => {
    setWashers(washers.filter(w => w !== name));
  };

  const checklistComplete = checklistItems.every(item => checklist[item.key]);
  const canComplete = washers.length > 0 && startTime && endTime && checklistComplete;

  let elapsedMinutes = 0;
  let elapsedHours = 0;
  if (startTime && endTime) {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    elapsedMinutes = Math.round((end - start) / 60000);
    elapsedHours = (elapsedMinutes / 60).toFixed(2);
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '2px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        border: '1px solid hsl(220,18%,70%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(to right, hsl(140,55%,32%), hsl(140,50%,42%))',
          color: 'white',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: FF
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em' }}>
              COMPLETE WASH ORDER
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>Bus #{order.bus_number}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', fontFamily: FF }}>
          {/* Washers */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', display: 'block', marginBottom: '6px' }}>
              ASSIGNED WASHERS ({washers.length})
            </label>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <select
                value={newWasher}
                onChange={(e) => setNewWasher(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontFamily: FF,
                  border: '1px solid hsl(220,18%,70%)',
                  borderRadius: '2px'
                }}
              >
                <option value="">-- ADD WASHER --</option>
                {systemUsers.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
              <button
                onClick={addWasher}
                disabled={!newWasher}
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontFamily: FF,
                  fontWeight: '700',
                  background: newWasher ? 'hsl(140,55%,40%)' : 'hsl(220,18%,80%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: newWasher ? 'pointer' : 'not-allowed'
                }}
              >
                <Plus size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {washers.map(washer => (
                <div
                  key={washer}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'hsl(140,70%,92%)',
                    border: '1px solid hsl(140,55%,70%)',
                    borderRadius: '2px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}
                >
                  {washer}
                  <button
                    onClick={() => removeWasher(washer)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0,65%,48%)', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Times */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', display: 'block', marginBottom: '4px' }}>
                START TIME
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontFamily: FF,
                  border: '1px solid hsl(220,18%,70%)',
                  borderRadius: '2px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', display: 'block', marginBottom: '4px' }}>
                END TIME
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontFamily: FF,
                  border: '1px solid hsl(220,18%,70%)',
                  borderRadius: '2px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Elapsed Time Display */}
          {startTime && endTime && (
            <div style={{
              background: 'hsl(280,70%,94%)',
              border: '1px solid hsl(280,55%,70%)',
              borderRadius: '2px',
              padding: '10px',
              display: 'flex',
              justifyContent: 'space-around',
              fontSize: '11px',
              fontWeight: '700',
              color: 'hsl(280,55%,35%)'
            }}>
              <div>
                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>MINUTES</div>
                {elapsedMinutes} min
              </div>
              <div style={{ borderLeft: '1px solid hsl(280,55%,70%)', paddingLeft: '10px' }}>
                <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px' }}>HOURS</div>
                {elapsedHours} hrs
              </div>
            </div>
          )}

          {/* Checklist */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', display: 'block', marginBottom: '8px' }}>
              WASH CHECKLIST
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {checklistItems.map(item => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    background: checklist[item.key] ? 'hsl(140,70%,92%)' : 'hsl(220,10%,98%)',
                    border: `1px solid ${checklist[item.key] ? 'hsl(140,55%,70%)' : 'hsl(220,18%,85%)'}`,
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontFamily: FF
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key] || false}
                    onChange={() => toggleChecklist(item.key)}
                    style={{ cursor: 'pointer' }}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', display: 'block', marginBottom: '4px' }}>
              NOTES
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                padding: '6px 8px',
                fontSize: '11px',
                fontFamily: FF,
                border: '1px solid hsl(220,18%,70%)',
                borderRadius: '2px',
                boxSizing: 'border-box',
                resize: 'none'
              }}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Validation Messages */}
          {!canComplete && (
            <div style={{
              background: 'hsl(45,90%,94%)',
              border: '1px solid hsl(45,90%,70%)',
              borderRadius: '2px',
              padding: '8px',
              fontSize: '10px',
              color: 'hsl(45,70%,30%)',
              fontWeight: '700'
            }}>
              ⚠️ Required: {!washers.length && '• Assign at least one washer'}{!washers.length && startTime && ' • '}{!startTime && '• Set start time'}{!startTime && endTime && ' • '}{!endTime && '• Set end time'}{(!startTime || !endTime) && !checklistComplete && ' • '}{!checklistComplete && '• Complete all checklist items'}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={onClose}
              disabled={completeMutation.isPending}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '11px',
                fontFamily: FF,
                fontWeight: '700',
                background: 'hsl(220,18%,88%)',
                color: 'hsl(220,20%,20%)',
                border: '1px solid hsl(220,18%,70%)',
                borderRadius: '2px',
                cursor: completeMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: completeMutation.isPending ? 0.6 : 1
              }}
            >
              CANCEL
            </button>
            <button
              onClick={() => completeMutation.mutate()}
              disabled={!canComplete || completeMutation.isPending}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '11px',
                fontFamily: FF,
                fontWeight: '700',
                background: canComplete ? 'hsl(140,55%,40%)' : 'hsl(220,18%,80%)',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: canComplete ? 'pointer' : 'not-allowed',
                opacity: canComplete ? 1 : 0.6
              }}
            >
              {completeMutation.isPending ? 'COMPLETING...' : '✓ COMPLETE WASH'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}