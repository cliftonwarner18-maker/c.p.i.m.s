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
    { icon: Bus, value: totalBuses, label: 'TOTAL FLEET', color: 'hsl(220,70%,35%)' },
    { icon: AlertTriangle, value: pendingOrders, label: 'PENDING W/O', color: 'hsl(45,90%,40%)' },
    { icon: Wrench, value: inProgressOrders, label: 'IN PROGRESS', color: 'hsl(220,70%,45%)' },
    { icon: ClipboardCheck, value: completedOrders, label: 'COMPLETED', color: 'hsl(140,60%,30%)' },
    { icon: AlertTriangle, value: overdueInspections, label: 'INSP. OVERDUE', color: 'hsl(0,60%,45%)' }
  ];

  return (
    <div className="dashboard-stats-wrapper" style={{display:'flex !important',width:'100% !important',height:'50px !important',margin:'0 !important',padding:'0 !important',gap:'0 !important',boxSizing:'border-box !important',flexShrink:0}}>
      {stats.map((stat, i) => (
        <div key={i} className="dashboard-stat-item" style={{flex:'1 !important',minWidth:'0 !important',display:'flex !important',flexDirection:'column !important',alignItems:'center !important',justifyContent:'center !important',textAlign:'center !important',padding:'2px 4px !important',boxSizing:'border-box !important',height:'50px !important',background:'hsl(220,15%,96%) !important',borderTop:'2px solid hsl(220,15%,50%) !important',borderRight:'2px solid hsl(220,15%,96%) !important',borderBottom:'2px solid hsl(220,15%,96%) !important',borderLeft:'2px solid hsl(220,15%,50%) !important',flexShrink:'0 !important'}}>
          <stat.icon style={{width:'12px !important',height:'12px !important',color:stat.color,margin:'0 !important',flexShrink:'0 !important',lineHeight:'1 !important'}} />
          <div style={{fontSize:'11px !important',fontWeight:'bold !important',color:stat.color,lineHeight:'1 !important',margin:'0 !important',flexShrink:'0 !important'}}>{stat.value}</div>
          <div style={{fontSize:'6px !important',fontWeight:'bold !important',whiteSpace:'nowrap !important',letterSpacing:'0.02em !important',lineHeight:'1 !important',margin:'0 !important'}}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}