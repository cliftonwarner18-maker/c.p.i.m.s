import React from 'react';
import WashBayForm from '../components/wash/WashBayForm';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { HardDrive } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";

export default function WashBay() {
  const { data: washRecords = [], isLoading } = useQuery({
    queryKey: ['washBay'],
    queryFn: () => base44.entities.WashBay.list('-wash_date'),
  });

  const totalHours = (washRecords.reduce((sum, w) => sum + (w.elapsed_time_minutes || 0), 0) / 60).toFixed(2);
  const byWasher = washRecords.reduce((acc, w) => {
    if (!acc[w.washer_name]) acc[w.washer_name] = 0;
    acc[w.washer_name] += (w.elapsed_time_minutes || 0) / 60;
    return acc;
  }, {});

  const handleExportPDF = async () => {
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
    doc.text('WASH BAY HOURS REPORT', margin, 54);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 210, 230);
    doc.text(`Generated: ${moment().format('MM/DD/YYYY [at] HH:mm')} ET | Total Hours: ${totalHours} hrs`, margin, 65);

    let y = 88;

    // Summary Section
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.setFont('courier', 'bold');
    doc.text('SUMMARY BY WASHER', margin, y);
    y += 14;

    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    Object.entries(byWasher).forEach(([washer, hours]) => {
      doc.text(`${washer}: ${hours.toFixed(2)} hours`, margin + 10, y);
      y += 10;
    });

    y += 8;

    // Table Header
    const cols = [
      { label: 'DATE', x: margin, w: 55 },
      { label: 'BUS #', x: margin + 55, w: 45 },
      { label: 'WASHER', x: margin + 100, w: 120 },
      { label: 'START TIME', x: margin + 220, w: 70 },
      { label: 'END TIME', x: margin + 290, w: 70 },
      { label: 'HOURS', x: margin + 360, w: 60 },
      { label: 'NOTES', x: margin + 420, w: 60 },
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
    washRecords.forEach((record, idx) => {
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
      const hours = ((record.elapsed_time_minutes || 0) / 60).toFixed(2);
      doc.text(record.wash_date, cols[0].x + 2, rowY);
      doc.text(record.bus_number || '—', cols[1].x + 2, rowY);
      doc.text((record.washer_name || '—').substring(0, 18), cols[2].x + 2, rowY);
      doc.text(record.start_time || '—', cols[3].x + 2, rowY);
      doc.text(record.end_time || '—', cols[4].x + 2, rowY);
      doc.setFont('courier', 'bold');
      doc.text(`${hours} hrs`, cols[5].x + 2, rowY);
      doc.setFont('courier', 'normal');
      doc.text((record.notes || '—').substring(0, 15), cols[6].x + 2, rowY);
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

    doc.save(`NHCS_WashBay_${moment().format('YYYYMMDD')}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      <LoadingScreen isLoading={isLoading} message="LOADING WASH BAY DATA..." />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(140,55%,30%), hsl(140,50%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>WASH BAY MANAGEMENT SYSTEM</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>SUMMER HOURS TRACKING — {washRecords.length} TOTAL SESSIONS</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(140,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '90px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(140,55%,40%)', lineHeight: 1 }}>{totalHours}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>TOTAL HOURS</div>
        </div>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(220,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '90px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(220,55%,40%)', lineHeight: 1 }}>{Object.keys(byWasher).length}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>UNIQUE WASHERS</div>
        </div>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(280,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '90px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(280,55%,40%)', lineHeight: 1 }}>{washRecords.length}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>LOG ENTRIES</div>
        </div>
        <button onClick={handleExportPDF} disabled={washRecords.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px', fontSize: '11px', fontFamily: FF, fontWeight: '700', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', marginLeft: 'auto' }}>
          📄 EXPORT REPORT
        </button>
      </div>

      {/* Form Component */}
      <WashBayForm />

      {/* Summary by Washer */}
      {Object.keys(byWasher).length > 0 && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(to right, hsl(280,55%,32%), hsl(280,50%,42%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' }}>HOURS SUMMARY BY WASHER</div>
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {Object.entries(byWasher).map(([washer, hours]) => (
              <div key={washer} style={{ background: 'hsl(220,10%,97%)', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)' }}>{washer}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(140,55%,40%)', background: 'hsl(140,70%,92%)', padding: '4px 10px', borderRadius: '2px' }}>{hours.toFixed(2)} hrs</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 12px', fontSize: '11px', color: 'hsl(220,10%,40%)', fontFamily: FF, lineHeight: '1.7' }}>
        <div>&gt; WASH BAY MANAGEMENT — TRACKING SUMMER TECHNICIAN HOURS</div>
        <div>&gt; {washRecords.length} SESSIONS LOGGED | {totalHours} TOTAL HOURS</div>
        <div>&gt; {moment().format('dddd, MMMM D, YYYY HH:mm:ss')}</div>
      </div>
    </div>
  );
}