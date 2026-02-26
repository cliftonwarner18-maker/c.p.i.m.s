import React from 'react';
import { Bus, AlertTriangle, Wrench, ClipboardCheck } from 'lucide-react';

const StatBox = ({ icon: Icon, value, label, color }) => (
  <div className="dashboard-stat-box">
    <Icon style={{ width: 12, height: 12, color, flexShrink: 0, margin: 0 }} />
    <div style={{ fontSize: '11px', fontWeight: 'bold', color, lineHeight: 1, flexShrink: 0, margin: 0 }}>
      {value}
    </div>
    <div style={{ fontSize: '6px', fontWeight: 'bold', whiteSpace: 'nowrap', letterSpacing: '0.02em', lineHeight: 1, margin: 0 }}>
      {label}
    </div>
  </div>
);

// v2
export default function DashboardStats({ buses, workOrders, inspections }) {
  const totalBuses = buses.length;
  const pendingOrders = workOrders.filter(w => w.status === 'Pending').length;
  const inProgressOrders = workOrders.filter(w => w.status === 'In Progress').length;
  const completedOrders = workOrders.filter(w => w.status === 'Completed').length;
  const overdueInspections = buses.filter(b => {
    if (!b.next_inspection_due) return false;
    return new Date(b.next_inspection_due) < new Date();
  }).length;

  return (
    <div className="dashboard-stats-container">
      <StatBox icon={Bus} value={totalBuses} label="TOTAL FLEET" color="hsl(220,70%,35%)" />
      <StatBox icon={AlertTriangle} value={pendingOrders} label="PENDING W/O" color="hsl(45,90%,40%)" />
      <StatBox icon={Wrench} value={inProgressOrders} label="IN PROGRESS" color="hsl(220,70%,45%)" />
      <StatBox icon={ClipboardCheck} value={completedOrders} label="COMPLETED" color="hsl(140,60%,30%)" />
      <StatBox icon={AlertTriangle} value={overdueInspections} label="INSP. OVERDUE" color="hsl(0,60%,45%)" />
    </div>
  );
}