import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DashboardStats from '../components/dashboard/DashboardStats';
import FormModal from '../components/FormModal';
import NewWorkOrderForm from '../components/workorders/NewWorkOrderForm';
import WorkOrderDetailForm from '../components/workorders/WorkOrderDetailForm';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showNewWorkOrder, setShowNewWorkOrder] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const { data: buses = [], isLoading: busesLoading } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list('-created_date'), retry: 2 });
  const { data: workOrders = [], isLoading: woLoading } = useQuery({ queryKey: ['workOrders'], queryFn: () => base44.entities.WorkOrder.list('-created_date'), retry: 2 });
  const { data: inspections = [], isLoading: inspLoading } = useQuery({ queryKey: ['inspections'], queryFn: () => base44.entities.Inspection.list('-created_date'), retry: 2 });

  const isLoading = busesLoading || woLoading || inspLoading;

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
          <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(220,55%,35%)', fontFamily: FF }}>DATA-TRACS SYSTEM</div>
          <div style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(220,10%,45%)', marginTop: 3 }}>Multi-Type Repair & Technician Hours Tracking System</div>
        </div>
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} alt="NHCS" />
      </div>

      {/* Stats */}
      <DashboardStats buses={buses} workOrders={workOrders} inspections={inspections} />

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button onClick={() => setShowNewWorkOrder(true)} style={{ ...btnStyle('hsl(140,55%,38%)', 'hsl(140,55%,30%)'), color: 'white' }}>
          <PlusCircle style={{ width: 13, height: 13 }} /> NEW WORK ORDER
        </button>
      </div>

      <FormModal open={showNewWorkOrder} onClose={() => setShowNewWorkOrder(false)}>
        <NewWorkOrderForm
          onClose={() => setShowNewWorkOrder(false)}
          onCreated={(id) => {setShowNewWorkOrder(false);setViewingId(id);}} />
        
      </FormModal>

      <FormModal open={!!viewingId} onClose={() => setViewingId(null)} maxWidth="900px">
        {viewingId && <WorkOrderDetailForm id={viewingId} onClose={() => setViewingId(null)} />}
      </FormModal>

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
    </div>);

}