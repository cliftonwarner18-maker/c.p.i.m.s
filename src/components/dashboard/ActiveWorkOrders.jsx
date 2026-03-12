import React, { useState } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { FileDown } from 'lucide-react';

const FF = "'Courier Prime', monospace";

const statusColor = (s) => {
  if (s === 'Pending') return 'hsl(45,90%,38%)';
  if (s === 'In Progress') return 'hsl(220,65%,42%)';
  if (s === 'Completed') return 'hsl(140,55%,30%)';
  return 'hsl(0,60%,45%)';
};

export default function ActiveWorkOrders({ workOrders }) {
  const [isExporting, setIsExporting] = useState(false);
  const [filterType, setFilterType] = useState('All');
  
  const active = workOrders
    .filter(w => w.status === 'Pending' || w.status === 'In Progress')
    .filter(w => filterType === 'All' || w.work_order_type === filterType)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const handleExportFieldPDF = async () => {
    setIsExporting(true);
    const response = await base44.functions.invoke('exportFieldWorkOrders');
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'field-work-orders.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    setIsExporting(false);
  };

  const repairTypes = ['All', 'Camera Repair', 'Radio Repair', 'Seat Repair', 'Other'];
  
  const cameraOrders = workOrders.filter(w => (w.status === 'Pending' || w.status === 'In Progress') && w.work_order_type === 'Camera Repair').length;
  const radioOrders = workOrders.filter(w => (w.status === 'Pending' || w.status === 'In Progress') && w.work_order_type === 'Radio Repair').length;
  const seatOrders = workOrders.filter(w => (w.status === 'Pending' || w.status === 'In Progress') && w.work_order_type === 'Seat Repair').length;
  const otherOrders = workOrders.filter(w => (w.status === 'Pending' || w.status === 'In Progress') && w.work_order_type === 'Other').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(45,90%,32%), hsl(45,85%,42%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>⚠️ ACTIVE WORK ORDERS — PENDING REPAIRS</span>
        <button onClick={handleExportFieldPDF} disabled={isExporting} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', fontSize: '9px', fontFamily: FF, fontWeight: '700', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '2px', cursor: isExporting ? 'not-allowed' : 'pointer', opacity: isExporting ? 0.5 : 1 }}>
          <FileDown style={{ width: 10, height: 10 }} /> {isExporting ? 'EXPORTING...' : 'EXPORT'}
        </button>
      </div>
      
      <div style={{ padding: '8px 12px', background: 'hsl(220,10%,98%)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,30%)', marginRight: 'auto' }}>Filter by Type:</div>
        {repairTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '4px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', borderRadius: '2px',
              background: filterType === type ? 'hsl(220,55%,40%)' : 'hsl(220,18%,88%)',
              color: filterType === type ? 'white' : 'hsl(220,20%,20%)',
              border: `1px solid ${filterType === type ? 'hsl(220,55%,30%)' : 'hsl(220,18%,70%)'}`,
              cursor: 'pointer'
            }}
          >
            {type}{type !== 'All' && ` (${type === 'Camera Repair' ? cameraOrders : type === 'Radio Repair' ? radioOrders : type === 'Seat Repair' ? seatOrders : otherOrders})`}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 12px' }}>
      <div style={{ maxHeight: 480, overflowY: 'auto', width: '100%' }}>
      <table style={{ width: '100%', fontSize: '11px', fontFamily: FF, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0 }}>
            {['ORDER#', 'TYPE', 'DATE', 'BUS#', 'REPORTED BY', 'ISSUE', 'STATUS', 'ACTION'].map(h => (
              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.length === 0 && (
            <tr><td colSpan={7} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontFamily: FF }}>NO ACTIVE WORK ORDERS</td></tr>
          )}
          {active.map((wo, i) => (
            <tr key={wo.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
              <td style={{ padding: '5px 8px', fontWeight: '700' }}>{wo.order_number}</td>
              <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{moment(wo.created_date).format('MM/DD/YY HH:mm')}</td>
              <td style={{ padding: '5px 8px', fontWeight: '700' }}>{wo.bus_number}</td>
              <td style={{ padding: '5px 8px' }}>{wo.reported_by}</td>
              <td style={{ padding: '5px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.issue_description}</td>
              <td style={{ padding: '5px 8px', fontWeight: '700', color: statusColor(wo.status), whiteSpace: 'nowrap' }}>[{wo.status?.toUpperCase()}]</td>
              <td style={{ padding: '5px 8px' }}>
                <Link to={createPageUrl('WorkOrderDetail') + `?id=${wo.id}`}
                  style={{ display: 'inline-block', padding: '2px 8px', fontSize: '10px', fontFamily: FF, fontWeight: '700', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', textDecoration: 'none', cursor: 'pointer' }}>
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