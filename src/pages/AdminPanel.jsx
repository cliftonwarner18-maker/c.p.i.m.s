import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Plus, Trash2, Pencil, ShieldAlert } from 'lucide-react';

const FF = "'Courier Prime', monospace";
const inputStyle = { width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px', letterSpacing: '0.05em' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', fontSize: '11px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: '', active: true });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: systemUsers = [], isLoading } = useQuery({ queryKey: ['systemUsers'], queryFn: () => base44.entities.SystemUser.list('name') });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemUser.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['systemUsers'] }); setFormData({ name: '', role: '', active: true }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SystemUser.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['systemUsers'] }); setEditUser(null); setFormData({ name: '', role: '', active: true }); setShowForm(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemUser.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systemUsers'] }),
  });

  const handleSubmit = () => { editUser ? updateMutation.mutate({ id: editUser.id, data: formData }) : createMutation.mutate(formData); };
  const handleEdit = (user) => { setEditUser(user); setFormData({ name: user.name || '', role: user.role || '', active: user.active !== false }); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); setEditUser(null); setFormData({ name: '', role: '', active: true }); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      <LoadingScreen isLoading={isLoading} message="LOADING ADMIN PANEL..." />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        label={deleteTarget ? `user "${deleteTarget.name}"` : ''}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(0,60%,38%), hsl(0,55%,48%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert style={{ width: 18, height: 18 }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>ADMIN PANEL</div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>SYSTEM USER MANAGEMENT</div>
        </div>
      </div>

      {/* User Form */}
      {showForm && (
        <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px' }}>
          <div style={{ background: 'linear-gradient(to right, hsl(0,60%,35%), hsl(0,55%,45%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' }}>
            👤 {editUser ? `EDIT USER — ${editUser.name}` : 'ADD NEW SYSTEM USER'}
          </div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={labelStyle}>NAME:</label>
              <input style={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>ROLE / TITLE:</label>
              <input style={inputStyle} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} placeholder="e.g., Technician, Supervisor" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="activeCheck" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
              <label htmlFor="activeCheck" style={{ fontSize: '11px', fontWeight: '700' }}>ACTIVE</label>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                style={{ ...btnBase, background: 'hsl(220,55%,38%)', color: 'white', borderColor: 'hsl(220,55%,30%)', flex: 1, justifyContent: 'center' }}>
                {editUser ? 'SAVE CHANGES' : 'ADD USER'}
              </button>
              <button onClick={handleCancel} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)', flex: 1, justifyContent: 'center' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ background: 'hsl(220,18%,94%)', padding: '8px 10px', borderBottom: '1px solid hsl(220,18%,78%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em' }}>🛡️ SYSTEM USERS</span>
          <button onClick={() => { setEditUser(null); setFormData({ name: '', role: '', active: true }); setShowForm(true); }}
            style={{ ...btnBase, background: 'hsl(0,60%,42%)', color: 'white', borderColor: 'hsl(0,60%,35%)' }}>
            <Plus style={{ width: 12, height: 12 }} /> ADD USER
          </button>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 560 }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(0,58%,32%)', color: 'white', position: 'sticky', top: 0 }}>
                {['NAME', 'ROLE / TITLE', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {systemUsers.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>NO USERS FOUND</td></tr>
              )}
              {systemUsers.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: '700' }}>{u.name}</td>
                  <td style={{ padding: '6px 8px' }}>{u.role || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: u.active !== false ? 'hsl(140,55%,30%)' : 'hsl(0,60%,40%)' }}>
                      {u.active !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      <button onClick={() => handleEdit(u)} style={{ ...btnBase, padding: '2px 8px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>
                        <Pencil style={{ width: 11, height: 11 }} /> EDIT
                      </button>
                      <button onClick={() => setDeleteTarget(u)} style={{ ...btnBase, padding: '2px 6px', background: 'hsl(0,65%,45%)', color: 'white', borderColor: 'hsl(0,65%,38%)' }}>
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '5px 10px', fontSize: '10px', color: 'hsl(220,10%,45%)', borderTop: '1px solid hsl(220,18%,90%)', background: 'hsl(220,18%,97%)' }}>
          TOTAL USERS: {systemUsers.length}
        </div>
      </div>
    </div>
  );
}