import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FileDown } from 'lucide-react';
import moment from 'moment';
import { exportWashBayHoursPDF } from '../../utils/exports/exportWashBayHours';

const FF = "'Courier Prime', monospace";

export default function WashBayHoursReport() {
  const [selectedWasher, setSelectedWasher] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['busWashOrdersReport'],
    queryFn: () => base44.entities.BusWashOrder.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['systemUsersReport'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });

  // Get unique washers from completed orders
  const allWashers = new Set();
  orders.forEach(o => {
    if (o.status === 'Completed' && o.washers) {
      o.washers.forEach(w => allWashers.add(w));
    }
  });

  const filtered = orders.filter(order => {
    if (order.status !== 'Completed') return false;
    if (!order.washers || order.washers.length === 0) return false;
    if (selectedWasher && !order.washers.includes(selectedWasher)) return false;
    if (startDate && new Date(order.completed_date || order.assigned_date) < new Date(startDate)) return false;
    if (endDate && new Date(order.completed_date || order.assigned_date) > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const totalMinutes = filtered.reduce((sum, o) => sum + (o.elapsed_time_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);

  const hoursByWasher = {};
  filtered.forEach(order => {
    if (order.washers) {
      order.washers.forEach(washer => {
        if (!hoursByWasher[washer]) hoursByWasher[washer] = 0;
        hoursByWasher[washer] += (order.elapsed_time_minutes || 0) / 60;
      });
    }
  });

  const handleExport = () => {
    if (filtered.length === 0) return;
    setExporting(true);
    try {
      const sorted = [...filtered].sort((a, b) => new Date(a.completed_date || a.assigned_date) - new Date(b.completed_date || b.assigned_date));
      const expandedRows = [];
      sorted.forEach(order => {
        const washers = (order.washers && order.washers.length > 0) ? order.washers : ['—'];
        washers.forEach(washer => expandedRows.push({ order, washer }));
      });
      const rows = selectedWasher
        ? expandedRows.filter(r => r.washer === selectedWasher)
        : expandedRows;
      exportWashBayHoursPDF({ rows, selectedWasher, startDate, endDate });
    } finally {
      setExporting(false);
    }
  };

  const inp = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(280,55%,32%), hsl(280,50%,42%))', color: 'white', padding: '8px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
        WASH BAY HOURS REPORT
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: 3 }}>WASHER</div>
            <select value={selectedWasher} onChange={e => setSelectedWasher(e.target.value)} style={{ ...inp, minWidth: 180 }}>
              <option value="">All Washers</option>
              {Array.from(allWashers).sort().map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: 3 }}>FROM DATE</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} />
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: 3 }}>TO DATE</div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inp} />
          </div>
          <button onClick={handleExport} disabled={exporting || filtered.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
            <FileDown style={{ width: 13, height: 13 }} /> {exporting ? 'EXPORTING...' : 'EXPORT PDF'}
          </button>
        </div>
        <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', padding: '8px 12px', display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '11px' }}>
          <span><strong>{filtered.length}</strong> wash orders</span>
          <span><strong>{totalHours}</strong> hrs total elapsed | individual credits counted per washer per wash</span>
        </div>
      </div>
    </div>
  );
}