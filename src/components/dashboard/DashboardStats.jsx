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

  const box = (icon, value, label, color) => (
    <div style={{flex: '1', minWidth: '0', textAlign: 'center', padding: '6px 4px', borderStyle: 'solid', borderWidth: '2px', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)', background: 'hsl(220,15%,96%)'}}>
      <div style={{display: 'flex', justifyContent: 'center', marginBottom: '2px'}}>{icon}</div>
      <div style={{fontSize: '16px', fontWeight: 'bold', color, lineHeight: '1'}}>{value}</div>
      <div style={{fontSize: '8px', fontWeight: 'bold', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{label}</div>
    </div>
  );

  return (
    <div style={{display: 'flex', gap: '6px', width: '100%'}}>
      {box(<Bus style={{width: 14, height: 14, color: 'hsl(220,70%,35%)'}} />, totalBuses, 'TOTAL FLEET', 'hsl(220,70%,35%)')}
      {box(<AlertTriangle style={{width: 14, height: 14, color: 'hsl(45,90%,40%)'}} />, pendingOrders, 'PENDING W/O', 'hsl(45,90%,40%)')}
      {box(<Wrench style={{width: 14, height: 14, color: 'hsl(220,70%,45%)'}} />, inProgressOrders, 'IN PROGRESS', 'hsl(220,70%,45%)')}
      {box(<ClipboardCheck style={{width: 14, height: 14, color: 'hsl(140,60%,30%)'}} />, completedOrders, 'COMPLETED', 'hsl(140,60%,30%)')}
      {box(<AlertTriangle style={{width: 14, height: 14, color: 'hsl(0,60%,45%)'}} />, overdueInspections, 'INSP. OVERDUE', 'hsl(0,60%,45%)')}
    </div>
  );
}