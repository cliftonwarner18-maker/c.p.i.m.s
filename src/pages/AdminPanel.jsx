import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Plus, Pencil, Trash2, UserCheck, UserX, Save, X, Clock, FileDown } from 'lucide-react';
import moment from 'moment';
import { exportTechHoursPDF } from '../utils/exports/exportTechHours';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import WashBayHoursReport from '../components/admin/WashBayHoursReport';

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

  const { data: inspections = [] } = useQuery({
    queryKey: ['allInspectionsForReport'],
    queryFn: () => base44.entities.Inspection.list(),
  });

  const { data: busHistory = [] } = useQuery({
    queryKey: ['allBusHistoryForReport'],
    queryFn: () => base44.entities.BusHistory.list(),
  });

  const filtered = workOrders.filter(wo => {
    if (!wo.elapsed_time_minutes) return false;
    if (selectedTech && wo.technician_name !== selectedTech) return false;
    if (startDate) {
      const ref = wo.completed_date || wo.updated_date || wo.created_date;
      if (ref && new Date(ref) < new Date(startDate)) return false;
    }
    if (endDate) {
      const ref = wo.completed_date || wo.updated_date || wo.created_date;
      if (ref && new Date(ref) > new Date(endDate + 'T23:59:59')) return false;
    }
    // Include all work order types: Camera, Seat, Radio, Other
    return true;
  });

  const filteredInspections = inspections.filter(insp => {
    if (!insp.elapsed_minutes) return false;
    if (selectedTech && insp.inspector_name !== selectedTech) return false;
    if (startDate) {
      const ref = insp.inspection_date || insp.created_date;
      if (ref && new Date(ref) < new Date(startDate)) return false;
    }
    if (endDate) {
      const ref = insp.inspection_date || insp.created_date;
      if (ref && new Date(ref) > new Date(endDate + 'T23:59:59')) return false;
    }
    return true;
  });

  const filteredBusHistory = busHistory.filter(bh => {
    if (!bh.elapsed_time_minutes) return false;
    if (selectedTech && bh.technician !== selectedTech) return false;
    if (startDate) {
      const ref = bh.start_time || bh.created_date;
      if (ref && new Date(ref) < new Date(startDate)) return false;
    }
    if (endDate) {
      const ref = bh.start_time || bh.created_date;
      if (ref && new Date(ref) > new Date(endDate + 'T23:59:59')) return false;
    }
    return true;
  });

  const totalWorkOrderMinutes = filtered.reduce((sum, wo) => sum + (wo.elapsed_time_minutes || 0), 0);
  const totalInspectionMinutes = filteredInspections.reduce((sum, insp) => sum + (insp.elapsed_minutes || 0), 0);
  const totalBusHistoryMinutes = filteredBusHistory.reduce((sum, bh) => sum + (bh.elapsed_time_minutes || 0), 0);
  const totalMinutes = totalWorkOrderMinutes + totalInspectionMinutes + totalBusHistoryMinutes;
  const totalHours = (totalMinutes / 60).toFixed(2);

  const handleExport = () => {
    if (filtered.length + filteredInspections.length + filteredBusHistory.length === 0) return;
    setExporting(true);
    try {
      const allItems = [
        ...filtered.map(wo => ({ order_number: wo.order_number, bus_number: wo.bus_number, wo_type: wo.work_order_type || '—', tech: wo.technician_name, elapsed: wo.elapsed_time_minutes || 0, dateRef: wo.completed_date || wo.updated_date || wo.created_date, start: wo.repair_start_time, end: wo.repair_end_time })),
        ...filteredInspections.map(insp => ({ order_number: insp.inspection_number, bus_number: insp.bus_number, wo_type: 'INSP', tech: insp.inspector_name, elapsed: insp.elapsed_minutes || 0, dateRef: insp.inspection_date || insp.created_date, start: insp.inspection_start_time, end: insp.inspection_end_time })),
        ...filteredBusHistory.map(bh => ({ order_number: 'SVC-LOG', bus_number: bh.bus_number, wo_type: '—', tech: bh.technician, elapsed: bh.elapsed_time_minutes || 0, dateRef: bh.start_time || bh.created_date, start: bh.start_time, end: bh.end_time })),
      ].sort((a, b) => new Date(a.dateRef || '') - new Date(b.dateRef || ''));
      exportTechHoursPDF({ allItems, selectedTech, startDate, endDate, totalMinutes });
    } finally {
      setExporting(false);
    }
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
          <button onClick={handleExport} disabled={exporting || (filtered.length + filteredInspections.length + filteredBusHistory.length === 0)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF2, fontWeight: '700', cursor: 'pointer' }}>
            <FileDown style={{ width: 13, height: 13 }} /> {exporting ? 'EXPORTING...' : 'EXPORT PDF'}
          </button>
        </div>
        <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', padding: '8px 12px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '11px' }}>
          <span><strong>{filtered.length}</strong> work orders + <strong>{filteredInspections.length}</strong> inspections + <strong>{filteredBusHistory.length}</strong> manual logs</span>
          <span style={{ borderLeft: '1px solid hsl(220,18%,70%)', paddingLeft: '12px', fontWeight: '700' }}>TOTAL: <strong style={{ color: 'hsl(220,60%,40%)' }}>{totalHours} hours</strong> ({totalMinutes} min)</span>
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

      {/* Hours Reports */}
      <TechHoursReport users={users} />
      <WashBayHoursReport />

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