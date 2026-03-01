import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Clock, Save, CheckCircle, FileDown, Play, Square } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const roStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', background: 'hsl(220,12%,96%)', color: 'hsl(220,10%,35%)', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };
const rowStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' };
const fieldStyle = { flex: '1', minWidth: '160px' };

const STATUS_COLORS = {
  Pending:       { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  'In Progress': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  Completed:     { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  Cancelled:     { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

function SectionHeader({ title, color }) {
  return (
    <div style={{ background: color || 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '10px', marginTop: '4px', borderRadius: '2px' }}>
      {title}
    </div>
  );
}

function elapsedDisplay(minutes) {
  if (!minutes || minutes <= 0) return '00:00';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function WorkOrderDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const queryClient = useQueryClient();
  const timerRef = useRef(null);

  const { data: workOrder, isLoading } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => base44.entities.WorkOrder.list().then(list => list.find(w => w.id === id)),
    enabled: !!id,
  });

  const [form, setForm] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);

  useEffect(() => {
    if (workOrder && !form) setForm({ ...workOrder });
  }, [workOrder]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setLiveSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      queryClient.invalidateQueries({ queryKey: ['workOrder', id] });
    },
  });

  const handleStartTimer = () => {
    const now = new Date().toISOString();
    setLiveSeconds(0);
    setTimerRunning(true);
    const updated = { ...form, status: 'In Progress', repair_start_time: now, repair_end_time: '' };
    setForm(updated);
    updateMutation.mutate(updated);
  };

  const handleStopTimer = () => {
    setTimerRunning(false);
    const now = new Date().toISOString();
    const start = form.repair_start_time;
    const elapsed = start ? Math.round((new Date() - new Date(start)) / 60000) : Math.round(liveSeconds / 60);
    const updated = { ...form, repair_end_time: now, elapsed_time_minutes: elapsed };
    setForm(updated);
    updateMutation.mutate(updated);
  };

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const handleComplete = () => {
    const now = new Date().toISOString();
    let elapsed = form.elapsed_time_minutes || 0;
    if (timerRunning) {
      setTimerRunning(false);
      elapsed = form.repair_start_time ? Math.round((new Date() - new Date(form.repair_start_time)) / 60000) : Math.round(liveSeconds / 60);
    }
    const updated = { ...form, status: 'Completed', repair_end_time: form.repair_end_time || now, elapsed_time_minutes: elapsed, completed_date: now };
    setForm(updated);
    updateMutation.mutate(updated);
  };

  const handleExportPDF = async () => {
    if (!form) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 40;

    doc.setFillColor(31, 62, 120);
    doc.rect(0, 0, W, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(15);
    doc.text('NEW HANOVER COUNTY SCHOOLS', margin, 24);
    doc.setFontSize(11);
    doc.text('Transportation — Vehicle Surveillance System', margin, 40);
    doc.setFontSize(13);
    doc.text('WORK ORDER & REPAIR REPORT', W - margin, 30, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`PRINTED: ${moment().format('MM/DD/YYYY HH:mm')}`, W - margin, 45, { align: 'right' });
    y = 85;

    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(240, 244, 250);
    doc.roundedRect(margin, y, W - margin * 2, 64, 3, 3, 'FD');
    doc.setTextColor(30, 40, 80);
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text(`ORDER #: ${form.order_number || '—'}`, margin + 10, y + 16);
    doc.text(`BUS #: ${form.bus_number || '—'}`, margin + 10, y + 30);
    doc.text(`LOT: ${form.lot || '—'}`, margin + 10, y + 44);
    doc.text(`STATUS: ${(form.status || '').toUpperCase()}`, W / 2 + 10, y + 16);
    doc.text(`REPORTED BY: ${form.reported_by || '—'}`, W / 2 + 10, y + 30);
    doc.text(`DATE OPENED: ${moment(form.created_date).format('MM/DD/YYYY HH:mm')}`, W / 2 + 10, y + 44);
    y += 74;

    doc.setFillColor(31, 62, 120);
    doc.rect(margin, y, W - margin * 2, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text('INITIAL COMPLAINT / ISSUE DESCRIPTION', margin + 6, y + 12);
    y += 22;
    doc.setTextColor(30, 30, 30);
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    const issueLines = doc.splitTextToSize(form.issue_description || 'None recorded.', W - margin * 2 - 12);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, W - margin * 2, issueLines.length * 14 + 12, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, y, W - margin * 2, issueLines.length * 14 + 12);
    doc.text(issueLines, margin + 6, y + 12);
    y += issueLines.length * 14 + 20;

    doc.setFillColor(31, 62, 120);
    doc.rect(margin, y, W - margin * 2, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text('REPAIR INFORMATION', margin + 6, y + 12);
    y += 22;
    doc.setFillColor(240, 244, 250);
    doc.rect(margin, y, W - margin * 2, 52, 'FD');
    doc.setTextColor(30, 40, 80);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(`TECHNICIAN: ${form.technician_name || '—'}`, margin + 10, y + 14);
    doc.text(`START TIME: ${form.repair_start_time ? moment(form.repair_start_time).format('MM/DD/YYYY HH:mm') : '—'}`, margin + 10, y + 28);
    doc.text(`END TIME: ${form.repair_end_time ? moment(form.repair_end_time).format('MM/DD/YYYY HH:mm') : '—'}`, margin + 10, y + 42);
    const elMin = form.elapsed_time_minutes || 0;
    const elStr = elMin > 0 ? `${Math.floor(elMin / 60)}h ${elMin % 60}m (${elMin} min)` : '—';
    doc.text(`ELAPSED TIME: ${elStr}`, W / 2 + 10, y + 14);
    if (form.completed_date) doc.text(`COMPLETED: ${moment(form.completed_date).format('MM/DD/YYYY HH:mm')}`, W / 2 + 10, y + 28);
    y += 60;

    doc.setFillColor(31, 62, 120);
    doc.rect(margin, y, W - margin * 2, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text('REPAIRS / REMEDY RENDERED', margin + 6, y + 12);
    y += 22;
    doc.setTextColor(30, 30, 30);
    doc.setFont('courier', 'normal');
    doc.setFontSize(10);
    const repairLines = doc.splitTextToSize(form.repairs_rendered || 'No repairs recorded.', W - margin * 2 - 12);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, W - margin * 2, repairLines.length * 14 + 12, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, y, W - margin * 2, repairLines.length * 14 + 12);
    doc.text(repairLines, margin + 6, y + 12);
    y += repairLines.length * 14 + 24;

    if (y + 80 > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 40; }
    doc.setDrawColor(100, 100, 100);
    doc.setTextColor(80, 80, 80);
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.line(margin, y + 30, margin + 180, y + 30);
    doc.text('Technician Signature', margin, y + 42);
    doc.line(W - margin - 180, y + 30, W - margin, y + 30);
    doc.text('Supervisor Signature', W - margin - 180, y + 42);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('NHCS Transportation — Vehicle Surveillance System | Powered by Base44', W / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
    doc.save(`WorkOrder_${form.order_number || id}.pdf`);
  };

  if (isLoading || !form) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: FF, color: 'hsl(220,10%,45%)', fontSize: '12px' }}>
      LOADING WORK ORDER...
    </div>
  );

  if (!workOrder) return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: FF, color: 'hsl(220,10%,45%)' }}>
      WORK ORDER NOT FOUND
      <div style={{ marginTop: 12 }}>
        <Link to={createPageUrl('WorkOrders')} style={{ color: 'hsl(220,55%,40%)' }}>← BACK TO WORK ORDERS</Link>
      </div>
    </div>
  );

  const sc = STATUS_COLORS[form.status] || { bg: '#f5f5f5', color: '#444', border: '#ddd' };
  const displayElapsedMinutes = timerRunning
    ? (form.elapsed_time_minutes || 0) + liveSeconds / 60
    : (form.elapsed_time_minutes || 0);
  const isCompleted = form.status === 'Completed';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>WORK ORDER — {form.order_number}</div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>BUS #{form.bus_number} | LOT: {form.lot || '—'} | OPENED: {moment(form.created_date).format('MM/DD/YYYY HH:mm')}</div>
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

      {/* PART 1: Read-only complaint */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px' }}>
        <SectionHeader title="PART 1 — INITIAL COMPLAINT (READ ONLY)" />
        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>ORDER #</label>
            <div style={roStyle}>{form.order_number || '—'}</div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>DATE / TIME OPENED</label>
            <div style={roStyle}>{moment(form.created_date).format('MM/DD/YYYY HH:mm')}</div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>LOT</label>
            <div style={roStyle}>{form.lot || '—'}</div>
          </div>
        </div>
        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>REPORTED BY</label>
            <div style={roStyle}>{form.reported_by || '—'}</div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>BUS NUMBER</label>
            <div style={roStyle}>{form.bus_number || '—'}</div>
          </div>
        </div>
        <div>
          <label style={labelStyle}>DESCRIBE ISSUES WITH SYSTEM</label>
          <div style={{ ...roStyle, minHeight: '80px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{form.issue_description || '—'}</div>
        </div>
      </div>

      {/* PART 2: Repair section */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px' }}>
        <SectionHeader title="PART 2 — REPAIR INFORMATION (TECHNICIAN)" color="linear-gradient(to right, hsl(140,50%,28%), hsl(140,45%,38%))" />

        {/* Timer */}
        <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Clock style={{ width: 15, height: 15, color: 'hsl(220,50%,40%)', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em' }}>REPAIR TIMER:</span>
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '22px', color: timerRunning ? 'hsl(140,55%,35%)' : 'hsl(220,20%,30%)', letterSpacing: '0.05em', minWidth: '80px' }}>
            {elapsedDisplay(displayElapsedMinutes)}
          </span>
          <span style={{ fontSize: '10px', color: 'hsl(220,10%,50%)' }}>HH:MM</span>
          {!timerRunning && !isCompleted && (
            <button onClick={handleStartTimer} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
              <Play style={{ width: 11, height: 11 }} /> START TIMER
            </button>
          )}
          {timerRunning && (
            <button onClick={handleStopTimer} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'hsl(0,65%,45%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
              <Square style={{ width: 11, height: 11 }} /> STOP TIMER
            </button>
          )}
        </div>

        {/* Time fields */}
        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>REPAIR START TIME</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="datetime-local"
                value={form.repair_start_time && moment(form.repair_start_time).isValid() ? moment(form.repair_start_time).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={e => {
                  if (!e.target.value) { setForm({ ...form, repair_start_time: '' }); return; }
                  const iso = new Date(e.target.value).toISOString();
                  setForm({ ...form, repair_start_time: iso });
                }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={() => { const now = new Date().toISOString(); setForm({ ...form, repair_start_time: now }); }} style={{ padding: '4px 8px', fontSize: '10px', fontFamily: FF, background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontWeight: '700' }}>NOW</button>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>REPAIR END TIME</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="datetime-local"
                value={form.repair_end_time && moment(form.repair_end_time).isValid() ? moment(form.repair_end_time).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={e => {
                  if (!e.target.value) { setForm({ ...form, repair_end_time: '' }); return; }
                  const endDate = new Date(e.target.value);
                  const startDate = form.repair_start_time ? new Date(form.repair_start_time) : null;
                  const elapsed = startDate && !isNaN(startDate) ? Math.max(0, Math.round((endDate - startDate) / 60000)) : form.elapsed_time_minutes || 0;
                  setForm({ ...form, repair_end_time: endDate.toISOString(), elapsed_time_minutes: elapsed });
                }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={() => {
                const now = new Date();
                const startDate = form.repair_start_time ? new Date(form.repair_start_time) : null;
                const elapsed = startDate && !isNaN(startDate) ? Math.max(0, Math.round((now - startDate) / 60000)) : form.elapsed_time_minutes || 0;
                setForm({ ...form, repair_end_time: now.toISOString(), elapsed_time_minutes: elapsed });
              }} style={{ padding: '4px 8px', fontSize: '10px', fontFamily: FF, background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontWeight: '700' }}>NOW</button>
            </div>
          </div>
          <div style={{ minWidth: '140px' }}>
            <label style={labelStyle}>ELAPSED TIME</label>
            <div style={{ ...roStyle, fontFamily: "'VT323', monospace", fontSize: '18px', color: 'hsl(220,50%,35%)', textAlign: 'center' }}>
              {elapsedDisplay(form.elapsed_time_minutes || 0)} HH:MM
            </div>
          </div>
        </div>

        {/* Technician */}
        <div style={rowStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>TECHNICIAN NAME</label>
            <TechnicianSelect value={form.technician_name || ''} onChange={v => setForm({ ...form, technician_name: v })} />
          </div>
        </div>

        {/* Repairs */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>REPAIRS / REMEDY RENDERED</label>
          <textarea value={form.repairs_rendered || ''} onChange={e => setForm({ ...form, repairs_rendered: e.target.value })} placeholder="Describe all repairs performed in detail..." rows={7} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '12px', borderTop: '1px solid hsl(220,18%,85%)' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button onClick={handleSave} disabled={updateMutation.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
              <Save style={{ width: 12, height: 12 }} /> {updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button onClick={handleExportPDF} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>
              <FileDown style={{ width: 12, height: 12 }} /> EXPORT PDF
            </button>
          </div>
          {!isCompleted && (
            <button onClick={handleComplete} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 20px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '12px', fontFamily: FF, fontWeight: '700', cursor: 'pointer', letterSpacing: '0.05em' }}>
              <CheckCircle style={{ width: 14, height: 14 }} /> COMPLETE & SUBMIT REPAIR
            </button>
          )}
          {isCompleted && (
            <span style={{ fontSize: '11px', color: '#166534', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle style={{ width: 14, height: 14 }} /> COMPLETED — {form.completed_date ? moment(form.completed_date).format('MM/DD/YYYY HH:mm') : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}