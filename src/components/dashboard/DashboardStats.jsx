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
    <table style={{width: '100%', borderCollapse: 'collapse'}}>
      <tbody>
        <tr>
          <td style={{flex: 1, textAlign: 'center', padding: '8px', border: '2px solid', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)', background: 'hsl(220,15%,96%)', width: '20%'}}>
            <div><Bus style={{width: 18, height: 18, margin: '0 auto', color: 'hsl(220,70%,35%)'}} /></div>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: 'hsl(220,70%,35%)'}}>{totalBuses}</div>
            <div style={{fontSize: '9px', fontWeight: 'bold', marginTop: '2px'}}>TOTAL FLEET</div>
          </td>
          <td style={{textAlign: 'center', padding: '8px', border: '2px solid', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)', background: 'hsl(220,15%,96%)', width: '20%'}}>
            <div><AlertTriangle style={{width: 18, height: 18, margin: '0 auto', color: 'hsl(45,90%,40%)'}} /></div>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: 'hsl(45,90%,40%)'}}>{pendingOrders}</div>
            <div style={{fontSize: '9px', fontWeight: 'bold', marginTop: '2px'}}>PENDING W/O</div>
          </td>
          <td style={{textAlign: 'center', padding: '8px', border: '2px solid', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)', background: 'hsl(220,15%,96%)', width: '20%'}}>
            <div><Wrench style={{width: 18, height: 18, margin: '0 auto', color: 'hsl(220,70%,45%)'}} /></div>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: 'hsl(220,70%,45%)'}}>{inProgressOrders}</div>
            <div style={{fontSize: '9px', fontWeight: 'bold', marginTop: '2px'}}>IN PROGRESS</div>
          </td>
          <td style={{textAlign: 'center', padding: '8px', border: '2px solid', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)', background: 'hsl(220,15%,96%)', width: '20%'}}>
            <div><ClipboardCheck style={{width: 18, height: 18, margin: '0 auto', color: 'hsl(140,60%,30%)'}} /></div>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: 'hsl(140,60%,30%)'}}>{completedOrders}</div>
            <div style={{fontSize: '9px', fontWeight: 'bold', marginTop: '2px'}}>COMPLETED</div>
          </td>
          <td style={{textAlign: 'center', padding: '8px', border: '2px solid', borderColor: 'hsl(220,15%,50%) hsl(220,15%,96%) hsl(220,15%,96%) hsl(220,15%,50%)', background: 'hsl(220,15%,96%)', width: '20%'}}>
            <div><AlertTriangle style={{width: 18, height: 18, margin: '0 auto', color: 'hsl(0,60%,45%)'}} /></div>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: 'hsl(0,60%,45%)'}}>{overdueInspections}</div>
            <div style={{fontSize: '9px', fontWeight: 'bold', marginTop: '2px'}}>INSP. OVERDUE</div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}