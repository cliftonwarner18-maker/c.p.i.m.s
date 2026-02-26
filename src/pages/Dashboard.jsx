import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import DashboardStats from '../components/dashboard/DashboardStats';
import ActiveWorkOrders from '../components/dashboard/ActiveWorkOrders';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, PlusCircle, Bus, ClipboardCheck } from 'lucide-react';
import moment from 'moment';

export default function Dashboard() {
  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('-created_date'),
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date'),
  });

  const recentCompleted = workOrders
    .filter(w => w.status === 'Completed')
    .slice(0, 5);

  const overdueInspections = buses.filter(b => {
    if (!b.next_inspection_due) return false;
    return new Date(b.next_inspection_due) < new Date();
  });

  return (
    <div className="space-y-2">
      {/* Header Banner */}
      <div className="win-panel-inset bg-primary/5 p-4 text-center border-4 border-primary/30">
        <div className="flex items-center justify-center gap-3 mb-1">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/89c560c96_state.jpg" className="w-12 h-12 object-contain" />
          <div>
            <div className="text-[11px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
              State of North Carolina — Dept. of Public Instruction
            </div>
            <div className="text-xl font-bold text-primary tracking-[0.2em] uppercase">
              School Bus Surveillance System
            </div>
            <div className="text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
              Camera Repair &amp; Maintenance Management Database
            </div>
          </div>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/89c560c96_state.jpg" className="w-12 h-12 object-contain" />
        </div>
      </div>

      {/* Stats */}
      <WinWindow title="SYSTEM STATUS OVERVIEW" icon="📊">
        <DashboardStats buses={buses} workOrders={workOrders} inspections={inspections} />
      </WinWindow>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        <Link to={createPageUrl('NewWorkOrder')} className="win-button flex items-center gap-1 text-[12px] no-underline text-foreground">
          <PlusCircle className="w-4 h-4" /> NEW WORK ORDER
        </Link>
        <Link to={createPageUrl('FleetManager')} className="win-button flex items-center gap-1 text-[12px] no-underline text-foreground">
          <Bus className="w-4 h-4" /> MANAGE FLEET
        </Link>
        <Link to={createPageUrl('Inspections')} className="win-button flex items-center gap-1 text-[12px] no-underline text-foreground">
          <ClipboardCheck className="w-4 h-4" /> INSPECTIONS
        </Link>
      </div>

      {/* Active Work Orders - full width */}
      <WinWindow title="ACTIVE WORK ORDERS — PENDING REPAIRS" icon="⚠️">
        <ActiveWorkOrders workOrders={workOrders} />
      </WinWindow>

      {/* Overdue Inspections - full width */}
      <WinWindow title="OVERDUE INSPECTIONS" icon="🔴">
        <div className="win-panel-inset p-1 overflow-auto" style={{ maxHeight: '400px', minHeight: '80px' }}>
          {overdueInspections.length === 0 ? (
            <div className="text-center text-[11px] p-3 text-muted-foreground">NO OVERDUE INSPECTIONS</div>
          ) : (
            overdueInspections.map(b => (
              <div key={b.id} className="flex items-center justify-between text-[12px] p-2 border-b border-border hover:bg-secondary/40">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 status-cancelled flex-shrink-0" />
                  <div>
                    <div className="font-bold">BUS #{b.bus_number}</div>
                    <div className="text-[10px] text-muted-foreground">{b.year} {b.make} {b.model}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="status-cancelled font-bold text-[11px]">OVERDUE</div>
                  <div className="font-bold text-[11px]">DUE: {moment(b.next_inspection_due).format('MM/DD/YY')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </WinWindow>

      {/* Recently Completed */}
      <WinWindow title="RECENTLY COMPLETED REPAIRS" icon="✅">
        <div className="win-panel-inset p-1 overflow-auto" style={{ maxHeight: '320px', minHeight: '80px' }}>
          {recentCompleted.length === 0 ? (
            <div className="text-center text-[11px] p-3 text-muted-foreground">NO COMPLETED REPAIRS</div>
          ) : (
            recentCompleted.map(wo => (
              <div key={wo.id} className="text-[11px] p-2 border-b border-border hover:bg-secondary/40">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{wo.order_number} — BUS #{wo.bus_number}</span>
                  <span className="status-completed font-bold">[DONE]</span>
                </div>
                <div className="text-muted-foreground truncate">{wo.repairs_rendered}</div>
                {wo.technician_name && <div className="text-[10px] text-muted-foreground">TECH: {wo.technician_name}</div>}
              </div>
            ))
          )}
        </div>
      </WinWindow>

      {/* System Log Footer */}
      <div className="win-panel-inset p-2 text-[10px] font-mono text-muted-foreground">
        <div>&gt; SYSTEM INITIALIZED — NC DPI MOBILE VEHICLE SURVEILLANCE INSPECTION SYSTEM</div>
        <div>&gt; DATABASE CONNECTION: <span className="status-completed font-bold">ONLINE</span></div>
        <div>&gt; TOTAL RECORDS: {buses.length} VEHICLES | {workOrders.length} WORK ORDERS | {inspections.length} INSPECTIONS</div>
        <div>&gt; SESSION ACTIVE — {moment().format('dddd, MMMM D, YYYY HH:mm:ss')}</div>
      </div>
    </div>
  );
}