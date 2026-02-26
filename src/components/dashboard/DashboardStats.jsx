import React from 'react';
import { Bus, AlertTriangle, Wrench, ClipboardCheck } from 'lucide-react';

const StatBox = ({ icon: Icon, value, label, color }) => (
  <div style={{
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    padding: '8px 6px',
    borderTop: '2px solid hsl(220,15%,50%)',
    borderRight: '2px solid hsl(220,15%,96%)',
    borderBottom: '2px solid hsl(220,15%,96%)',
    borderLeft: '2px solid hsl(220,15%,50%)',
    background: 'hsl(220,15%,96%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px'
  }}>
    <Icon style={{ width: 16, height: 16, color }} />
    <div style={{ fontSize: '16px', fontWeight: 'bold', color, lineHeight: 1.2 }}>
      {value}
    </div>
    <div style={{ fontSize: '8px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
      {label}
    </div>
  </div>
);

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
    <div style={{ display: 'flex', width: '100%', gap: 0 }}>
      <StatBox icon={Bus} value={totalBuses} label="TOTAL FLEET" color="hsl(220,70%,35%)" />
      <StatBox icon={AlertTriangle} value={pendingOrders} label="PENDING W/O" color="hsl(45,90%,40%)" />
      <StatBox icon={Wrench} value={inProgressOrders} label="IN PROGRESS" color="hsl(220,70%,45%)" />
      <StatBox icon={ClipboardCheck} value={completedOrders} label="COMPLETED" color="hsl(140,60%,30%)" />
      <StatBox icon={AlertTriangle} value={overdueInspections} label="INSP. OVERDUE" color="hsl(0,60%,45%)" />
    </div>
  );
}