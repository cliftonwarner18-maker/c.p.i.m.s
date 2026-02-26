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
    <div style={{display:'grid',gridTemplateColumns:'repeat(5, 1fr)',width:'100%',gap:'2px',padding:'4px'}}>
      {stats.map((stat, i) => (
        <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'12px 8px',background:'hsl(220,15%,96%)',border:'2px solid hsl(220,15%,50%)',minHeight:'90px',boxSizing:'border-box'}}>
          <stat.icon style={{width:'24px',height:'24px',color:stat.color,marginBottom:'6px'}} />
          <div style={{fontSize:'28px',fontWeight:'bold',color:stat.color,lineHeight:'1',margin:'0'}}>{stat.value}</div>
          <div style={{fontSize:'11px',fontWeight:'bold',whiteSpace:'nowrap',letterSpacing:'0.05em',lineHeight:'1.2',margin:'6px 0 0 0',color:'hsl(220,10%,40%)'}}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}