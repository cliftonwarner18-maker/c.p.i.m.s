import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Plus, Pencil, Trash2, UserCheck, UserX, Save, X, Clock, FileDown } from 'lucide-react';
import moment from 'moment';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };

const BLANK = { name: '', role: '', active: true };

function TechHoursReport({ users }) {
  const [selectedTech, setSelectedTech] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: workOrders = [] } = useQuery({
    queryKey: ['allWorkOrdersForReport'],
    queryFn: () => base44.entities.WorkOrder.list(),
  });

  const filtered = workOrders.filter(wo => {
    if (!wo.elapsed_time_minutes || wo.status !== 'Completed') return false;
    if (selectedTech && wo.technician_name !== selectedTech) return false;
    if (startDate && wo.completed_date && wo.completed_date < new Date(startDate).toISOString()) return false;
    if (endDate && wo.completed_date && wo.completed_date > new Date(endDate + 'T23:59:59').toISOString()) return false;
    return true;
  });

  const totalMinutes = filtered.reduce((sum, wo) => sum + (wo.elapsed_time_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const handleExport = async () => {
    setExporting(true);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 40;

    doc.setFillColor(31, 62, 120);
    doc.rect(0, 0, W, 65, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text('NEW HANOVER COUNTY SCHOOLS', margin, 22);
    doc.setFontSize(10);
    doc.text('Transportation — Vehicle Surveillance System', margin, 38);
    doc.setFontSize(12);
    doc.text('TECHNICIAN HOURS REPORT', W - margin, 30, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`Generated: ${moment().format('MM/DD/YYYY HH:mm')}`, W - margin, 44, { align: 'right' });
    y = 80;

    doc.setFillColor(240, 244, 250);
    doc.setDrawColor(180, 180, 210);
    doc.rect(margin, y, W - margin * 2, 48, 'FD');
    doc.setTextColor(30, 40, 80);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(`TECHNICIAN: ${selectedTech || 'ALL TECHNICIANS'}`, margin + 10, y + 16);
    doc.text(`DATE RANGE: ${startDate || 'All'} — ${endDate || 'All'}`, margin + 10, y + 30);
    doc.text(`TOTAL ORDERS: ${filtered.length}   |   TOTAL HOURS: ${totalHours} hrs (${totalMinutes} min)`, margin + 10, y + 44);
    y += 58;

    doc.setFillColor(31, 62, 120);
    doc.rect(margin, y, W - margin * 2, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    const cols = [margin + 5, margin + 70, margin + 140, margin + 220, margin + 310, margin + 390];
    ['ORDER #', 'BUS #', 'DATE', 'TECHNICIAN', 'ELAPSED', 'STATUS'].forEach((h, i) => doc.text(h, cols[i], y + 12));
    y += 22;

    filtered.sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date)).forEach((wo, idx) => {
      if (y > doc.internal.pageSize.getHeight() - 60) { doc.addPage(); y = 40; }
      doc.setFillColor(idx % 2 === 0 ? 255 : 245, idx % 2 === 0 ? 255 : 247, idx % 2 === 0 ? 255 : 252);
      doc.rect(margin, y - 10, W - margin * 2, 14, 'F');
      doc.setTextColor(30, 30, 30);
      doc.setFont('courier', 'normal');
      doc.setFontSize(9);
      const elMin = wo.elapsed_time_minutes || 0;
      const elStr = `${Math.floor(elMin / 60)}h ${elMin % 60}m`;
      doc.text(wo.order_number || '—', cols[0], y);
      doc.text(wo.bus_number || '—', cols[1], y);
      doc.text(wo.completed_date ? moment(wo.completed_date).format('MM/DD/YY') : '—', cols[2], y);
      doc.text((wo.technician_name || '—').substring(0, 18), cols[3], y);
      doc.text(elStr, cols[4], y);
      doc.text(wo.status || '—', cols[5], y);
      y += 14;
    });

    y += 10;
    doc.setDrawColor(100, 100, 100);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 62, 120);
    doc.text(`TOTAL: ${totalHours} hours (${totalMinutes} minutes) across ${filtered.length} work orders`, margin, y);

    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.setFont('courier', 'normal');
    doc.text('NHCS Transportation — Vehicle Surveillance System | Powered by Base44', W / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
    doc.save(`TechHours_${selectedTech || 'All'}_${moment().format('YYYYMMDD')}.pdf`);
    setExporting(false);
  };

  const FF2 = "'Courier Prime', monospace";
  const inp = { padding: '5px 8px', fontSize: '11px', fontFamily: FF2, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(30,60%,32%), hsl(30,55%,42%))', color: 'white', padding: '8px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock style={{ width: 14, height: 14 }} /> TECHNICIAN HOURS REPORT
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: 3 }}>TECHNICIAN</div>
            <select value={selectedTech} onChange={e => setSelectedTech(e.target.value)} style={{ ...inp, minWidth: 180 }}>
              <option value="">All Technicians</option>
              {users.filter(u => u.active !== false).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: 3 }}>FROM DATE</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} />
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: 3 }}>TO DATE</div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inp} />
          </div>
          <button onClick={handleExport} disabled={exporting || filtered.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF2, fontWeight: '700', cursor: 'pointer' }}>
            <FileDown style={{ width: 13, height: 13 }} /> {exporting ? 'EXPORTING...' : 'EXPORT PDF'}
          </button>
        </div>
        <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', padding: '8px 12px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '11px' }}>
          <span><strong>{filtered.length}</strong> work orders</span>
          <span><strong>{totalHours}</strong> total hours</span>
          <span><strong>{totalMinutes}</strong> total minutes</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SystemUser.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['systemUsers'] }); setShowForm(false); setForm(BLANK); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SystemUser.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['systemUsers'] }); setEditTarget(null); setForm(BLANK); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SystemUser.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['systemUsers'] }); setDeleteTarget(null); },
  });

  const openEdit = (u) => { setEditTarget(u); setForm({ name: u.name, role: u.role || '', active: u.active !== false }); setShowForm(false); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editTarget) updateMutation.mutate({ id: editTarget.id, data: form });
    else createMutation.mutate(form);
  };
  const cancel = () => { setShowForm(false); setEditTarget(null); setForm(BLANK); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        label={deleteTarget ? `User "${deleteTarget.name}"` : ''}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(0,55%,35%), hsl(0,50%,45%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>ADMIN — USER MANAGEMENT</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>System users for drop-down fields — {users.length} USERS</div>
          </div>
        </div>
        {!showForm && !editTarget && (
          <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '600', cursor: 'pointer' }}>
            <Plus style={{ width: 13, height: 13 }} /> ADD USER
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(showForm || editTarget) && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', color: 'hsl(220,20%,25%)', marginBottom: '12px', borderBottom: '1px solid hsl(220,18%,88%)', paddingBottom: '6px' }}>
            {editTarget ? `EDIT USER — ${editTarget.name}` : 'ADD NEW SYSTEM USER'}
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <div style={{ flex: '1', minWidth: '180px' }}>
                <label style={labelStyle}>FULL NAME *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="First Last" style={inputStyle} />
              </div>
              <div style={{ flex: '1', minWidth: '180px' }}>
                <label style={labelStyle}>ROLE / TITLE</label>
                <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Technician, Driver" style={inputStyle} />
              </div>
              <div style={{ minWidth: '120px' }}>
                <label style={labelStyle}>STATUS</label>
                <select value={form.active ? 'true' : 'false'} onChange={e => setForm({ ...form, active: e.target.value === 'true' })} style={inputStyle}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 16px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
                <Save style={{ width: 12, height: 12 }} /> {editTarget ? 'SAVE CHANGES' : 'CREATE USER'}
              </button>
              <button type="button" onClick={cancel} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>
                <X style={{ width: 12, height: 12 }} /> CANCEL
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hours Report */}
      <TechHoursReport users={users} />

      {/* User Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: '11px', fontFamily: FF, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white' }}>
              {['NAME', 'ROLE / TITLE', 'STATUS', 'ACTIONS'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>LOADING...</td></tr>}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>NO USERS — ADD YOUR FIRST USER ABOVE</td></tr>
            )}
            {users.map((u, i) => (
              <tr key={u.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,15%,97%)', borderBottom: '1px solid hsl(220,18%,88%)' }}>
                <td style={{ padding: '6px 10px', fontWeight: '700' }}>{u.name}</td>
                <td style={{ padding: '6px 10px', color: 'hsl(220,10%,40%)' }}>{u.role || '—'}</td>
                <td style={{ padding: '6px 10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '2px', fontSize: '10px', fontWeight: '700', background: u.active !== false ? '#f0fdf4' : '#fef2f2', color: u.active !== false ? '#166534' : '#991b1b', border: `1px solid ${u.active !== false ? '#bbf7d0' : '#fecaca'}` }}>
                    {u.active !== false ? <UserCheck style={{ width: 10, height: 10 }} /> : <UserX style={{ width: 10, height: 10 }} />}
                    {u.active !== false ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '6px 10px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => openEdit(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', fontSize: '10px', fontFamily: FF, background: 'hsl(220,18%,88%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', cursor: 'pointer' }}>
                      <Pencil style={{ width: 11, height: 11 }} /> EDIT
                    </button>
                    <button onClick={() => setDeleteTarget(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', fontSize: '10px', fontFamily: FF, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '2px', cursor: 'pointer' }}>
                      <Trash2 style={{ width: 11, height: 11 }} /> DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '5px 10px', background: 'hsl(220,18%,96%)', borderTop: '1px solid hsl(220,18%,82%)', fontSize: '10px', color: 'hsl(220,10%,45%)' }}>
          {users.filter(u => u.active !== false).length} ACTIVE / {users.length} TOTAL SYSTEM USERS
        </div>
      </div>
    </div>
  );
}