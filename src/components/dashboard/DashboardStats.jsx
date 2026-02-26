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
    <div style={{display:'flex',width:'100%',height:'50px',margin:'-2px -2px -2px -2px',padding:'0',gap:'0',boxSizing:'border-box'}}>
      {stats.map((stat, i) => (
        <div key={i} style={{flex:'1',minWidth:'0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'2px 4px',boxSizing:'border-box',height:'100%',background:'hsl(220,15%,96%)',borderTop:'2px solid hsl(220,15%,50%)',borderRight:'2px solid hsl(220,15%,96%)',borderBottom:'2px solid hsl(220,15%,96%)',borderLeft:'2px solid hsl(220,15%,50%)'}}>
          <stat.icon style={{width:12,height:12,color:stat.color,margin:'0',flexShrink:0}} />
          <div style={{fontSize:'11px',fontWeight:'bold',color:stat.color,lineHeight:'1',margin:'0',flexShrink:0}}>{stat.value}</div>
          <div style={{fontSize:'6px',fontWeight:'bold',whiteSpace:'nowrap',letterSpacing:'0.02em',lineHeight:'1',margin:'0'}}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}