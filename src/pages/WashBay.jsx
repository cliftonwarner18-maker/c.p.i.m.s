import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, FileDown, Trash2, Clock } from 'lucide-react';
import moment from 'moment';
import LoadingScreen from '../components/LoadingScreen';
import BulkBusWashForm from '../components/wash/BulkBusWashForm';
import BusWashOrderDetail from '../components/wash/BusWashOrderDetail';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import SeasonalBatchWashAction from '../components/wash/SeasonalBatchWashAction';
import BulkDeletePendingWash from '../components/wash/BulkDeletePendingWash';

const FF = "'Courier Prime', monospace";

function TechHoursReport({ users = [] }) {
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
    const cols = {
      num:   { x: margin + 2,   w: 22  },
      order: { x: margin + 24,  w: 78  },
      bus:   { x: margin + 102, w: 34  },
      date:  { x: margin + 136, w: 68  },
      start: { x: margin + 204, w: 72  },
      end:   { x: margin + 276, w: 72  },
      mins:  { x: margin + 348, w: 34  },
      hrs:   { x: margin + 382, w: 36  },
      tech:  { x: margin + 418, w: 104 },
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
    doc.text('DATE COMPLETED',     cols.date.x,  hY);
    doc.text('START TIME',         cols.start.x, hY);
    doc.text('END TIME',           cols.end.x,   hY);
    doc.text('MIN',                cols.mins.x,  hY);
    doc.text('HRS',                cols.hrs.x,   hY);
    doc.text('TECHNICIAN',         cols.tech.x,  hY);
    y += 20;

    // ── Rows ────────────────────────────────────────────────────────────
    const allItems = [
      ...sorted.map(wo => ({ type: 'WorkOrder', order_number: wo.order_number, bus_number: wo.bus_number, description: 'Work Order', tech: wo.technician_name, elapsed: wo.elapsed_time_minutes || 0, dateRef: wo.completed_date || wo.updated_date || wo.created_date, start: wo.repair_start_time, end: wo.repair_end_time })),
      ...filteredInspections.sort((a, b) => new Date((a.inspection_date || a.created_date) || '') - new Date((b.inspection_date || b.created_date) || '')).map(insp => ({ type: 'Inspection', order_number: insp.inspection_number, bus_number: insp.bus_number, description: 'Inspection', tech: insp.inspector_name, elapsed: insp.elapsed_minutes || 0, dateRef: insp.inspection_date || insp.created_date, start: insp.inspection_start_time, end: insp.inspection_end_time })),
      ...filteredBusHistory.sort((a, b) => new Date(a.start_time || '') - new Date(b.start_time || '')).map(bh => ({ type: 'ServiceLog', order_number: 'SVC-LOG', bus_number: bh.bus_number, description: bh.description?.substring(0, 15) || 'Service Log', tech: bh.technician, elapsed: bh.elapsed_minutes || 0, dateRef: bh.start_time || bh.created_date, start: bh.start_time, end: bh.end_time }))
    ].sort((a, b) => new Date(a.dateRef || '') - new Date(b.dateRef || ''));

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

  const inp = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };

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
          <button onClick={handleExport} disabled={exporting || filtered.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
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

export default function WashBay() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['busWashOrders'],
    queryFn: () => base44.entities.BusWashOrder.list('-assigned_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (orderId) => {
      await base44.entities.BusWashOrder.delete(orderId);
      queryClient.invalidateQueries({ queryKey: ['busWashOrders'] });
    },
    onSuccess: () => {
      setDeleteTarget(null);
    }
  });

  const filteredOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const pending = orders.filter(o => o.status === 'Pending').length;
  const completed = orders.filter(o => o.status === 'Completed').length;
  const inProgress = orders.filter(o => o.status === 'In Progress').length;

  const totalHours = orders
    .filter(o => o.status === 'Completed')
    .reduce((sum, o) => sum + (o.elapsed_time_minutes || 0), 0) / 60;

  const hoursByWasher = {};
  orders.forEach(order => {
    if (order.status === 'Completed' && order.washers) {
      order.washers.forEach(washer => {
        if (!hoursByWasher[washer]) hoursByWasher[washer] = 0;
        hoursByWasher[washer] += (order.elapsed_time_minutes || 0) / 60;
      });
    }
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 40;

    const navy = [20, 44, 95];
    const gold = [180, 140, 40];
    const white = [255, 255, 255];

    // Header
    doc.setFillColor(...navy);
    doc.rect(0, 0, W, 70, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, 70, W, 2, 'F');
    doc.setTextColor(...white);
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text('NEW HANOVER COUNTY SCHOOLS', margin, 22);
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    doc.text('Transportation Department — Summer Wash Bay Hours', margin, 36);
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...gold);
    doc.text('BUS WASH ORDERS REPORT', margin, 54);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 210, 230);
    doc.text(`Generated: ${moment().format('MM/DD/YYYY [at] HH:mm')} ET | Total Hours: ${totalHours.toFixed(2)} hrs`, margin, 65);

    let y = 88;

    // Summary Section
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.setFont('courier', 'bold');
    doc.text('SUMMARY BY WASHER', margin, y);
    y += 14;

    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    Object.entries(hoursByWasher).forEach(([washer, hours]) => {
      doc.text(`${washer}: ${hours.toFixed(2)} hours`, margin + 10, y);
      y += 10;
    });

    y += 8;

    // Table Header
    const cols = [
      { label: 'ORDER#', x: margin, w: 50 },
      { label: 'DATE', x: margin + 50, w: 70 },
      { label: 'BUS#', x: margin + 120, w: 50 },
      { label: 'STATUS', x: margin + 170, w: 50 },
      { label: 'WASHERS', x: margin + 220, w: 100 },
      { label: 'START', x: margin + 320, w: 50 },
      { label: 'END', x: margin + 370, w: 50 },
      { label: 'HOURS', x: margin + 420, w: 45 },
    ];

    doc.setFillColor(...navy);
    doc.rect(margin, y, W - margin * 2, 18, 'F');
    doc.setTextColor(...white);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    cols.forEach(c => doc.text(c.label, c.x + 2, y + 12));
    y += 18;

    // Data Rows
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    filteredOrders.forEach((order, idx) => {
      if (y > H - 60) {
        doc.addPage();
        y = 40;
        doc.setFillColor(...navy);
        doc.rect(margin, y, W - margin * 2, 18, 'F');
        doc.setTextColor(...white);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        cols.forEach(c => doc.text(c.label, c.x + 2, y + 12));
        y += 18;
        doc.setFont('courier', 'normal');
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 249, isEven ? 255 : 253);
      doc.rect(margin, y, W - margin * 2, 14, 'F');
      doc.setDrawColor(210, 215, 225);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, W - margin * 2, 14);

      doc.setTextColor(30, 30, 30);
      const rowY = y + 9;
      const hours = ((order.elapsed_time_minutes || 0) / 60).toFixed(2);
      doc.text(order.order_number || '—', cols[0].x + 2, rowY);
      doc.text(order.assigned_date || '—', cols[1].x + 2, rowY);
      doc.text(order.bus_number, cols[2].x + 2, rowY);
      doc.text(order.status, cols[3].x + 2, rowY);
      doc.text((order.washers || []).join(', ').substring(0, 20), cols[4].x + 2, rowY);
      doc.text(order.start_time || '—', cols[5].x + 2, rowY);
      doc.text(order.end_time || '—', cols[6].x + 2, rowY);
      doc.setFont('courier', 'bold');
      doc.text(`${hours} hrs`, cols[7].x + 2, rowY);
      doc.setFont('courier', 'normal');
      y += 14;
    });

    // Footer
    doc.setFillColor(...navy);
    doc.rect(0, H - 32, W, 32, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, H - 32, W, 1.5, 'F');
    doc.setTextColor(200, 210, 230);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text('NEW HANOVER COUNTY SCHOOLS — Transportation Department — Wash Bay Hours Tracking', W / 2, H - 15, { align: 'center' });

    doc.save(`NHCS_BusWash_${moment().format('YYYYMMDD')}.pdf`);
    setIsExporting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      <LoadingScreen isLoading={isLoading} message="LOADING WASH BAY DATA..." />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(140,55%,30%), hsl(140,50%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>BUS WASH MANAGEMENT SYSTEM</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>SUMMER HOURS TRACKING — {orders.length} TOTAL ORDERS</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(45,90%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '80px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(45,90%,40%)', lineHeight: 1 }}>{pending}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>PENDING</div>
        </div>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(220,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '80px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(220,55%,40%)', lineHeight: 1 }}>{inProgress}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>IN PROGRESS</div>
        </div>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(140,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '80px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(140,55%,40%)', lineHeight: 1 }}>{completed}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>COMPLETED</div>
        </div>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(280,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '80px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(280,55%,40%)', lineHeight: 1 }}>{totalHours.toFixed(1)}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>TOTAL HOURS</div>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={filteredOrders.length === 0 || isExporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 14px',
            fontSize: '11px',
            fontFamily: FF,
            fontWeight: '700',
            background: 'hsl(220,55%,38%)',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          <FileDown size={14} /> {isExporting ? 'EXPORTING...' : 'EXPORT PDF'}
        </button>
      </div>

      {/* Bulk Form & Actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <BulkBusWashForm />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100%', paddingBottom: '4px' }}>
          <SeasonalBatchWashAction onSuccess={() => refetch()} />
          <BulkDeletePendingWash onSuccess={() => refetch()} />
        </div>
      </div>

      {/* Filter */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', whiteSpace: 'nowrap' }}>FILTER:</span>
        {['All', 'Pending', 'In Progress', 'Completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              fontFamily: FF,
              fontWeight: '700',
              background: filterStatus === status ? 'hsl(220,55%,40%)' : 'hsl(220,18%,88%)',
              color: filterStatus === status ? 'white' : 'hsl(220,20%,20%)',
              border: `1px solid ${filterStatus === status ? 'hsl(220,55%,30%)' : 'hsl(220,18%,70%)'}`,
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0 }}>
                {['ORDER#', 'DATE', 'BUS#', 'STATUS', 'WASHERS', 'START', 'END', 'HOURS', 'ACTION'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>
                    NO WASH ORDERS
                  </td>
                </tr>
              )}
              {filteredOrders.map((order, idx) => (
                <tr key={order.id} style={{ background: idx % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '700' }}>{order.order_number}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{order.assigned_date}</td>
                  <td style={{ padding: '5px 8px', fontWeight: '700' }}>{order.bus_number}</td>
                  <td style={{
                    padding: '5px 8px',
                    fontWeight: '700',
                    color: order.status === 'Pending' ? 'hsl(45,90%,40%)' : order.status === 'In Progress' ? 'hsl(220,65%,42%)' : 'hsl(140,55%,30%)',
                    fontSize: '10px'
                  }}>
                    [{order.status}]
                  </td>
                  <td style={{ padding: '5px 8px', fontSize: '10px' }}>
                    {(order.washers || []).join(', ') || '—'}
                  </td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{order.start_time || '—'}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{order.end_time || '—'}</td>
                  <td style={{ padding: '5px 8px', fontWeight: '700' }}>
                    {order.elapsed_time_minutes ? ((order.elapsed_time_minutes / 60).toFixed(2) + ' hrs') : '—'}
                  </td>
                  <td style={{ padding: '5px 8px', display: 'flex', gap: '4px' }}>
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '2px 8px',
                          fontSize: '9px',
                          fontFamily: FF,
                          fontWeight: '700',
                          background: 'hsl(140,55%,40%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        START
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(order)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        fontFamily: FF,
                        fontWeight: '700',
                        background: 'hsl(0,65%,48%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hours Summary */}
      {Object.keys(hoursByWasher).length > 0 && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(to right, hsl(280,55%,32%), hsl(280,50%,42%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' }}>
            COMPLETED HOURS BY WASHER
          </div>
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {Object.entries(hoursByWasher).map(([washer, hours]) => (
              <div key={washer} style={{ background: 'hsl(220,10%,97%)', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', fontFamily: FF }}>{washer}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(140,55%,40%)', background: 'hsl(140,70%,92%)', padding: '4px 10px', borderRadius: '2px', fontFamily: FF }}>{hours.toFixed(2)} hrs</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <BusWashOrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onComplete={() => {
            setSelectedOrder(null);
            refetch();
          }}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          title={`DELETE BUS WASH ORDER #${deleteTarget.order_number}`}
          message={`This will permanently delete the wash order for Bus ${deleteTarget.bus_number}. This action cannot be undone.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Footer */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 12px', fontSize: '10px', color: 'hsl(220,10%,40%)', fontFamily: FF, lineHeight: '1.6', no_print: true }}>
        <div>&gt; BUS WASH ORDER MANAGEMENT SYSTEM — TRACK STAFF HOURS</div>
        <div>&gt; {orders.length} TOTAL ORDERS | {completed} COMPLETED | {totalHours.toFixed(2)} HOURS</div>
      </div>
    </div>
  );
}