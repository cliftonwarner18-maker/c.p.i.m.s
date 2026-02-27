import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import LoadingScreen from '../components/LoadingScreen';
import { Plus, Trash2, Pencil } from 'lucide-react';

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', active: true });

  const { data: systemUsers = [], isLoading } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemUser.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemUsers'] });
      setFormData({ name: '', role: '', active: true });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SystemUser.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemUsers'] });
      setEditUser(null);
      setFormData({ name: '', role: '', active: true });
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemUser.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systemUsers'] }),
  });

  const handleSubmit = () => {
    if (editUser) {
      updateMutation.mutate({ id: editUser.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({ name: user.name || '', role: user.role || '', active: user.active !== false });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditUser(null);
    setFormData({ name: '', role: '', active: true });
  };

  return (
    <>
      <LoadingScreen isLoading={isLoading} message="LOADING ADMIN PANEL..." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

        {/* User Form */}
        {showForm && (
          <WinWindow title={editUser ? `EDIT USER — ${editUser.name}` : 'ADD NEW SYSTEM USER'} icon="👤">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>NAME:</label>
                <input className="win-input" style={{ width: '100%' }} value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>ROLE / TITLE:</label>
                <input className="win-input" style={{ width: '100%' }} value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Technician, Supervisor" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="activeCheck" checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                <label htmlFor="activeCheck" style={{ fontSize: '11px', fontWeight: 'bold' }}>ACTIVE</label>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button className="win-button" style={{ flex: 1, background: 'hsl(220,70%,35%)', color: 'white' }}
                  onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {editUser ? 'SAVE CHANGES' : 'ADD USER'}
                </button>
                <button className="win-button" style={{ flex: 1 }} onClick={handleCancel}>CANCEL</button>
              </div>
            </div>
          </WinWindow>
        )}

        {/* System Users List */}
        <WinWindow title="SYSTEM USER MANAGEMENT" icon="🛡️">
          <div style={{ marginBottom: '6px' }}>
            <button className="win-button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: 'hsl(220,70%,35%)', color: 'white' }}
              onClick={() => { setEditUser(null); setFormData({ name: '', role: '', active: true }); setShowForm(true); }}>
              <Plus className="w-3 h-3" /> ADD USER
            </button>
          </div>
          <div className="win-panel-inset" style={{ maxHeight: '600px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
              <thead>
                <tr style={{ background: 'hsl(0,65%,35%)', color: 'white', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '4px', textAlign: 'left' }}>NAME</th>
                  <th style={{ padding: '4px', textAlign: 'left' }}>ROLE / TITLE</th>
                  <th style={{ padding: '4px', textAlign: 'left' }}>STATUS</th>
                  <th style={{ padding: '4px', textAlign: 'left' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {systemUsers.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,40%)' }}>NO USERS FOUND</td></tr>
                )}
                {systemUsers.map((u, i) => (
                  <tr key={u.id} style={{ backgroundColor: i % 2 === 0 ? 'hsl(220,15%,96%)' : 'hsl(220,20%,92%)', height: '26px' }}>
                    <td style={{ padding: '0 4px', fontWeight: 'bold' }}>{u.name}</td>
                    <td style={{ padding: '0 4px' }}>{u.role || '-'}</td>
                    <td style={{ padding: '0 4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: u.active !== false ? 'hsl(140,60%,30%)' : 'hsl(0,60%,40%)' }}>
                        {u.active !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '0 4px', display: 'flex', gap: '2px', alignItems: 'center' }}>
                      <button className="win-button"
                        style={{ padding: '0 4px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                        onClick={() => handleEdit(u)} title="Edit">
                        <Pencil className="w-3 h-3" /> EDIT
                      </button>
                      <button className="win-button"
                        style={{ padding: '0 2px', fontSize: '10px', display: 'inline-flex', alignItems: 'center' }}
                        onClick={() => { if (confirm(`Delete user "${u.name}"?`)) deleteMutation.mutate(u.id); }} title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '10px', color: 'hsl(220,10%,40%)', marginTop: '2px' }}>
            TOTAL USERS: {systemUsers.length}
          </div>
        </WinWindow>
      </div>
    </>
  );
}