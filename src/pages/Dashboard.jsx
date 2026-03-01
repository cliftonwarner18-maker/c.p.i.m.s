import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DashboardStats from '../components/dashboard/DashboardStats';
import ActiveWorkOrders from '../components/dashboard/ActiveWorkOrders';
import QuickTranscribe from '../components/dashboard/QuickTranscribe';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, PlusCircle, Bus, ClipboardCheck, Zap, FileDown } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";

function Section({ title, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', fontFamily: FF }}>
        {title}
      </div>
      <div style={{ padding: '8px', background: 'hsl(220,10%,98%)' }}>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [showTranscribe, setShowTranscribe] = useState(false);

  const { data: buses = [], isLoading: busesLoading } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list('-created_date'), retry: 2 });
  const { data: workOrders = [], isLoading: woLoading } = useQuery({ queryKey: ['workOrders'], queryFn: () => base44.entities.WorkOrder.list('-created_date'), retry: 2 });
  const { data: inspections = [], isLoading: inspLoading } = useQuery({ queryKey: ['inspections'], queryFn: () => base44.entities.Inspection.list('-created_date'), retry: 2 });

  const isLoading = busesLoading || woLoading || inspLoading;
  const recentCompleted = workOrders.filter(w => w.status === 'Completed').slice(0, 5);
  const overdueInspections = buses.filter(b => b.next_inspection_due && new Date(b.next_inspection_due) < new Date());

  const handleExportOverduePDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 40;

    // Header
    doc.setFillColor(31, 62, 120);
    doc.rect(0, 0, W, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.text('NEW HANOVER COUNTY SCHOOLS', margin, 22);
    doc.setFontSize(10);
    doc.text('Transportation — Vehicle Surveillance System', margin, 37);
    doc.setFontSize(12);
    doc.text('OVERDUE INSPECTIONS REPORT', W - margin, 22, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`Generated: ${moment().format('MM/DD/YYYY HH:mm')}`, W - margin, 37, { align: 'right' });
    y = 80;

    // Summary line
    doc.setTextColor(150, 20, 20);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(`TOTAL OVERDUE: ${overdueInspections.length} VEHICLE(S)`, margin, y);
    y += 18;

    // Table header
    doc.setFillColor(31, 62, 120);
    doc.rect(margin, y, W - margin * 2, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('BUS #', margin + 6, y + 11);
    doc.text('TYPE', margin + 70, y + 11);
    doc.text('YEAR / MAKE / MODEL', margin + 150, y + 11);
    doc.text('BASE', margin + 340, y + 11);
    doc.text('DUE DATE', margin + 420, y + 11);
    y += 20;

    // Rows
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    overdueInspections.forEach((b, i) => {
      if (y > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); y = 40; }
      doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 247 : 255, i % 2 === 0 ? 252 : 255);
      doc.rect(margin, y - 10, W - margin * 2, 16, 'F');
      doc.setTextColor(30, 30, 30);
      doc.text(String(b.bus_number || '—'), margin + 6, y);
      doc.text(String(b.bus_type || '—').substring(0, 12), margin + 70, y);
      doc.text(`${b.year || ''} ${b.make || ''} ${b.model || ''}`.trim().substring(0, 28), margin + 150, y);
      doc.text(String(b.base_location || '—'), margin + 340, y);
      doc.setTextColor(180, 20, 20);
      doc.setFont('courier', 'bold');
      doc.text(moment(b.next_inspection_due).format('MM/DD/YYYY'), margin + 420, y);
      doc.setFont('courier', 'normal');
      doc.setTextColor(30, 30, 30);
      y += 18;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('NHCS Transportation — Vehicle Surveillance System | Powered by Base44', W / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });

    doc.save(`Overdue_Inspections_${moment().format('YYYYMMDD')}.pdf`);
  };

  const btnStyle = (bg, borderC) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
    fontSize: '11px', fontFamily: FF, fontWeight: '700', borderRadius: '2px',
    cursor: 'pointer', textDecoration: 'none', border: `1px solid ${borderC}`,
    background: bg
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      <LoadingScreen isLoading={isLoading} message="LOADING FLEET DATA..." />

      {/* Banner */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} alt="NHCS" />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'hsl(220,10%,40%)', marginBottom: 4 }}>New Hanover County Schools</div>
          <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(220,55%,35%)', fontFamily: FF }}>SCHOOL BUS SURVEILLANCE SYSTEM</div>
          <div style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(220,10%,45%)', marginTop: 3 }}>Camera Repair & Maintenance Management Database</div>
        </div>
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} alt="NHCS" />
      </div>

      {/* Stats */}
      <DashboardStats buses={buses} workOrders={workOrders} inspections={inspections} />

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <Link to={createPageUrl('NewWorkOrder')} style={{ ...btnStyle('hsl(140,55%,38%)', 'hsl(140,55%,30%)'), color: 'white' }}>
          <PlusCircle style={{ width: 13, height: 13 }} /> NEW WORK ORDER
        </Link>
        <Link to={createPageUrl('FleetManager')} style={{ ...btnStyle('hsl(220,18%,88%)', 'hsl(220,18%,70%)'), color: 'hsl(220,20%,20%)' }}>
          <Bus style={{ width: 13, height: 13 }} /> MANAGE FLEET
        </Link>
        <Link to={createPageUrl('Inspections')} style={{ ...btnStyle('hsl(220,18%,88%)', 'hsl(220,18%,70%)'), color: 'hsl(220,20%,20%)' }}>
          <ClipboardCheck style={{ width: 13, height: 13 }} /> INSPECTIONS
        </Link>
        <button onClick={() => setShowTranscribe(true)} style={{ ...btnStyle('hsl(45,90%,50%)', 'hsl(45,90%,40%)'), color: 'hsl(220,20%,10%)' }}>
          <Zap style={{ width: 13, height: 13 }} /> QUICK TRANSCRIBE
        </button>
      </div>

      {showTranscribe && <QuickTranscribe onClose={() => setShowTranscribe(false)} />}

      {/* Active Work Orders */}
      <Section title="⚠️ ACTIVE WORK ORDERS — PENDING REPAIRS">
        <ActiveWorkOrders workOrders={workOrders} />
      </Section>

      {/* Overdue Inspections */}
      <Section title="🔴 OVERDUE INSPECTIONS">
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {overdueInspections.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontSize: '12px' }}>NO OVERDUE INSPECTIONS</div>
          ) : overdueInspections.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '7px 4px', borderBottom: '1px solid hsl(220,18%,88%)', fontFamily: FF }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle style={{ width: 15, height: 15, color: 'hsl(0,60%,45%)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '700' }}>BUS #{b.bus_number}</div>
                  <div style={{ fontSize: '11px', color: 'hsl(220,10%,45%)' }}>{b.year} {b.make} {b.model}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'hsl(0,60%,45%)', fontWeight: '700', fontSize: '11px' }}>OVERDUE</div>
                <div style={{ fontWeight: '700', fontSize: '11px' }}>DUE: {moment(b.next_inspection_due).format('MM/DD/YY')}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Recently Completed */}
      <Section title="✅ RECENTLY COMPLETED REPAIRS">
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {recentCompleted.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontSize: '12px' }}>NO COMPLETED REPAIRS</div>
          ) : recentCompleted.map(wo => (
            <div key={wo.id} style={{ fontSize: '12px', padding: '7px 4px', borderBottom: '1px solid hsl(220,18%,88%)', fontFamily: FF }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700' }}>{wo.order_number} — BUS #{wo.bus_number}</span>
                <span style={{ color: 'hsl(140,55%,30%)', fontWeight: '700' }}>[DONE]</span>
              </div>
              <div style={{ color: 'hsl(220,10%,40%)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>{wo.repairs_rendered}</div>
              {wo.technician_name && <div style={{ fontSize: '11px', color: 'hsl(220,10%,45%)', marginTop: 2 }}>TECH: {wo.technician_name}</div>}
            </div>
          ))}
        </div>
      </Section>

      {/* Footer */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 12px', fontSize: '11px', color: 'hsl(220,10%,40%)', fontFamily: FF, lineHeight: '1.7' }}>
        <div>&gt; SYSTEM INITIALIZED — NHCS MOBILE VEHICLE SURVEILLANCE INSPECTION SYSTEM</div>
        <div>&gt; DATABASE: <span style={{ color: 'hsl(140,55%,30%)', fontWeight: '700' }}>ONLINE</span></div>
        <div>&gt; {buses.length} VEHICLES | {workOrders.length} WORK ORDERS | {inspections.length} INSPECTIONS</div>
        <div>&gt; {moment().format('dddd, MMMM D, YYYY HH:mm:ss')}</div>
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid hsl(220,18%,82%)', color: 'hsl(220,10%,55%)', fontSize: '10px', textAlign: 'right' }}>
          Powered by Base44 &nbsp;|&nbsp; Developed by Clifton Warner M. &nbsp;&copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}