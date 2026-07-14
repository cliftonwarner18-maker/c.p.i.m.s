import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, CheckCircle, FileDown } from 'lucide-react';
import moment from 'moment';
import { printHtml, PRINT_BASE_CSS } from '../../utils/printHtml';
import TechnicianMultiSelect from '@/components/TechnicianMultiSelect';

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

export default function WorkOrderDetailForm({ id, onClose }) {
  const queryClient = useQueryClient();

  const { data: workOrder, isLoading } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => base44.entities.WorkOrder.list().then(list => list.find(w => w.id === id)),
    enabled: !!id,
  });

  const { data: buses } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list(),
  });

  const matchedBus = (() => {
    if (!buses || !form?.bus_number) return null;
    const norm = s => (s || '').trim().toLowerCase();
    return buses.find(b => norm(b.bus_number) === norm(form.bus_number)) || null;
  })();
  const busVin = matchedBus?.vin || '';
  const busPlate = matchedBus?.license_plate || '';

  const [form, setForm] = useState(null);
  useEffect(() => {
    if (workOrder && (!form || form.id !== workOrder.id)) setForm({ ...workOrder, td18_operations: workOrder.td18_operations || [] });
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
    const opsPdf = (form.td18_operations || []).filter(o => o && (o.description || o.person_id || o.hours)).slice(0, 8);
    const opsHtml = opsPdf.length ? `
    <div class="section-header" style="margin-top:12px;">TD-18 OPERATIONS</div>
    <table style="width:100%; border-collapse:collapse; font-size:9pt; margin-bottom:8px;">
      <thead><tr style="background:#edf1fc;">
        <th style="border:1px solid #1e3c78; padding:4px 6px; text-align:left; width:8%;">OP.</th>
        <th style="border:1px solid #1e3c78; padding:4px 6px; text-align:left; width:56%;">DESCRIPTION</th>
        <th style="border:1px solid #1e3c78; padding:4px 6px; text-align:left; width:18%;">PER. ID</th>
        <th style="border:1px solid #1e3c78; padding:4px 6px; text-align:left; width:18%;">HRS.</th>
      </tr></thead>
      <tbody>
        ${opsPdf.map((op, i) => `<tr>
          <td style="border:1px solid #dde2ee; padding:4px 6px;">${String((i+1)*10).padStart(3,'0')}</td>
          <td style="border:1px solid #dde2ee; padding:4px 6px; white-space:pre-wrap;">${op.description || ''}</td>
          <td style="border:1px solid #dde2ee; padding:4px 6px;">${op.person_id || ''}</td>
          <td style="border:1px solid #dde2ee; padding:4px 6px;">${op.hours || ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '';

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
      <div class="meta-item"><b>TECHNICIAN(S):</b> ${(form.technicians && form.technicians.length ? form.technicians.join(', ') : form.technician_name) || '—'}</div>
      <div class="meta-item"><b>START TIME:</b> ${form.repair_start_time ? moment(form.repair_start_time).format('MM/DD/YYYY HH:mm') : '—'}</div>
      <div class="meta-item"><b>END TIME:</b> ${form.repair_end_time ? moment(form.repair_end_time).format('MM/DD/YYYY HH:mm') : '—'}</div>
      <div class="meta-item"><b>ELAPSED:</b> ${elStr}</div>
      ${form.completed_date ? `<div class="meta-item"><b>COMPLETED:</b> ${moment(form.completed_date).format('MM/DD/YYYY HH:mm')}</div>` : ''}
      <div class="meta-item"><b>ODOMETER:</b> ${form.meter_reading || '—'}</div>
    </div>
    <div class="section-header" style="margin-top:12px;">REPAIRS / REMEDY RENDERED</div>
    <div class="wo-field-box">${form.repairs_rendered || 'No repairs recorded.'}</div>
    ${opsHtml}
    <div class="sig-row">
      <div class="sig-line">Technician Signature &amp; Date</div>
      <div class="sig-line">Supervisor Approval &amp; Date</div>
    </div>
    <div class="page-footer">NHCS Transportation — Vehicle Surveillance System | Powered by Base44</div>
    </body></html>`;

    printHtml(html);
  };

  const handleExportTD18 = () => {
    if (!form) return;
    const repairDate = moment(form.repair_start_time || form.completed_date || form.created_date).format('MM/DD/YYYY');
    const ops = (Array.isArray(form.td18_operations) ? form.td18_operations.filter(o => o && (o.description || o.person_id || o.hours)) : []).slice(0, 8);
    const workRows = ops.length > 0 ? ops.map((op, i) => `
        <tr>
          <td style="font-weight:700;">${String((i + 1) * 10).padStart(3, '0')}</td>
          <td style="white-space:pre-wrap; word-break:break-word; padding:4px 6px;">${op.description || ''}</td>
          <td>${op.person_id || ''}</td>
          <td>${op.hours || ''}</td>
          <td></td><td></td><td></td><td></td>
        </tr>`).join('') : '';
    const blankRowCount = Math.max(0, 8 - ops.length);
    const blankRows = Array.from({ length: blankRowCount }, (_, i) => `<tr><td style="font-weight:700;">${String((ops.length + i + 1) * 10).padStart(3, '0')}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>TD-18 Work Order ${form.order_number || ''}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #000; padding: 20px 24px; }
      h1 { text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 2px; }
      h2 { text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 10px; }
      .form-ref { font-size: 8pt; display: flex; justify-content: space-between; margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      td, th { border: 1px solid #000; padding: 3px 5px; font-size: 8.5pt; vertical-align: top; }
      th { font-weight: bold; font-size: 8pt; text-align: center; background: #f0f0f0; }
      .cell-label { font-size: 7pt; font-weight: bold; display: block; color: #333; border-bottom: 1px solid #ccc; margin-bottom: 2px; }
      .cell-val { font-size: 9pt; min-height: 14px; }
      .section-title { text-align: center; font-weight: bold; font-size: 10pt; margin: 10px 0 4px; }
      .sig-table td { border: none; padding: 8px 4px 2px; }
      .sig-line { border-top: 1px solid #000; display: block; margin-top: 16px; font-size: 8pt; }
      .mech-banner { background: hsl(0,70%,18%); color: #fff; text-align: center; font-size: 9pt; font-weight: bold; letter-spacing: 0.18em; padding: 3px 0; margin-bottom: 6px; border: 2px solid hsl(0,70%,12%); }
      @media print { body { padding: 10px 14px; } }
    </style>
    </head><body>

    <div class="mech-banner">⚠ FOR MECHANICS USE ONLY ⚠</div>
    <div class="form-ref"><span>Form TD-18</span><span>Revised 3-03</span></div>
    <h1>NC PUBLIC SCHOOL TRANSPORTATION</h1>
    <h2>WORK ORDER AND MATERIAL ISSUE</h2>

    <!-- Row 1: DATE / PLANT / VEHICLE NO / LIC PLATE / VIN / METER -->
    <table>
      <tr>
        <td style="width:12%"><span class="cell-label">DATE</span><span class="cell-val">${repairDate}</span></td>
        <td style="width:10%"><span class="cell-label">PLANT</span><span class="cell-val">6065</span></td>
        <td style="width:14%"><span class="cell-label">VEHICLE NO.</span><span class="cell-val">${form.bus_number || ''}</span></td>
        <td style="width:14%"><span class="cell-label">LIC. PLATE</span><span class="cell-val">${busPlate}</span></td>
        <td style="width:32%"><span class="cell-label">VIN</span><span class="cell-val">${busVin}</span></td>
        <td style="width:18%"><span class="cell-label">METER</span><span class="cell-val">${form.meter_reading || ''}</span></td>
      </tr>
    </table>

    <!-- Row 2: ORDER TYPE / PERSON RESPONSIBLE / PM ACT TYPE / DAMAGE CAUSE / OPERATOR -->
    <table>
      <tr>
        <td style="width:15%"><span class="cell-label">ORDER TYPE</span><span class="cell-val" style="display:block; min-height:34px;"></span></td>
        <td style="width:25%"><span class="cell-label">PERSON RESPONSIBLE-WO</span><span class="cell-val" style="display:block; min-height:34px;"></span></td>
        <td style="width:14%"><span class="cell-label">PM ACT. TYPE</span><span class="cell-val" style="display:block; min-height:34px;"></span></td>
        <td style="width:16%"><span class="cell-label">DAMAGE/CAUSE</span><span class="cell-val" style="display:block; min-height:34px;"></span></td>
        <td><span class="cell-label">OPERATOR/PERSON RPRT.</span><span class="cell-val" style="display:block; min-height:34px;"></span></td>
      </tr>
    </table>

    <!-- Row 3: WORK ORDER DESCRIPTION / AGENCY / R3 ORDER NO -->
    <table>
      <tr>
        <td style="width:65%">
          <span class="cell-label">WORK ORDER DESCRIPTION</span>
          <span class="cell-val">Vehicle No. ${form.bus_number || '________'} — ${form.issue_description || ''}</span>
        </td>
        <td style="width:15%"><span class="cell-label">AGENCY</span><span class="cell-val"></span></td>
        <td><span class="cell-label">R/3 ORDER NO.</span><span class="cell-val"></span></td>
      </tr>
    </table>

    <!-- WORK PERFORMED -->
    <div class="section-title">WORK PERFORMED</div>
    <table>
      <thead>
        <tr>
          <th style="width:5%">OP.</th>
          <th style="width:38%">DESCRIPTION</th>
          <th style="width:14%">PER. ID</th>
          <th style="width:7%">HRS.</th>
          <th style="width:10%">PER. ID</th>
          <th style="width:7%">HRS.</th>
          <th style="width:9%">REA/WA</th>
          <th style="width:10%">VMRS</th>
        </tr>
      </thead>
      <tbody>
        ${workRows}
        ${blankRows}
      </tbody>
    </table>

    <!-- MATERIAL ISSUED -->
    <div class="section-title">MATERIAL ISSUED</div>
    <table>
      <thead>
        <tr>
          <th style="width:14%">DOT/VMRS<br>NUMBER</th>
          <th style="width:6%">QTY</th>
          <th style="width:5%">UM</th>
          <th style="width:8%">INV.<br>PLANT</th>
          <th style="width:8%">STOR.<br>LOC.</th>
          <th style="width:10%">G/L<br>ACCOUNT</th>
          <th style="width:9%">U/PRICE</th>
          <th>MFG. NO./TEXT</th>
        </tr>
      </thead>
      <tbody>
        ${Array(8).fill('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
      </tbody>
    </table>

    <!-- Signatures -->
    <table class="sig-table">
      <tr>
        <td style="width:35%"><span class="sig-line">TECH SIGNATURE</span></td>
        <td style="width:28%"><span class="sig-line">END DATE</span></td>
        <td><span class="sig-line">TIME</span></td>
      </tr>
      <tr>
        <td><span class="sig-line">SUPERVISOR</span></td>
        <td colspan="2"><span class="sig-line">DATE</span></td>
      </tr>
    </table>

    </body></html>`;

    printHtml(html);
  };

  if (isLoading || !form) return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: FF, color: 'hsl(220,10%,45%)', fontSize: '12px' }}>
      LOADING WORK ORDER...
    </div>
  );

  const sc = STATUS_COLORS[form.status] || { bg: '#f5f5f5', color: '#444', border: '#ddd' };
  const isCompleted = form.status === 'Completed';

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
        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: '2px', padding: '3px 10px', fontSize: '11px', fontWeight: '700' }}>
          {form.status?.toUpperCase()}
        </span>
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

        {/* Technicians */}
        <div style={{ marginBottom: '10px' }}>
          <label style={labelStyle}>TECHNICIANS (ALL SELECTED GET FULL CREDIT HOURS)</label>
          <TechnicianMultiSelect
            value={form.technicians || (form.technician_name ? [form.technician_name] : [])}
            onChange={v => setForm({ ...form, technicians: v, technician_name: v[0] || '' })}
          />
        </div>

        {/* Repairs */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>REPAIRS / REMEDY RENDERED</label>
          <textarea value={form.repairs_rendered || ''} onChange={e => setForm({ ...form, repairs_rendered: e.target.value })} placeholder="Describe all repairs performed in detail..." rows={7} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }} />
        </div>

        {/* TD-18 Operations line items */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>TD-18 OPERATIONS (LINE ITEMS FOR TD-18 EXPORT)</label>
          <div style={{ border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'hsl(45,40%,96%)', padding: '8px' }}>
            <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed hsl(220,18%,78%)' }}>
              <label style={labelStyle}>ODOMETER / METER READING (6 DIGITS)</label>
              <input
                type="text"
                maxLength={6}
                value={form.meter_reading || ''}
                onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setForm({ ...form, meter_reading: v }); }}
                placeholder="000000"
                style={{ ...inputStyle, maxWidth: '120px', letterSpacing: '0.1em', fontWeight: '700', textAlign: 'center' }}
              />
            </div>
            {(form.td18_operations || []).map((op, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,35%)', minWidth: '32px' }}>{String((idx + 1) * 10).padStart(3, '0')}</span>
                <input
                  value={op.description || ''}
                  onChange={e => { const arr = [...(form.td18_operations || [])]; arr[idx] = { ...arr[idx], description: e.target.value }; setForm({ ...form, td18_operations: arr }); }}
                  placeholder="Operation description..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  value={op.person_id || ''}
                  onChange={e => { const arr = [...(form.td18_operations || [])]; arr[idx] = { ...arr[idx], person_id: e.target.value }; setForm({ ...form, td18_operations: arr }); }}
                  placeholder="PER. ID"
                  style={{ ...inputStyle, width: '100px' }}
                />
                <input
                  value={op.hours || ''}
                  onChange={e => { const arr = [...(form.td18_operations || [])]; arr[idx] = { ...arr[idx], hours: e.target.value }; setForm({ ...form, td18_operations: arr }); }}
                  placeholder="HRS."
                  style={{ ...inputStyle, width: '70px' }}
                />
                <button
                  onClick={() => { const arr = (form.td18_operations || []).filter((_, i) => i !== idx); setForm({ ...form, td18_operations: arr }); }}
                  style={{ padding: '4px 8px', fontSize: '11px', fontFamily: FF, background: 'hsl(0,65%,48%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontWeight: '700' }}
                >✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setForm({ ...form, td18_operations: [...(form.td18_operations || []), { description: '', person_id: '', hours: '' }] })}
                disabled={(form.td18_operations || []).length >= 8}
                style={{ padding: '5px 12px', fontSize: '10px', fontFamily: FF, background: (form.td18_operations || []).length >= 8 ? 'hsl(220,10%,80%)' : 'hsl(45,90%,45%)', color: (form.td18_operations || []).length >= 8 ? 'hsl(220,10%,55%)' : '#1a1a1a', border: '1px solid hsl(45,90%,35%)', borderRadius: '2px', cursor: (form.td18_operations || []).length >= 8 ? 'not-allowed' : 'pointer', fontWeight: '700' }}
              >+ ADD OPERATION</button>
              <span style={{ fontSize: '9px', fontFamily: FF, color: 'hsl(220,10%,45%)', fontWeight: '600' }}>
                {(form.td18_operations || []).length}/8 LINE ITEMS {((form.td18_operations || []).length >= 8) && '— MAX REACHED'}
              </span>
            </div>
          </div>
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
            <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>
              CLOSE
            </button>
          </div>
          {!isCompleted && (
            <button onClick={handleComplete} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 20px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '12px', fontFamily: FF, fontWeight: '700', cursor: 'pointer', letterSpacing: '0.05em' }}>
              <CheckCircle style={{ width: 14, height: 14 }} /> COMPLETE & SUBMIT REPAIR
            </button>
          )}
          {isCompleted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#166534', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle style={{ width: 14, height: 14 }} /> COMPLETED — {form.completed_date ? moment(form.completed_date).format('MM/DD/YYYY HH:mm') : ''}
              </span>
              <button onClick={handleExportTD18} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'hsl(45,90%,45%)', color: '#1a1a1a', border: '1px solid hsl(45,90%,35%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
                <FileDown style={{ width: 12, height: 12 }} /> EXPORT TD-18
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}