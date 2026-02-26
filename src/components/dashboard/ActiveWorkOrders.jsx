import React from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ActiveWorkOrders({ workOrders }) {
  const active = workOrders
    .filter(w => w.status === 'Pending' || w.status === 'In Progress')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const statusClass = (s) => {
    if (s === 'Pending') return 'status-pending';
    if (s === 'In Progress') return 'status-progress';
    if (s === 'Completed') return 'status-completed';
    return 'status-cancelled';
  };

  return (
    <div className="win-panel-inset overflow-auto" style={{ maxHeight: '340px' }}>
      <table className="w-full text-[12px] font-mono">
        <thead>
          <tr className="bg-primary text-primary-foreground">
            <th className="p-1 text-left">ORDER#</th>
            <th className="p-1 text-left">DATE</th>
            <th className="p-1 text-left">BUS#</th>
            <th className="p-1 text-left">REPORTED BY</th>
            <th className="p-1 text-left">ISSUE</th>
            <th className="p-1 text-left">STATUS</th>
            <th className="p-1 text-left">ACTION</th>
          </tr>
        </thead>
        <tbody>
          {active.length === 0 && (
            <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">NO ACTIVE WORK ORDERS</td></tr>
          )}
          {active.map((wo, i) => (
            <tr key={wo.id} className={i % 2 === 0 ? 'bg-card' : 'bg-background'}>
              <td className="p-1 font-bold">{wo.order_number}</td>
              <td className="p-1">{moment(wo.created_date).format('MM/DD/YY HH:mm')}</td>
              <td className="p-1 font-bold">{wo.bus_number}</td>
              <td className="p-1">{wo.reported_by}</td>
              <td className="p-1 max-w-[200px] truncate">{wo.issue_description}</td>
              <td className={`p-1 font-bold ${statusClass(wo.status)}`}>
                [{wo.status.toUpperCase()}]
              </td>
              <td className="p-1">
                <Link 
                  to={createPageUrl('WorkOrderDetail') + `?id=${wo.id}`}
                  className="win-button !py-0 !px-2 text-[10px] inline-block no-underline text-foreground"
                >
                  OPEN
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}