import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Plus, Pencil, Trash2, UserCheck, UserX, Save, X, Clock, FileDown } from 'lucide-react';
import moment from 'moment';
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
    if (!bh.elapsed_minutes) return false;
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
  const totalBusHistoryMinutes = filteredBusHistory.reduce((sum, bh) => sum + (bh.elapsed_minutes || 0), 0);
  const totalMinutes = totalWorkOrderMinutes + totalInspectionMinutes + totalBusHistoryMinutes;
  const totalHours = (totalMinutes / 60).toFixed(2);

  const drawPageFooter = (doc, W, H, margin, navy, gold, midGray, currentPage, totalPages) => {
    doc.setFillColor(...navy);
    doc.rect(0, H - 38, W, 38, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, H - 38, W, 2, 'F');
    doc.setTextColor(200, 210, 230);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text('NEW HANOVER COUNTY SCHOOLS — Transportation Department — Vehicle Surveillance Systems', W / 2, H - 23, { align: 'center' });
    doc.text('This is an official county labor hours record. Unauthorized modification is prohibited.', W / 2, H - 12, { align: 'center' });
    doc.setTextColor(...gold);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text(`Page ${currentPage} of ${totalPages}`, W - margin, H - 16, { align: 'right' });
  };

  const handleExport = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    const { jsPDF } = (await import('jspdf'));
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 45;
    let y = 0;

    const navy = [20, 44, 95];
    const lightBlue = [235, 240, 252];
    const gold = [180, 140, 40];
    const white = [255, 255, 255];
    const black = [10, 10, 10];
    const midGray = [100, 100, 100];
    const lightGray = [245, 246, 248];
    const borderGray = [200, 205, 215];

    const drawPageBorder = () => {
      doc.setDrawColor(...navy);
      doc.setLineWidth(3);
      doc.rect(12, 12, W - 24, H - 24);
      doc.setDrawColor(...gold);
      doc.setLineWidth(1);
      doc.rect(17, 17, W - 34, H - 34);
    };

    const addPageHeader = (pageNum, totalPages) => {
      drawPageBorder();

      // Top banner
      doc.setFillColor(...navy);
      doc.rect(0, 0, W, 80, 'F');

      // Gold accent line
      doc.setFillColor(...gold);
      doc.rect(0, 80, W, 3, 'F');

      // Title block (no logo)
      doc.setTextColor(...white);
      doc.setFont('courier', 'bold');
      doc.setFontSize(15);
      doc.text('NEW HANOVER COUNTY SCHOOLS', margin, 24);
      doc.setFontSize(10);
      doc.setFont('courier', 'normal');
      doc.text('Transportation Department — Vehicle Surveillance Systems', margin, 39);

      doc.setFillColor(...gold);
      doc.rect(margin, 45, W - margin * 2, 1, 'F');

      doc.setFont('courier', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...gold);
      doc.text('OFFICIAL TECHNICIAN LABOR HOURS RECORD', margin, 60);

      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 210, 230);
      doc.text(`Document No: NHCS-VSS-HR-${moment().format('YYYYMMDD')}   |   Page ${pageNum} of ${totalPages}   |   Printed: ${moment().format('MM/DD/YYYY [at] HH:mm')}`, margin, 73);

      y = 97;
    };

    // Pre-count pages
    const sorted = [...filtered].sort((a, b) => {
      const da = a.completed_date || a.updated_date || a.created_date || '';
      const db = b.completed_date || b.updated_date || b.created_date || '';
      return new Date(da) - new Date(db);
    });

    // Estimate page count (each row ~16pt, header ~250pt, footer ~120pt)
    const rowH = 16;
    const usableH = H - 250 - 120;
    const rowsPerPage = Math.floor(usableH / rowH);
    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));

    let currentPage = 1;
    addPageHeader(currentPage, totalPages);

    // ── Summary / Report Info Box ──────────────────────────────────────
    doc.setFillColor(...lightBlue);
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, W - margin * 2, 78, 'FD');

    // Left: Report details
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...navy);
    doc.text('REPORT DETAILS', margin + 10, y + 14);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...navy);
    doc.line(margin + 10, y + 17, margin + 100, y + 17);

    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...black);

    const rangeLabel = startDate && endDate
      ? `${moment(startDate).format('MMMM D, YYYY')} — ${moment(endDate).format('MMMM D, YYYY')}`
      : startDate ? `From ${moment(startDate).format('MMMM D, YYYY')}` : endDate ? `Through ${moment(endDate).format('MMMM D, YYYY')}` : 'All Dates on Record';

    doc.setFont('courier', 'bold'); doc.text('EMPLOYEE / TECHNICIAN:', margin + 10, y + 30);
    doc.setFont('courier', 'normal'); doc.text(selectedTech || 'ALL TECHNICIANS', margin + 145, y + 30);
    doc.setFont('courier', 'bold'); doc.text('REPORTING PERIOD:', margin + 10, y + 44);
    doc.setFont('courier', 'normal'); doc.text(rangeLabel, margin + 145, y + 44);
    doc.setFont('courier', 'bold'); doc.text('DEPARTMENT:', margin + 10, y + 58);
    doc.setFont('courier', 'normal'); doc.text('Transportation — Vehicle Surveillance Sys.', margin + 145, y + 58);

    // Right: Totals summary box
    const sumX = W - margin - 155;
    doc.setFillColor(...navy);
    doc.rect(sumX, y + 4, 145, 70, 'F');
    doc.setTextColor(...gold);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text('SUMMARY TOTALS', sumX + 72, y + 16, { align: 'center' });
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(sumX + 8, y + 19, sumX + 137, y + 19);
    doc.setTextColor(...white);
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    doc.text(`Work Orders:`, sumX + 8, y + 32);
    doc.setFont('courier', 'bold');
    doc.text(`${filtered.length}`, sumX + 137, y + 32, { align: 'right' });
    doc.setFont('courier', 'normal');
    doc.text(`Total Minutes:`, sumX + 8, y + 46);
    doc.setFont('courier', 'bold');
    doc.text(`${totalMinutes}`, sumX + 137, y + 46, { align: 'right' });
    doc.setFont('courier', 'normal');
    doc.text(`Total Hours:`, sumX + 8, y + 60);
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...gold);
    doc.text(`${totalHours}`, sumX + 137, y + 62, { align: 'right' });

    y += 88;

    // ── Column headers ─────────────────────────────────────────────────
    // Total usable = W - margin*2 = ~522pt. Columns sum to 522.
    const cols = {
      num:   { x: margin + 2,   w: 22  },  // #       22
      order: { x: margin + 24,  w: 55  },  // ORDER#  55
      bus:   { x: margin + 79,  w: 28  },  // BUS#    28
      type:  { x: margin + 107, w: 26  },  // TYPE    26
      date:  { x: margin + 133, w: 48  },  // DATE    48
      start: { x: margin + 181, w: 45  },  // START   45
      end:   { x: margin + 226, w: 45  },  // END     45
      mins:  { x: margin + 271, w: 32  },  // MIN     32
      hrs:   { x: margin + 303, w: 32  },  // HRS     32
      tech:  { x: margin + 335, w: 187 },  // TECH   187  → total=522
    };

    doc.setFillColor(...navy);
    doc.rect(margin, y, W - margin * 2, 20, 'F');
    doc.setTextColor(...white);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    const hY = y + 13;
    doc.text('#',                  cols.num.x,   hY);
    doc.text('ORDER #',            cols.order.x, hY);
    doc.text('BUS #',              cols.bus.x,   hY);
    doc.text('TYPE',               cols.type.x,  hY);
    doc.text('DATE COMPLETED',     cols.date.x,  hY);
    doc.text('START TIME',         cols.start.x, hY);
    doc.text('END TIME',           cols.end.x,   hY);
    doc.text('MIN',                cols.mins.x,  hY);
    doc.text('HRS',                cols.hrs.x,   hY);
    doc.text('TECHNICIAN',         cols.tech.x,  hY);
    y += 20;

    // ── Rows ────────────────────────────────────────────────────────────
    // Combine all items: work orders, inspections, manual service logs
    const allItems = [
      ...sorted.map(wo => ({ type: 'WorkOrder', order_number: wo.order_number, bus_number: wo.bus_number, description: 'Work Order', wo_type: wo.work_order_type || '—', tech: wo.technician_name, elapsed: wo.elapsed_time_minutes || 0, dateRef: wo.completed_date || wo.updated_date || wo.created_date, start: wo.repair_start_time, end: wo.repair_end_time })),
      ...filteredInspections.sort((a, b) => new Date((a.inspection_date || a.created_date) || '') - new Date((b.inspection_date || b.created_date) || '')).map(insp => ({ type: 'Inspection', order_number: insp.inspection_number, bus_number: insp.bus_number, description: 'Inspection', wo_type: '—', tech: insp.inspector_name, elapsed: insp.elapsed_minutes || 0, dateRef: insp.inspection_date || insp.created_date, start: insp.inspection_start_time, end: insp.inspection_end_time })),
      ...filteredBusHistory.sort((a, b) => new Date(a.start_time || '') - new Date(b.start_time || '')).map(bh => ({ type: 'ServiceLog', order_number: 'SVC-LOG', bus_number: bh.bus_number, description: bh.description?.substring(0, 15) || 'Service Log', wo_type: '—', tech: bh.technician, elapsed: bh.elapsed_minutes || 0, dateRef: bh.start_time || bh.created_date, start: bh.start_time, end: bh.end_time }))
    ].sort((a, b) => new Date(a.dateRef || '') - new Date(b.dateRef || ''));

    // Re-estimate page count with combined items
    const estRowsPerPage = Math.floor((H - 250 - 120) / rowH);
    const estTotalPages = Math.max(1, Math.ceil(allItems.length / estRowsPerPage));
    
    let grandMin = 0;
    allItems.forEach((item, idx) => {
      if (y > H - 130) {
        drawPageFooter(doc, W, H, margin, navy, gold, midGray, currentPage, estTotalPages);
        doc.addPage();
        currentPage++;
        addPageHeader(currentPage, estTotalPages);
        doc.setFillColor(...navy);
        doc.rect(margin, y, W - margin * 2, 20, 'F');
        doc.setTextColor(...white);
        doc.setFont('courier', 'bold');
        doc.setFontSize(7.5);
        doc.text('#',              cols.num.x,   y + 13);
        doc.text('ORDER #',        cols.order.x, y + 13);
        doc.text('BUS #',          cols.bus.x,   y + 13);
        doc.text('TYPE',           cols.type.x,  y + 13);
        doc.text('DATE COMPLETED', cols.date.x,  y + 13);
        doc.text('START TIME',     cols.start.x, y + 13);
        doc.text('END TIME',       cols.end.x,   y + 13);
        doc.text('MIN',            cols.mins.x,  y + 13);
        doc.text('HRS',            cols.hrs.x,   y + 13);
        doc.text('TECHNICIAN',     cols.tech.x,  y + 13);
        y += 20;
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 249, isEven ? 255 : 253);
      doc.rect(margin, y, W - margin * 2, rowH, 'F');
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, W - margin * 2, rowH);

      const elMin = item.elapsed || 0;
      const elHrs = (elMin / 60).toFixed(2);
      grandMin += elMin;

      const dateStr = item.dateRef ? moment(item.dateRef).format('MM/DD/YYYY') : '—';
      const startStr = item.start ? moment(item.start).format('MM/DD/YY HH:mm') : '—';
      const endStr = item.end ? moment(item.end).format('MM/DD/YY HH:mm') : '—';

      doc.setTextColor(...black);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      const rY = y + 11;
      doc.text(String(idx + 1), cols.num.x, rY);
      doc.text((item.order_number || '—').substring(0, 12), cols.order.x, rY);
      doc.text(item.bus_number || '—', cols.bus.x, rY);
      doc.text((item.wo_type || '—').substring(0, 2), cols.type.x, rY);
      doc.text(dateStr, cols.date.x, rY);
      doc.text(startStr, cols.start.x, rY);
      doc.text(endStr, cols.end.x, rY);
      doc.setFont('courier', 'bold');
      doc.text(String(elMin), cols.mins.x, rY);
      doc.setTextColor(...navy);
      doc.text(elHrs, cols.hrs.x, rY);
      doc.setTextColor(...black);
      doc.setFont('courier', 'normal');
      doc.text((item.tech || '—').substring(0, 22), cols.tech.x, rY);
      y += rowH;
    });

    // ── Grand Total Row ─────────────────────────────────────────────────
    y += 4;
    doc.setFillColor(...navy);
    doc.rect(margin, y, W - margin * 2, 20, 'F');
    doc.setTextColor(...gold);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL LABOR HOURS:', margin + 10, y + 13);
    doc.text(`${grandMin} MINUTES`, cols.mins.x - 30, y + 13);
    doc.text(`${(grandMin / 60).toFixed(2)} HOURS`, cols.hrs.x - 10, y + 13);
    y += 30;

    // ── Certification Block ─────────────────────────────────────────────
    if (y > H - 160) { 
      drawPageFooter(doc, W, H, margin, navy, gold, midGray, currentPage, totalPages);
      doc.addPage(); currentPage++; y = 100; 
    }
    doc.setFillColor(...lightBlue);
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, W - margin * 2, 90, 'FD');
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...navy);
    doc.text('CERTIFICATION & APPROVAL', margin + 10, y + 14);
    doc.setLineWidth(0.3);
    doc.line(margin + 10, y + 17, margin + 175, y + 17);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    const certText = doc.splitTextToSize('I certify that the hours recorded above are accurate and represent actual labor performed on New Hanover County Schools Transportation Department vehicle surveillance systems during the reporting period indicated.', W - margin * 2 - 20);
    doc.text(certText, margin + 10, y + 28);

    const sigY = y + 55;
    const halfW = (W - margin * 2 - 20) / 2;
    doc.setDrawColor(...midGray);
    doc.setLineWidth(0.5);
    // Sig line left
    doc.line(margin + 10, sigY, margin + 10 + halfW - 10, sigY);
    doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...midGray);
    doc.text('Technician Signature / Date', margin + 10, sigY + 9);
    doc.text((selectedTech || '______________________________'), margin + 10, sigY + 19);
    // Sig line right
    const rSig = margin + halfW + 20;
    doc.line(rSig, sigY, rSig + halfW - 10, sigY);
    doc.text('Supervisor Signature / Date', rSig, sigY + 9);
    doc.text('Transportation Dept. Supervisor', rSig, sigY + 19);

    drawPageFooter(doc, W, H, margin, navy, gold, midGray, currentPage, totalPages);

    const safeTech = (selectedTech || 'AllTechs').replace(/\s+/g, '_');
    doc.save(`NHCS_LaborHoursRecord_${safeTech}_${moment().format('YYYYMMDD')}.pdf`);
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
          <span><strong>{filteredInspections.length}</strong> inspections</span>
          <span><strong>{filteredBusHistory.length}</strong> manual logs</span>
          <span><strong>{totalHours}</strong> total hours ({totalMinutes} min)</span>
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