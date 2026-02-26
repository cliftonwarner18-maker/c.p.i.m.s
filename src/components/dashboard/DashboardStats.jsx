import React from 'react';
import { Bus, AlertTriangle, Wrench, ClipboardCheck } from 'lucide-react';

const containerStyle = {
  display: 'flex',
  width: '100%',
  gap: 0,
  height: '50px',
  margin: 0,
  padding: 0,
  boxSizing: 'border-box'
};

const boxStyle = {
  flex: 1,
  minWidth: 0,
  textAlign: 'center',
  padding: '2px 4px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1px',
  height: '100%',
  boxSizing: 'border-box',
  overflow: 'hidden',
  background: 'hsl(220,15%,96%)',
  borderTop: '2px solid hsl(220,15%,50%)',
  borderRight: '2px solid hsl(220,15%,96%)',
  borderBottom: '2px solid hsl(220,15%,96%)',
  borderLeft: '2px solid hsl(220,15%,50%)'
};

const StatBox = ({ icon: Icon, value, label, color }) => (
  <div style={boxStyle}>
    <Icon style={{ width: 12, height: 12, color, flexShrink: 0, margin: 0 }} />
    <div style={{ fontSize: '11px', fontWeight: 'bold', color, lineHeight: 1, flexShrink: 0, margin: 0 }}>
      {value}
    </div>
    <div style={{ fontSize: '6px', fontWeight: 'bold', whiteSpace: 'nowrap', letterSpacing: '0.02em', lineHeight: 1, margin: 0 }}>
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
    <div style={containerStyle}>
      <StatBox icon={Bus} value={totalBuses} label="TOTAL FLEET" color="hsl(220,70%,35%)" />
      <StatBox icon={AlertTriangle} value={pendingOrders} label="PENDING W/O" color="hsl(45,90%,40%)" />
      <StatBox icon={Wrench} value={inProgressOrders} label="IN PROGRESS" color="hsl(220,70%,45%)" />
      <StatBox icon={ClipboardCheck} value={completedOrders} label="COMPLETED" color="hsl(140,60%,30%)" />
      <StatBox icon={AlertTriangle} value={overdueInspections} label="INSP. OVERDUE" color="hsl(0,60%,45%)" />
    </div>
  );
}