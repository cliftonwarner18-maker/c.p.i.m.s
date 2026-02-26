import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import DashboardStats from '../components/dashboard/DashboardStats';
import ActiveWorkOrders from '../components/dashboard/ActiveWorkOrders';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Monitor, AlertTriangle, PlusCircle, Bus, ClipboardCheck } from 'lucide-react';
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
      <div className="win-panel-inset bg-primary/5 p-3 text-center">
        <div className="terminal-text text-2xl font-bold text-primary tracking-widest">
          ╔══════════════════════════════════════════════════╗
        </div>
        <div className="terminal-text text-xl font-bold text-primary tracking-[0.3em]">
          SCHOOL BUS SURVEILLANCE SYSTEM
        </div>
        <div className="terminal-text text-sm text-muted-foreground tracking-[0.2em]">
          CAMERA REPAIR & MAINTENANCE MANAGEMENT
        </div>
        <div className="terminal-text text-2xl font-bold text-primary tracking-widest">
          ╚══════════════════════════════════════════════════╝
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Active Work Orders - takes 2 cols */}
        <div className="lg:col-span-2">
          <WinWindow title="ACTIVE WORK ORDERS — PENDING REPAIRS" icon="⚠️">
            <ActiveWorkOrders workOrders={workOrders} />
          </WinWindow>
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {/* Overdue Inspections */}
          <WinWindow title="OVERDUE INSPECTIONS" icon="🔴">
            <div className="win-panel-inset p-1 max-h-[150px] overflow-auto">
              {overdueInspections.length === 0 ? (
                <div className="text-center text-[11px] p-2 text-muted-foreground">NO OVERDUE INSPECTIONS</div>
              ) : (
                overdueInspections.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-[11px] p-1 border-b border-border">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 status-cancelled" />
                      <span className="font-bold">BUS #{b.bus_number}</span>
                    </div>
                    <span className="status-cancelled font-bold">
                      DUE: {moment(b.next_inspection_due).format('MM/DD/YY')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </WinWindow>

          {/* Recent Completed */}
          <WinWindow title="RECENTLY COMPLETED REPAIRS" icon="✅">
            <div className="win-panel-inset p-1 max-h-[150px] overflow-auto">
              {recentCompleted.length === 0 ? (
                <div className="text-center text-[11px] p-2 text-muted-foreground">NO COMPLETED REPAIRS</div>
              ) : (
                recentCompleted.map(wo => (
                  <div key={wo.id} className="text-[11px] p-1 border-b border-border">
                    <div className="flex justify-between">
                      <span className="font-bold">{wo.order_number} — BUS #{wo.bus_number}</span>
                      <span className="status-completed">[COMPLETED]</span>
                    </div>
                    <div className="text-muted-foreground truncate">{wo.repairs_rendered}</div>
                  </div>
                ))
              )}
            </div>
          </WinWindow>
        </div>
      </div>

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