import React from 'react';
import { Bus, AlertTriangle, Wrench, ClipboardCheck } from 'lucide-react';

export default function DashboardStats({ buses, workOrders, inspections }) {
  const totalBuses = buses.length;
  const pendingOrders = workOrders.filter(w => w.status === 'Pending').length;
  const inProgressOrders = workOrders.filter(w => w.status === 'In Progress').length;
  const completedOrders = workOrders.filter(w => w.status === 'Completed').length;
  
  const overdueInspections = buses.filter(b => {
    if (!b.next_inspection_due) return false;
    return new Date(b.next_inspection_due) < new Date();
  }).length;

  const stats = [
    { label: 'TOTAL FLEET', value: totalBuses, icon: Bus, color: 'text-primary' },
    { label: 'PENDING W/O', value: pendingOrders, icon: AlertTriangle, color: 'status-pending' },
    { label: 'IN PROGRESS', value: inProgressOrders, icon: Wrench, color: 'status-progress' },
    { label: 'COMPLETED', value: completedOrders, icon: ClipboardCheck, color: 'status-completed' },
    { label: 'INSP. OVERDUE', value: overdueInspections, icon: AlertTriangle, color: 'status-cancelled' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {stats.map((stat, i) => (
        <div key={i} className="win-panel-inset p-2 text-center">
          <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
          <div className={`text-2xl font-bold terminal-text ${stat.color}`}>{stat.value}</div>
          <div className="text-[10px] font-bold tracking-wider text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}