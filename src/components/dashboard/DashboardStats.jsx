import React from 'react';
import { Bus, AlertTriangle, Wrench, ClipboardCheck } from 'lucide-react';

export default function DashboardStats({ buses, workOrders, inspections }) {
  const stats = [
    { icon: Bus, value: buses.length, label: 'TOTAL FLEET', color: 'hsl(220,60%,42%)' },
    { icon: AlertTriangle, value: workOrders.filter(w => w.status === 'Pending').length, label: 'PENDING W/O', color: 'hsl(45,85%,40%)' },
    { icon: Wrench, value: workOrders.filter(w => w.status === 'In Progress').length, label: 'IN PROGRESS', color: 'hsl(200,70%,42%)' },
    { icon: ClipboardCheck, value: workOrders.filter(w => w.status === 'Completed').length, label: 'COMPLETED', color: 'hsl(140,55%,32%)' },
    { icon: AlertTriangle, value: buses.filter(b => b.next_inspection_due && new Date(b.next_inspection_due) < new Date()).length, label: 'INSP. OVERDUE', color: 'hsl(0,60%,45%)' },
  ];

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {stats.map((stat, i) => (
        <div key={i} style={{ flex: '1 1 100px', background: 'white', border: `1px solid hsl(220,18%,78%)`, borderLeft: `3px solid ${stat.color}`, borderRadius: '2px', padding: '10px 14px', minWidth: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <stat.icon style={{ width: 14, height: 14, color: stat.color }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.07em', color: 'hsl(220,10%,45%)', marginTop: 4, textTransform: 'uppercase' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}