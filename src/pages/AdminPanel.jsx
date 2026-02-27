import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import { Plus, Trash2, Pencil, ShieldAlert } from 'lucide-react';

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const { data: systemUsers = [], isLoading } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemUser.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemUsers'] });
      setName(''); setRole(''); setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SystemUser.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemUsers'] });
      setEditingUser(null); setName(''); setRole(''); setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemUser.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systemUsers'] }),
  });

  const startEdit = (u) => { setEditingUser(u); setName(u.name); setRole(u.role || ''); setShowForm(true); };
  const cancel = () => { setEditingUser(null); setName(''); setRole(''); setShowForm(false); };
  const save = () => {
    if (!name.trim()) return;
    if (editingUser) updateMutation.mutate({ id: editingUser.id, data: { name: name.trim(), role: role.trim(), active: true } });
    else createMutation.mutate({ name: name.trim(), role: role.trim(), active: true });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Red admin header */}
      <div style={{ border: '3px solid', borderColor: 'hsl(0,15%,40%) hsl(0,60%,25%) hsl(0,60%,25%) hsl(0,15%,40%)' }}>
        <div style={{ background: 'linear-gradient(to right, hsl(0,75%,28%), hsl(0,65%,40%))', color: 'white', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Courier Prime', monospace", fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.1em' }}>
          <ShieldAlert style={{ width: 18, height: 18 }} />
          ADMIN PANEL — AUTHORIZED PERSONNEL MANAGEMENT
        </div>
        <div style={{ background: 'hsl(0,25%,95%)', padding: '4px 10px', fontSize: '9px', color: 'hsl(0,60%,30%)', fontFamily: "'Courier Prime', monospace", fontWeight: 'bold' }}>
          RESTRICTED ACCESS — Users added here appear in all staff dropdowns system-wide.
        </div>
      </div>

      <WinWindow title="SYSTEM USERS ROSTER" icon="👤">
        <div style={{ marginBottom: '8px' }}>
          {!showForm ? (
            <button className="win-button" style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'hsl(0,65%,40%)', color: 'white' }}
              onClick={() => setShowForm(true)}>
              <Plus style={{ width: 12, height: 12 }} /> ADD NEW USER
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', flexWrap: 'wrap', padding: '6px', background: 'hsl(0,25%,95%)', border: '2px solid', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)', marginBottom: '6px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block' }}>FULL NAME:</label>
                <input className="win-input" style={{ fontSize: '11px', width: '160px' }} placeholder="e.g. John Smith" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block' }}>ROLE / TITLE (optional):</label>
                <input className="win-input" style={{ fontSize: '11px', width: '160px' }} placeholder="e.g. Fleet Technician" value={role} onChange={e => setRole(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="win-button" style={{ fontSize: '11px', background: 'hsl(220,70%,35%)', color: 'white' }} onClick={save}>
                  {editingUser ? 'UPDATE' : 'SAVE'}
                </button>
                <button className="win-button" style={{ fontSize: '11px' }} onClick={cancel}>CANCEL</button>
              </div>
            </div>
          )}
        </div>

        <div className="win-panel-inset" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
            <thead>
              <tr style={{ background: 'hsl(0,65%,35%)', color: 'white', position: 'sticky', top: 0 }}>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>NAME</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>ROLE / TITLE</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>STATUS</th>
                <th style={{ padding: '4px 8px', textAlign: 'left' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center' }}>LOADING...</td></tr>
              )}
              {!isLoading && systemUsers.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,40%)' }}>NO USERS DEFINED</td></tr>
              )}
              {systemUsers.map((u, i) => (
                <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? 'hsl(220,15%,96%)' : 'hsl(220,20%,92%)' }}>
                  <td style={{ padding: '4px 8px', fontWeight: 'bold' }}>{u.name}</td>
                  <td style={{ padding: '4px 8px', color: 'hsl(220,10%,40%)' }}>{u.role || '-'}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <span style={{ background: u.active !== false ? 'hsl(140,60%,35%)' : 'hsl(0,60%,45%)', color: 'white', fontSize: '9px', padding: '1px 6px', fontWeight: 'bold' }}>
                      {u.active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '4px 8px', display: 'flex', gap: '4px' }}>
                    <button className="win-button" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '2px' }} onClick={() => startEdit(u)}>
                      <Pencil style={{ width: 10, height: 10 }} /> EDIT
                    </button>
                    <button className="win-button" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '2px', color: 'hsl(0,60%,40%)' }}
                      onClick={() => { if (confirm(`Remove ${u.name} from roster?`)) deleteMutation.mutate(u.id); }}>
                      <Trash2 style={{ width: 10, height: 10 }} /> REMOVE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: '10px', color: 'hsl(220,10%,40%)', marginTop: '4px' }}>
          TOTAL USERS: {systemUsers.length}
        </div>
      </WinWindow>
    </div>
  );
}