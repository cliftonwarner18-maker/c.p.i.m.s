import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

const FF = "'Courier Prime', monospace";

export default function BulkBusWashForm() {
  const [expanded, setExpanded] = useState(false);
  const [buses, setBuses] = useState([]);
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryClient = useQueryClient();

  const { data: busList = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list(),
  });

  const addBus = () => {
    setBuses([...buses, { bus_number: '', id: Math.random() }]);
  };

  const removeBus = (id) => {
    setBuses(buses.filter(b => b.id !== id));
  };

  const updateBus = (id, busNumber) => {
    setBuses(buses.map(b => b.id === id ? { ...b, bus_number: busNumber } : b));
  };

  const handleSubmit = async () => {
    if (buses.length === 0) {
      alert('Please add at least one bus');
      return;
    }

    setIsSubmitting(true);

    const orders = buses.map(bus => ({
      bus_number: bus.bus_number,
      status: 'Pending',
      assigned_date: assignDate,
      washers: [],
      checklist: {
        washed_exterior: false,
        windows: false,
        interior_sweep: false,
        mop: false,
        wipe_clean_seats: false,
        clean_inside_windows: false
      }
    }));

    await base44.entities.BusWashOrder.bulkCreate(orders);
    queryClient.invalidateQueries({ queryKey: ['busWashOrders'] });
    setBuses([]);
    setExpanded(false);
    setIsSubmitting(false);
  };

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'linear-gradient(to right, hsl(140,55%,30%), hsl(140,50%,40%))',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '700',
          letterSpacing: '0.08em',
          fontFamily: FF
        }}
      >
        <span>✚ BULK ASSIGN BUSES FOR WASHING</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div style={{ padding: '14px', background: 'hsl(220,10%,98%)', borderTop: '1px solid hsl(220,18%,88%)' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', display: 'block', marginBottom: '4px' }}>
              ASSIGNMENT DATE
            </label>
            <input
              type="date"
              value={assignDate}
              onChange={(e) => setAssignDate(e.target.value)}
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

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', display: 'block', marginBottom: '8px' }}>
              SELECT BUSES ({buses.length})
            </label>
            <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {buses.map((b, idx) => (
                <div key={b.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    value={b.bus_number}
                    onChange={(e) => updateBus(b.id, e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      fontSize: '11px',
                      fontFamily: FF,
                      border: '1px solid hsl(220,18%,70%)',
                      borderRadius: '2px'
                    }}
                  >
                    <option value="">-- SELECT BUS --</option>
                    {busList.map(bus => (
                      <option key={bus.id} value={bus.bus_number}>{bus.bus_number}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeBus(b.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'hsl(0,65%,48%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontFamily: FF
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={addBus}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: FF,
                fontWeight: '700',
                background: 'hsl(220,18%,88%)',
                color: 'hsl(220,20%,20%)',
                border: '1px solid hsl(220,18%,70%)',
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> ADD BUS
            </button>

            <button
              onClick={handleSubmit}
              disabled={buses.length === 0 || isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: FF,
                fontWeight: '700',
                background: buses.length === 0 || isSubmitting ? 'hsl(220,18%,80%)' : 'hsl(140,55%,40%)',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                cursor: buses.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: buses.length === 0 || isSubmitting ? 0.6 : 1,
                marginLeft: 'auto'
              }}
            >
              {isSubmitting ? 'ASSIGNING...' : '✓ ASSIGN ALL'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}