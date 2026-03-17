import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";

export default function WashBayHoursReport() {
  const [selectedWasher, setSelectedWasher] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['busWashOrdersReport'],
    queryFn: () => base44.entities.BusWashOrder.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['systemUsersReport'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });

  // Get unique washers from completed orders
  const allWashers = new Set();
  orders.forEach(o => {
    if (o.status === 'Completed' && o.washers) {
      o.washers.forEach(w => allWashers.add(w));
    }
  });

  const filtered = orders.filter(order => {
    if (order.status !== 'Completed') return false;
    if (!order.washers || order.washers.length === 0) return false;
    if (selectedWasher && !order.washers.includes(selectedWasher)) return false;
    if (startDate && new Date(order.completed_date || order.assigned_date) < new Date(startDate)) return false;
    if (endDate && new Date(order.completed_date || order.assigned_date) > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const totalMinutes = filtered.reduce((sum, o) => sum + (o.elapsed_time_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const hoursByWasher = {};
  filtered.forEach(order => {
    if (order.washers) {
      order.washers.forEach(washer => {
        if (!hoursByWasher[washer]) hoursByWasher[washer] = 0;
        hoursByWasher[washer] += (order.elapsed_time_minutes || 0) / 60;
      });
    }
  });

  const handleExport = async () => {
    if (filtered.length === 0) return;
    setExporting(true);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 45;
    let y = 0;

    const navy = [20, 44, 95];
    const gold = [180, 140, 40];
    const white = [255, 255, 255];
    const black = [10, 10, 10];
    const lightBlue = [235, 240, 252];
    const borderGray = [200, 205, 215];

    // Expand: one row per washer per order, each gets full elapsed credit
    const sorted = [...filtered].sort((a, b) => new Date(a.completed_date || a.assigned_date) - new Date(b.completed_date || b.assigned_date));
    const expandedRows = [];
    sorted.forEach(order => {
      const washers = (order.washers && order.washers.length > 0) ? order.washers : ['—'];
      washers.forEach(washer => {
        expandedRows.push({ order, washer });
      });
    });

    // Filter by selected washer if set
    const rows = selectedWasher
      ? expandedRows.filter(r => r.washer === selectedWasher)
      : expandedRows;

    // Grand total = sum of all individual rows (each washer gets full credit)
    const grandTotalMin = rows.reduce((sum, r) => sum + (r.order.elapsed_time_minutes || 0), 0);

    const drawPageBorder = () => {
      doc.setDrawColor(...navy);
      doc.setLineWidth(3);
      doc.rect(12, 12, W - 24, H - 24);
      doc.setDrawColor(...gold);
      doc.setLineWidth(1);
      doc.rect(17, 17, W - 34, H - 34);
    };

    const rowH = 16;
    const usableH = H - 250 - 120;
    const rowsPerPage = Math.floor(usableH / rowH);
    const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
    let currentPage = 1;

    const addPageHeader = (pageNum, tot) => {
      drawPageBorder();
      doc.setFillColor(...navy);
      doc.rect(0, 0, W, 80, 'F');
      doc.setFillColor(...gold);
      doc.rect(0, 80, W, 3, 'F');
      doc.setTextColor(...white);
      doc.setFont('courier', 'bold');
      doc.setFontSize(15);
      doc.text('NEW HANOVER COUNTY SCHOOLS', margin, 24);
      doc.setFontSize(10);
      doc.setFont('courier', 'normal');
      doc.text('Transportation Department — Wash Bay Operations', margin, 39);
      doc.setFillColor(...gold);
      doc.rect(margin, 45, W - margin * 2, 1, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...gold);
      doc.text('BUS WASH BAY HOURS RECORD — INDIVIDUAL TECHNICIAN CREDIT', margin, 60);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(200, 210, 230);
      doc.text(`Document No: NHCS-WSH-HR-${moment().format('YYYYMMDD')}   |   Page ${pageNum} of ${tot}   |   Printed: ${moment().format('MM/DD/YYYY [at] HH:mm')}`, margin, 73);
      y = 97;
    };

    addPageHeader(currentPage, totalPages);

    // Summary Box
    const rangeLabel = startDate && endDate
      ? `${moment(startDate).format('MMMM D, YYYY')} — ${moment(endDate).format('MMMM D, YYYY')}`
      : startDate ? `From ${moment(startDate).format('MMMM D, YYYY')}` : endDate ? `Through ${moment(endDate).format('MMMM D, YYYY')}` : 'All Dates on Record';

    doc.setFillColor(...lightBlue);
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, W - margin * 2, 78, 'FD');
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
    doc.setFont('courier', 'bold'); doc.text('WASHER / TECHNICIAN:', margin + 10, y + 30);
    doc.setFont('courier', 'normal'); doc.text(selectedWasher || 'ALL WASHERS (INDIVIDUAL CREDIT)', margin + 145, y + 30);
    doc.setFont('courier', 'bold'); doc.text('REPORTING PERIOD:', margin + 10, y + 44);
    doc.setFont('courier', 'normal'); doc.text(rangeLabel, margin + 145, y + 44);
    doc.setFont('courier', 'bold'); doc.text('NOTE:', margin + 10, y + 58);
    doc.setFont('courier', 'normal'); doc.text('Each technician receives full elapsed time credit per wash', margin + 145, y + 58);

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
    doc.text('Line Items:', sumX + 8, y + 32);
    doc.setFont('courier', 'bold');
    doc.text(String(rows.length), sumX + 137, y + 32, { align: 'right' });
    doc.setFont('courier', 'normal');
    doc.text('Total Minutes:', sumX + 8, y + 46);
    doc.setFont('courier', 'bold');
    doc.text(String(grandTotalMin), sumX + 137, y + 46, { align: 'right' });
    doc.setFont('courier', 'normal');
    doc.text('Total Hours:', sumX + 8, y + 60);
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...gold);
    doc.text((grandTotalMin / 60).toFixed(2), sumX + 137, y + 62, { align: 'right' });

    y += 88;

    // Column layout: # | TECHNICIAN | ORDER# | BUS# | DATE | START | END | MIN | HRS
    const cols = {
      num:   { x: margin + 2   },
      tech:  { x: margin + 18  },
      order: { x: margin + 148 },
      bus:   { x: margin + 218 },
      date:  { x: margin + 253 },
      start: { x: margin + 323 },
      end:   { x: margin + 373 },
      mins:  { x: margin + 423 },
      hrs:   { x: margin + 463 },
    };

    const drawColHeaders = () => {
      doc.setFillColor(...navy);
      doc.rect(margin, y, W - margin * 2, 20, 'F');
      doc.setTextColor(...white);
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      const hY = y + 13;
      doc.text('#',           cols.num.x,   hY);
      doc.text('TECHNICIAN',  cols.tech.x,  hY);
      doc.text('ORDER #',     cols.order.x, hY);
      doc.text('BUS #',       cols.bus.x,   hY);
      doc.text('DATE',        cols.date.x,  hY);
      doc.text('START',       cols.start.x, hY);
      doc.text('END',         cols.end.x,   hY);
      doc.text('MIN',         cols.mins.x,  hY);
      doc.text('HRS',         cols.hrs.x,   hY);
      y += 20;
    };

    drawColHeaders();

    // Data rows — one per washer per order
    let grandMin = 0;
    rows.forEach(({ order, washer }, idx) => {
      if (y > H - 130) {
        doc.setFillColor(...navy);
        doc.rect(0, H - 32, W, 32, 'F');
        doc.setFillColor(...gold);
        doc.rect(0, H - 32, W, 1.5, 'F');
        doc.setTextColor(200, 210, 230);
        doc.setFont('courier', 'normal');
        doc.setFontSize(8);
        doc.text('NEW HANOVER COUNTY SCHOOLS — Transportation Department — Wash Bay Hours', W / 2, H - 15, { align: 'center' });
        doc.addPage();
        currentPage++;
        addPageHeader(currentPage, totalPages);
        drawColHeaders();
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 249, isEven ? 255 : 253);
      doc.rect(margin, y, W - margin * 2, rowH, 'F');
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, W - margin * 2, rowH);

      const elMin = order.elapsed_time_minutes || 0;
      const elHrs = (elMin / 60).toFixed(2);
      grandMin += elMin;

      const dateStr = (order.assigned_date || order.completed_date)
        ? moment(order.assigned_date || order.completed_date).format('MM/DD/YYYY') : '—';
      // Format start/end as HH:MM
      const fmtTime = (t) => {
        if (!t) return '—';
        if (t.includes('T')) return moment(t).format('HH:mm');
        return t.substring(0, 5);
      };
      const startStr = fmtTime(order.start_time);
      const endStr   = fmtTime(order.end_time);

      doc.setTextColor(...black);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      const rY = y + 11;
      doc.text(String(idx + 1),                          cols.num.x,   rY);
      doc.text(washer.substring(0, 22),                  cols.tech.x,  rY);
      doc.text((order.order_number || '—').substring(0, 10), cols.order.x, rY);
      doc.text((order.bus_number || '—').substring(0, 6), cols.bus.x,   rY);
      doc.text(dateStr,                                  cols.date.x,  rY);
      doc.text(startStr,                                 cols.start.x, rY);
      doc.text(endStr,                                   cols.end.x,   rY);
      doc.setFont('courier', 'bold');
      doc.text(String(elMin),                            cols.mins.x,  rY);
      doc.setTextColor(...navy);
      doc.text(elHrs,                                    cols.hrs.x,   rY);
      doc.setTextColor(...black);
      y += rowH;
    });

    // Grand total row
    y += 4;
    doc.setFillColor(...navy);
    doc.rect(margin, y, W - margin * 2, 20, 'F');
    doc.setTextColor(...gold);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL INDIVIDUAL WASH HOURS:', margin + 10, y + 13);
    doc.text(`${grandMin} MIN`, cols.mins.x - 10, y + 13);
    doc.text(`${(grandMin / 60).toFixed(2)} HRS`, cols.hrs.x - 5, y + 13);

    // Footer
    doc.setFillColor(...navy);
    doc.rect(0, H - 32, W, 32, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, H - 32, W, 1.5, 'F');
    doc.setTextColor(200, 210, 230);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text('NEW HANOVER COUNTY SCHOOLS — Transportation Department — Wash Bay Hours', W / 2, H - 15, { align: 'center' });

    doc.save(`NHCS_WashBayHours_${moment().format('YYYYMMDD')}.pdf`);
    setExporting(false);
  };

  const inp = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(280,55%,32%), hsl(280,50%,42%))', color: 'white', padding: '8px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
        WASH BAY HOURS REPORT
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: 3 }}>WASHER</div>
            <select value={selectedWasher} onChange={e => setSelectedWasher(e.target.value)} style={{ ...inp, minWidth: 180 }}>
              <option value="">All Washers</option>
              {Array.from(allWashers).sort().map(w => <option key={w} value={w}>{w}</option>)}
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
          <span><strong>{filtered.length}</strong> wash orders</span>
          <span><strong>{totalHours}</strong> hrs total elapsed | individual credits counted per washer per wash</span>
        </div>
      </div>
    </div>
  );
}