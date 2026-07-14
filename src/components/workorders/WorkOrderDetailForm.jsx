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

  const [form, setForm] = useState(null);
  useEffect(() => {
    if (workOrder && (!form || form.id !== workOrder.id)) setForm({ ...workOrder });
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
    const elHrs = elMin > 0 ? (elMin / 60).toFixed(2) : '—';
    const techs = (form.technicians && form.technicians.length ? form.technicians : form.technician_name ? [form.technician_name] : []);
    const createdDate = moment(form.created_date).format('MM/DD/YYYY');
    const endDate = form.repair_end_time ? moment(form.repair_end_time).format('MM/DD/YYYY') : '';
    const endTime = form.repair_end_time ? moment(form.repair_end_time).format('HH:mm') : '';

    // Build WORK PERFORMED rows — one row per technician, first row has description
    const workRows = techs.length > 0 ? techs.map((tech, i) => `
      <tr>
        <td style="font-weight:700;">${String((i + 1) * 10).padStart(3, '0')}</td>
        <td style="white-space:pre-wrap; word-break:break-word; padding:4px 6px;">${i === 0 ? (form.repairs_rendered || '') : ''}</td>
        <td>${tech}</td>
        <td>${i === 0 ? elHrs : ''}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>`).join('') : `
      <tr>
        <td>010</td>
        <td style="white-space:pre-wrap; word-break:break-word; padding:4px 6px;">${form.repairs_rendered || ''}</td>
        <td></td><td>${elHrs}</td><td></td><td></td><td></td><td></td>
      </tr>` + `<tr><td>020</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`.repeat(7);

    // Pad to at least 8 rows total
    const rowCount = techs.length || 1;
    const extraRows = rowCount < 8 ? Array.from({ length: 8 - rowCount }, (_, i) => `
      <tr>
        <td style="font-weight:700;">${String((rowCount + i + 1) * 10).padStart(3, '0')}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>`).join('') : '';

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
      .desc-cell { min-height: 60px; white-space: pre-wrap; word-break: break-word; }
      @media print { body { padding: 10px 14px; } }
    </style>
    </head><body>

    <div class="form-ref"><span>Form TD-18</span><span>Revised 3-03</span></div>
    <h1>NC PUBLIC SCHOOL TRANSPORTATION</h1>
    <h2>WORK ORDER AND MATERIAL ISSUE</h2>

    <!-- Row 1: DATE / PLANT / VEHICLE NO / LIC PLATE / VIN / METER -->
    <table>
      <tr>
        <td style="width:12%"><span class="cell-label">DATE</span><span class="cell-val">${createdDate}</span></td>
        <td style="width:10%"><span class="cell-label">PLANT</span><span class="cell-val">6065</span></td>
        <td style="width:14%"><span class="cell-label">VEHICLE NO.</span><span class="cell-val">${form.bus_number || ''}</span></td>
        <td style="width:14%"><span class="cell-label">LIC. PLATE</span><span class="cell-val"></span></td>
        <td style="width:32%"><span class="cell-label">VIN</span><span class="cell-val"></span></td>
        <td style="width:18%"><span class="cell-label">METER</span><span class="cell-val"></span></td>
      </tr>
    </table>

    <!-- Row 2: ORDER TYPE / PERSON RESPONSIBLE / PM ACT TYPE / DAMAGE CAUSE / OPERATOR -->
    <table>
      <tr>
        <td style="width:15%"><span class="cell-label">ORDER TYPE</span><span class="cell-val">${form.work_order_type || ''}</span></td>
        <td style="width:25%"><span class="cell-label">PERSON RESPONSIBLE-WO</span><span class="cell-val">${techs[0] || ''}</span></td>
        <td style="width:14%"><span class="cell-label">PM ACT. TYPE</span><span class="cell-val"></span></td>
        <td style="width:16%"><span class="cell-label">DAMAGE/CAUSE</span><span class="cell-val"></span></td>
        <td><span class="cell-label">OPERATOR/PERSON RPRT.</span><span class="cell-val">${form.reported_by || ''}</span></td>
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
        <td><span class="cell-label">R/3 ORDER NO.</span><span class="cell-val">${form.order_number || ''}</span></td>
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
        ${extraRows}
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
        <td style="width:28%"><span class="sig-line">END DATE &nbsp;&nbsp; ${endDate}</span></td>
        <td><span class="sig-line">TIME &nbsp;&nbsp; ${endTime}</span></td>
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
            <span style={{ fontSize: '11px', color: '#166534', fontWeight: '700', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle style={{ width: 14, height: 14 }} /> COMPLETED — {form.completed_date ? moment(form.completed_date).format('MM/DD/YYYY HH:mm') : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}