import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, X } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";
const inputStyle = { width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };

export default function WashBayForm() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bus_number: '',
    washer_name: '',
    wash_date: moment().format('YYYY-MM-DD'),
    start_time: '',
    end_time: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list('bus_number') });
  const { data: systemUsers = [] } = useQuery({ queryKey: ['systemUsers'], queryFn: () => base44.entities.SystemUser.list('name') });
  const { data: washRecords = [] } = useQuery({ queryKey: ['washBay'], queryFn: () => base44.entities.WashBay.list('-wash_date') });

  const activeUsers = systemUsers.filter(u => u.active !== false);
  const createMutation = useMutation({
    mutationFn: (data) => {
      const startTime = moment(`${data.wash_date} ${data.start_time}`, 'YYYY-MM-DD HH:mm');
      const endTime = moment(`${data.wash_date} ${data.end_time}`, 'YYYY-MM-DD HH:mm');
      const elapsed = endTime.diff(startTime, 'minutes');
      return base44.entities.WashBay.create({ ...data, elapsed_time_minutes: Math.max(0, elapsed) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washBay'] });
      setFormData({ bus_number: '', washer_name: '', wash_date: moment().format('YYYY-MM-DD'), start_time: '', end_time: '', notes: '' });
      setShowForm(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.bus_number && formData.washer_name && formData.start_time && formData.end_time) {
      createMutation.mutate(formData);
    }
  };

  const totalWashHours = (washRecords.reduce((sum, w) => sum + (w.elapsed_time_minutes || 0), 0) / 60).toFixed(2);
  const activeBuses = buses.filter(b => b.status !== 'Retired');

  return (
    <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden', fontFamily: FF }}>
      <div style={{ background: 'linear-gradient(to right, hsl(140,55%,32%), hsl(140,50%,42%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: 0 }}>🚐 WASH BAY MANAGEMENT — SUMMER HOURS LOG</div>

      <div style={{ padding: '12px', background: 'hsl(220,10%,98%)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ ...btnBase, background: 'hsl(140,55%,42%)', color: 'white', borderColor: 'hsl(140,55%,35%)' }}><Plus style={{ width: 12, height: 12 }} /> Log Wash Session</button>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,30%)', marginLeft: 'auto' }}>📊 Total Wash Hours: <span style={{ color: 'hsl(140,55%,40%)', fontSize: '11px' }}>{totalWashHours} hrs</span></div>
        </div>

        {showForm && (
          <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', padding: '12px', marginBottom: '12px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>Bus Number *</label>
                  <select value={formData.bus_number} onChange={e => setFormData({ ...formData, bus_number: e.target.value })} required style={inputStyle}>
                    <option value="">— Select Bus —</option>
                    {activeBuses.map(b => <option key={b.id} value={b.bus_number}>{b.bus_number}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Washer Name *</label>
                  <select value={formData.washer_name} onChange={e => setFormData({ ...formData, washer_name: e.target.value })} required style={inputStyle}>
                    <option value="">— Select Washer —</option>
                    {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Wash Date *</label>
                  <input type="date" value={formData.wash_date} onChange={e => setFormData({ ...formData, wash_date: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Start Time *</label>
                  <input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Time *</label>
                  <input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} required style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes (Optional)</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} style={{ ...inputStyle, minHeight: 50, resize: 'vertical' }} placeholder="Additional notes about the wash..." />
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>Cancel</button>
                <button type="submit" disabled={createMutation.isPending} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>Save Wash Log</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ overflowX: 'auto', maxHeight: 300, border: '1px solid hsl(220,18%,82%)', borderRadius: '2px' }}>
          <table style={{ width: '100%', fontSize: '10px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(140,55%,30%)', color: 'white', position: 'sticky', top: 0 }}>
                {['Date', 'Bus #', 'Washer', 'Start', 'End', 'Hours', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '5px 7px', textAlign: 'left', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {washRecords.slice(0, 50).map((record, i) => (
                <tr key={record.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                  <td style={{ padding: '4px 7px' }}>{record.wash_date}</td>
                  <td style={{ padding: '4px 7px' }}>{record.bus_number}</td>
                  <td style={{ padding: '4px 7px' }}>{record.washer_name}</td>
                  <td style={{ padding: '4px 7px' }}>{record.start_time}</td>
                  <td style={{ padding: '4px 7px' }}>{record.end_time}</td>
                  <td style={{ padding: '4px 7px', fontWeight: '700', color: 'hsl(140,55%,40%)' }}>{(record.elapsed_time_minutes / 60).toFixed(2)} hrs</td>
                  <td style={{ padding: '4px 7px', fontSize: '9px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}