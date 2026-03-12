import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Clock } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' };

export default function ManualServiceLogForm({ users: propUsers = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ bus_number: '', technician: '', description: '', service_date: '', start_time: '', end_time: '' });
  const queryClient = useQueryClient();

  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list('bus_number') });
  const { data: logs = [] } = useQuery({ queryKey: ['busHistory'], queryFn: () => base44.entities.BusHistory.list('-created_date') });
  const { data: systemUsers = [] } = useQuery({ queryKey: ['systemUsers'], queryFn: () => base44.entities.SystemUser.list('name') });

  // Use system users from database, fall back to prop users
  const users = systemUsers.length > 0 ? systemUsers : propUsers;

  const createMutation = useMutation({
    mutationFn: (data) => {
      const startDateTime = `${data.service_date}T${data.start_time}`;
      const endDateTime = `${data.service_date}T${data.end_time}`;
      const elapsed = startDateTime && endDateTime
        ? Math.round((new Date(endDateTime) - new Date(startDateTime)) / 60000)
        : 0;
      return base44.entities.BusHistory.create({ 
        bus_number: data.bus_number,
        technician: data.technician,
        description: data.description,
        start_time: startDateTime,
        end_time: endDateTime,
        elapsed_minutes: elapsed 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busHistory'] });
      setForm({ bus_number: '', technician: '', description: '', service_date: '', start_time: '', end_time: '' });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BusHistory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['busHistory'] }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm({ bus_number: '', technician: '', description: '', service_date: '', start_time: '', end_time: '' });
  };

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(200,70%,35%), hsl(200,65%,45%))', color: 'white', padding: '8px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock style={{ width: 14, height: 14 }} /> MANUAL SERVICE LOG
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{ ...btnBase, justifyContent: 'center' }}>
            <Plus style={{ width: 13, height: 13 }} /> ADD SERVICE LOG ENTRY
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>BUS # *</label>
                <select style={inputStyle} value={form.bus_number} onChange={e => setForm({ ...form, bus_number: e.target.value })} required>
                  <option value="">-- SELECT BUS --</option>
                  {buses.map(b => <option key={b.id} value={b.bus_number}>#{b.bus_number}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>TECHNICIAN *</label>
                <select style={inputStyle} value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} required>
                  <option value="">-- SELECT TECHNICIAN --</option>
                  {users.filter(u => u.active !== false).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>DESCRIPTION *</label>
              <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What work was performed..." required />
            </div>
            <div>
              <label style={labelStyle}>SERVICE DATE * (official date of service — for records/hours)</label>
              <input type="date" style={inputStyle} value={form.service_date} onChange={e => setForm({ ...form, service_date: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>START TIME * (HH:MM)</label>
                <input type="time" style={inputStyle} value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>END TIME * (HH:MM)</label>
                <input type="time" style={inputStyle} value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleCancel} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)' }}>CANCEL</button>
              <button type="submit" disabled={createMutation.isPending} style={{ ...btnBase }}>
                {createMutation.isPending ? 'SAVING...' : 'SAVE ENTRY'}
              </button>
            </div>
          </form>
        )}

        {logs.length > 0 && (
          <div style={{ overflowX: 'auto', maxHeight: 300, border: '1px solid hsl(220,18%,82%)', borderRadius: '2px' }}>
            <table style={{ width: '100%', fontSize: '10px', fontFamily: FF, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'hsl(200,60%,30%)', color: 'white', position: 'sticky', top: 0 }}>
                  {['BUS #', 'TECHNICIAN', 'DESCRIPTION', 'START', 'END', 'MINUTES', 'ACTIONS'].map(h => (
                    <th key={h} style={{ padding: '5px 7px', textAlign: 'left', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                    <td style={{ padding: '4px 7px', fontWeight: '700' }}>{log.bus_number}</td>
                    <td style={{ padding: '4px 7px' }}>{log.technician}</td>
                    <td style={{ padding: '4px 7px' }}>{log.description?.substring(0, 20)}</td>
                    <td style={{ padding: '4px 7px', whiteSpace: 'nowrap', fontSize: '9px' }}>{log.start_time ? moment(log.start_time).format('MM/DD HH:mm') : '—'}</td>
                    <td style={{ padding: '4px 7px', whiteSpace: 'nowrap', fontSize: '9px' }}>{log.end_time ? moment(log.end_time).format('MM/DD HH:mm') : '—'}</td>
                    <td style={{ padding: '4px 7px', fontWeight: '700', color: 'hsl(220,60%,40%)' }}>{log.elapsed_minutes || 0}</td>
                    <td style={{ padding: '4px 7px' }}>
                      <button onClick={() => deleteMutation.mutate(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0,65%,45%)' }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}