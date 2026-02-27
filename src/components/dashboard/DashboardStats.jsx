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
    <div style={{display:'grid !important',gridTemplateColumns:'repeat(5, 1fr) !important',width:'100% !important',maxWidth:'100% !important',margin:'0 !important',padding:'8px !important',background:'hsl(220,20%,10%)',border:'2px solid hsl(220,70%,35%)',boxSizing:'border-box !important',gap:'4px'}}>
      {stats.map((stat, i) => (
        <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'16px 12px',background:'hsl(220,20%,8%)',border:'2px solid',borderColor:stat.color,boxShadow:`0 0 12px ${stat.color}40`,minHeight:'100px',boxSizing:'border-box'}}>
          <stat.icon style={{width:'28px',height:'28px',color:stat.color,marginBottom:'8px',filter:'drop-shadow(0 0 4px ' + stat.color + ')'}} />
          <div style={{fontSize:'36px',fontWeight:'bold',color:stat.color,lineHeight:'1',margin:'0',textShadow:`0 0 10px ${stat.color}`}}>{stat.value}</div>
          <div style={{fontSize:'12px',fontWeight:'bold',whiteSpace:'nowrap',letterSpacing:'0.08em',lineHeight:'1.3',margin:'8px 0 0 0',color:stat.color,textTransform:'uppercase',textShadow:`0 0 6px ${stat.color}`}}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}