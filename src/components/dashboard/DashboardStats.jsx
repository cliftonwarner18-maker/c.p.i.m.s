import React from 'react';
import { Bus, AlertTriangle, Wrench, ClipboardCheck } from 'lucide-react';

const StatBox = ({ icon: Icon, value, label, color }) => (
  <div style={{
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    padding: '2px 3px',
    borderTop: '2px solid hsl(220,15%,50%)',
    borderRight: '2px solid hsl(220,15%,96%)',
    borderBottom: '2px solid hsl(220,15%,96%)',
    borderLeft: '2px solid hsl(220,15%,50%)',
    background: 'hsl(220,15%,96%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0
  }}>
    <Icon style={{ width: 14, height: 14, color, marginBottom: '1px' }} />
    <div style={{ fontSize: '14px', fontWeight: 'bold', color, lineHeight: 1.1, marginBottom: '1px' }}>
      {value}
    </div>
    <div style={{ fontSize: '7px', fontWeight: 'bold', whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>
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
    <div style={{ display: 'flex', width: '100%', gap: 0, height: '52px' }}>
      <StatBox icon={Bus} value={totalBuses} label="TOTAL FLEET" color="hsl(220,70%,35%)" />
      <StatBox icon={AlertTriangle} value={pendingOrders} label="PENDING W/O" color="hsl(45,90%,40%)" />
      <StatBox icon={Wrench} value={inProgressOrders} label="IN PROGRESS" color="hsl(220,70%,45%)" />
      <StatBox icon={ClipboardCheck} value={completedOrders} label="COMPLETED" color="hsl(140,60%,30%)" />
      <StatBox icon={AlertTriangle} value={overdueInspections} label="INSP. OVERDUE" color="hsl(0,60%,45%)" />
    </div>
  );
}