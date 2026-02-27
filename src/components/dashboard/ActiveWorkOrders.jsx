import React, { useState } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { FileDown } from 'lucide-react';

export default function ActiveWorkOrders({ workOrders }) {
  const [isExporting, setIsExporting] = useState(false);
  
  const active = workOrders
    .filter(w => w.status === 'Pending' || w.status === 'In Progress')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data } = await base44.functions.invoke('exportActiveWorkOrders', {});
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'active-work-orders.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('Error exporting PDF: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const statusClass = (s) => {
    if (s === 'Pending') return 'status-pending';
    if (s === 'In Progress') return 'status-progress';
    if (s === 'Completed') return 'status-completed';
    return 'status-cancelled';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="win-button"
        style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',background:isExporting ? 'hsl(220,15%,75%)' : 'hsl(220,70%,35%)',color:'white',width:'fit-content'}}
      >
        <FileDown style={{width:12,height:12}} /> {isExporting ? 'EXPORTING...' : 'EXPORT PDF'}
      </button>
      <div className="win-panel-inset overflow-auto" style={{ display: 'block', width: '100%', maxHeight: '520px', minHeight: '100px', boxSizing: 'border-box' }}>
      <table className="w-full text-[12px] font-mono" style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}>
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
      </div>
      );
      }