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

  return (
    <div style={{display: 'flex', gap: '8px', justifyContent: 'space-between'}}>
      <div style={{flex: 1, textAlign: 'center', padding: '4px', borderStyle: 'solid', borderWidth: '2px', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)'}}>
        <Bus style={{width: 16, height: 16, margin: '0 auto 2px'}} />
        <div style={{fontSize: '14px', fontWeight: 'bold', color: 'hsl(220,70%,35%)'}}>{totalBuses}</div>
        <div style={{fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.05em'}}> TOTAL FLEET</div>
      </div>
      <div style={{flex: 1, textAlign: 'center', padding: '4px', borderStyle: 'solid', borderWidth: '2px', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)'}}>
        <AlertTriangle style={{width: 16, height: 16, margin: '0 auto 2px', color: 'hsl(45,90%,40%)'}} />
        <div style={{fontSize: '14px', fontWeight: 'bold', color: 'hsl(45,90%,40%)'}}>{pendingOrders}</div>
        <div style={{fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.05em'}}>PENDING W/O</div>
      </div>
      <div style={{flex: 1, textAlign: 'center', padding: '4px', borderStyle: 'solid', borderWidth: '2px', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)'}}>
        <Wrench style={{width: 16, height: 16, margin: '0 auto 2px', color: 'hsl(220,70%,45%)'}} />
        <div style={{fontSize: '14px', fontWeight: 'bold', color: 'hsl(220,70%,45%)'}}>{inProgressOrders}</div>
        <div style={{fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.05em'}}>IN PROGRESS</div>
      </div>
      <div style={{flex: 1, textAlign: 'center', padding: '4px', borderStyle: 'solid', borderWidth: '2px', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)'}}>
        <ClipboardCheck style={{width: 16, height: 16, margin: '0 auto 2px', color: 'hsl(140,60%,30%)'}} />
        <div style={{fontSize: '14px', fontWeight: 'bold', color: 'hsl(140,60%,30%)'}}>{completedOrders}</div>
        <div style={{fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.05em'}}>COMPLETED</div>
      </div>
      <div style={{flex: 1, textAlign: 'center', padding: '4px', borderStyle: 'solid', borderWidth: '2px', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)'}}>
        <AlertTriangle style={{width: 16, height: 16, margin: '0 auto 2px', color: 'hsl(0,60%,45%)'}} />
        <div style={{fontSize: '14px', fontWeight: 'bold', color: 'hsl(0,60%,45%)'}}>{overdueInspections}</div>
        <div style={{fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.05em'}}>INSP. OVERDUE</div>
      </div>
    </div>
  );
}