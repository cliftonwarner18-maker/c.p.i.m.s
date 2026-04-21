import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Save, CheckCircle, FileDown } from 'lucide-react';
import moment from 'moment';
import { printHtml, PRINT_BASE_CSS } from '../utils/printHtml';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const roStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', background: 'hsl(220,12%,96%)', color: 'hsl(220,10%,35%)', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };
const rowStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' };
const fieldStyle = { flex: '1', minWidth: '160px' };

function TechnicianSelect({ value, onChange }) {
  const { data: users = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });
  const activeUsers = users.filter(u => u.active !== false);
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' }}>
      <option value="">— Select Technician —</option>
      {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` (${u.role})` : ''}</option>)}
      {value && !activeUsers.find(u => u.name === value) && <option value={value}>{value}</option>}
    </select>
  );
}

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
  // no timer ref needed

  const { data: workOrder, isLoading } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => base44.entities.WorkOrder.list().then(list => list.find(w => w.id === id)),
    enabled: !!id,
  });

  const [form, setForm] = useState(null);
  useEffect(() => {
    if (workOrder && !form) setForm({ ...workOrder });
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
    const start = form.repair_start_time ? new Date(form.repair_start_time) : null;
    const end = form.repair_end_time ? new Date(form.repair_end_time) : new Date();
    const elapsed = start && !isNaN(start) ? Math.max(0, Math.round((end - start) / 60000)) : (form.elapsed_time_minutes || 0);
    const updated = { ...form, status: 'Completed', repair_end_time: form.repair_end_time || now, elapsed_time_minutes: elapsed, completed_date: now };
    setForm(updated);
    updateMutation.mutate(updated);
  };

  const handleExportPDF = () => {
    if (!form) return;
    const elMin = form.elapsed_time_minutes || 0;
    const elStr = elMin > 0 ? `${Math.floor(elMin / 60)}h ${elMin % 60}m (${elMin} min)` : '—';

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Work Order ${form.order_number || ''}</title>
    <style>
      ${PRINT_BASE_CSS}
      .wo-meta { display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#edf1fc; border:1px solid #1e3c78; padding:10px 12px; margin-bottom:12px; font-size:10px; }
      .wo-meta b { color:#1e3c78; }
      .wo-field-box { background:white; border:1px solid #dde2ee; padding:8px 10px; font-size:10px; white-space:pre-wrap; line-height:1.5; min-height:40px; }
      .sig-row { display:flex; gap:40px; margin-top:20px; padding-top:12px; border-top:1px dashed #bbb; }
      .sig-line { flex:1; border-top:1px solid #666; padding-top:4px; font-size:9px; color:#555; }
    </style>
    </head><body>
    <div class="page-header">
      <div class="org">NEW HANOVER COUNTY SCHOOLS</div>
      <div class="dept">Transportation Department — Vehicle Surveillance System</div>
      <div class="title">WORK ORDER &amp; REPAIR REPORT</div>
    </div>
    <div class="gold-bar"></div>
    <div class="wo-meta">
      <div><b>ORDER #:</b> ${form.order_number || '—'}</div>
      <div><b>STATUS:</b> ${(form.status || '').toUpperCase()}</div>
      <div><b>BUS #:</b> ${form.bus_number || '—'}</div>
      <div><b>LOT:</b> ${form.lot || '—'}</div>
      <div><b>REPORTED BY:</b> ${form.reported_by || '—'}</div>
      <div><b>DATE OPENED:</b> ${moment(form.created_date).format('MM/DD/YYYY HH:mm')}</div>
    </div>
    <div class="section-header">INITIAL COMPLAINT / ISSUE DESCRIPTION</div>
    <div class="wo-field-box">${form.issue_description || 'None recorded.'}</div>
    <div class="section-header" style="margin-top:12px;">REPAIR INFORMATION</div>
    <div class="meta-box">
      <div class="meta-item"><b>TECHNICIAN:</b> ${form.technician_name || '—'}</div>
      <div class="meta-item"><b>START TIME:</b> ${form.repair_start_time ? moment(form.repair_start_time).format('MM/DD/YYYY HH:mm') : '—'}</div>
      <div class="meta-item"><b>END TIME:</b> ${form.repair_end_time ? moment(form.repair_end_time).format('MM/DD/YYYY HH:mm') : '—'}</div>
      <div class="meta-item"><b>ELAPSED:</b> ${elStr}</div>
      ${form.completed_date ? `<div class="meta-item"><b>COMPLETED:</b> ${moment(form.completed_date).format('MM/DD/YYYY HH:mm')}</div>` : ''}
    </div>
    <div class="section-header" style="margin-top:12px;">REPAIRS / REMEDY RENDERED</div>
    <div class="wo-field-box">${form.repairs_rendered || 'No repairs recorded.'}</div>
    <div class="sig-row">
      <div class="sig-line">Technician Signature &amp; Date</div>
      <div class="sig-line">Supervisor Approval &amp; Date</div>
    </div>
    <div class="page-footer">NHCS Transportation — Vehicle Surveillance System | Powered by Base44</div>
    </body></html>`;

    printHtml(html);
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
  const isCompleted = form.status === 'Completed';

  // Calculate elapsed from start/end times live in the UI
  const calcElapsed = () => {
    const s = form.repair_start_time ? new Date(form.repair_start_time) : null;
    const e = form.repair_end_time ? new Date(form.repair_end_time) : null;
    if (s && e && !isNaN(s) && !isNaN(e)) return Math.max(0, Math.round((e - s) / 60000));
    return form.elapsed_time_minutes || 0;
  };
  const displayElapsedMinutes = calcElapsed();

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
          <div style={{ minWidth: '160px' }}>
            <label style={labelStyle}>ELAPSED TIME</label>
            <div style={{ background: '#000', border: '2px solid #1a1a1a', borderRadius: '2px', padding: '6px 10px', textAlign: 'center', boxShadow: 'inset 0 0 8px rgba(0,255,80,0.08)' }}>
              <div style={{ fontFamily: "'VT323', monospace", fontSize: '30px', color: '#00ff44', letterSpacing: '0.1em', lineHeight: 1, textShadow: '0 0 8px #00ff44' }}>
                {elapsedDisplay(displayElapsedMinutes)}
              </div>
              <div style={{ fontFamily: FF, fontSize: '9px', color: '#00aa33', letterSpacing: '0.12em', marginTop: '2px' }}>HH:MM</div>
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