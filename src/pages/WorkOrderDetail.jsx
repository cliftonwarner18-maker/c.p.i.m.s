import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Clock, Save, CheckCircle, XCircle, Printer } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";

const STATUS_COLORS = {
  Pending:     { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  'In Progress': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  Completed:   { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  Cancelled:   { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };
const rowStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' };
const fieldStyle = { flex: '1', minWidth: '160px' };

function SectionHeader({ title }) {
  return (
    <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '10px', borderRadius: '2px' }}>
      {title}
    </div>
  );
}

export default function WorkOrderDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: workOrder, isLoading } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => base44.entities.WorkOrder.filter({ id }),
    select: (data) => data[0],
    enabled: !!id,
  });

  const [form, setForm] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);

  React.useEffect(() => {
    if (workOrder && !form) {
      setForm({ ...workOrder });
    }
  }, [workOrder]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', id] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const handleComplete = () => {
    const now = new Date().toISOString();
    const elapsed = form.repair_start_time ? Math.round((new Date() - new Date(form.repair_start_time)) / 60000) : form.elapsed_time_minutes || 0;
    const updated = { ...form, status: 'Completed', repair_end_time: now, elapsed_time_minutes: elapsed, completed_date: now };
    setForm(updated);
    updateMutation.mutate(updated);
  };

  const handleStartTimer = () => {
    const now = new Date().toISOString();
    setStartTime(now);
    setTimerRunning(true);
    const updated = { ...form, status: 'In Progress', repair_start_time: now };
    setForm(updated);
    updateMutation.mutate(updated);
  };

  const handleStopTimer = () => {
    const now = new Date().toISOString();
    const start = startTime || form.repair_start_time;
    const elapsed = start ? Math.round((new Date() - new Date(start)) / 60000) : 0;
    setTimerRunning(false);
    const updated = { ...form, repair_end_time: now, elapsed_time_minutes: elapsed };
    setForm(updated);
    updateMutation.mutate(updated);
  };

  if (isLoading || !form) return (
    <div style={{ fontFamily: FF }}>
      <LoadingScreen isLoading={true} message="LOADING WORK ORDER..." />
    </div>
  );

  if (!workOrder) return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: FF, color: 'hsl(220,10%,45%)' }}>
      WORK ORDER NOT FOUND
      <div style={{ marginTop: 12 }}><Link to={createPageUrl('WorkOrders')} style={{ color: 'hsl(220,55%,40%)' }}>← BACK TO WORK ORDERS</Link></div>
    </div>
  );

  const sc = STATUS_COLORS[form.status] || { bg: '#f5f5f5', color: '#444', border: '#ddd' };
  const elapsed = form.elapsed_time_minutes ? `${Math.floor(form.elapsed_time_minutes / 60)}h ${form.elapsed_time_minutes % 60}m` : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>WORK ORDER — {form.order_number}</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>BUS #{form.bus_number} | CREATED {moment(form.created_date).format('MM/DD/YYYY HH:mm')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: '2px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
            {form.status?.toUpperCase()}
          </span>
          <Link to={createPageUrl('WorkOrders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, textDecoration: 'none' }}>
            <ArrowLeft style={{ width: 12, height: 12 }} /> BACK
          </Link>
        </div>
      </div>

      {/* Timer Controls */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <Clock style={{ width: 16, height: 16, color: 'hsl(220,50%,40%)' }} />
        <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: 'hsl(220,20%,25%)' }}>REPAIR TIMER:</span>
        {form.repair_start_time && <span style={{ fontSize: '11px', color: 'hsl(220,10%,40%)' }}>STARTED: {moment(form.repair_start_time).format('MM/DD HH:mm')}</span>}
        {form.elapsed_time_minutes > 0 && <span style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,55%,40%)' }}>ELAPSED: {elapsed}</span>}
        {!timerRunning && form.status !== 'Completed' && (
          <button onClick={handleStartTimer} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
            <Clock style={{ width: 12, height: 12 }} /> START TIMER
          </button>
        )}
        {timerRunning && (
          <button onClick={handleStopTimer} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'hsl(0,65%,45%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
            STOP TIMER
          </button>
        )}
        {form.status !== 'Completed' && (
          <button onClick={handleComplete} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer', marginLeft: 'auto' }}>
            <CheckCircle style={{ width: 12, height: 12 }} /> MARK COMPLETE
          </button>
        )}
        <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>
          <Printer style={{ width: 12, height: 12 }} /> PRINT
        </button>
      </div>

      {/* Form Sections */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px' }}>
        <SectionHeader title="WORK ORDER DETAILS" />
        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>ORDER #</label>
            <input value={form.order_number || ''} readOnly style={{ ...inputStyle, background: 'hsl(220,10%,96%)', color: 'hsl(220,10%,45%)' }} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>BUS #</label>
            <input value={form.bus_number || ''} onChange={e => setForm({ ...form, bus_number: e.target.value })} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>STATUS</label>
            <select value={form.status || 'Pending'} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle }}>
              {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>REPORTED BY</label>
            <input value={form.reported_by || ''} onChange={e => setForm({ ...form, reported_by: e.target.value })} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>TECHNICIAN</label>
            <input value={form.technician_name || ''} onChange={e => setForm({ ...form, technician_name: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>ISSUE DESCRIPTION</label>
          <textarea value={form.issue_description || ''} onChange={e => setForm({ ...form, issue_description: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <SectionHeader title="REPAIR INFORMATION" />
        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>REPAIR START TIME</label>
            <input value={form.repair_start_time || ''} onChange={e => setForm({ ...form, repair_start_time: e.target.value })} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>REPAIR END TIME</label>
            <input value={form.repair_end_time || ''} onChange={e => setForm({ ...form, repair_end_time: e.target.value })} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>ELAPSED (MINUTES)</label>
            <input type="number" value={form.elapsed_time_minutes || ''} onChange={e => setForm({ ...form, elapsed_time_minutes: parseFloat(e.target.value) || 0 })} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>REPAIRS RENDERED</label>
          <textarea value={form.repairs_rendered || ''} onChange={e => setForm({ ...form, repairs_rendered: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button onClick={handleSave} disabled={updateMutation.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '12px', fontFamily: FF, fontWeight: '700', cursor: updateMutation.isPending ? 'default' : 'pointer', letterSpacing: '0.05em' }}>
            <Save style={{ width: 13, height: 13 }} /> {updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  );
}