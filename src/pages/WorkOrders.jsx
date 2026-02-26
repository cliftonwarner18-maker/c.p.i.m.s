import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { Search, Filter, Trash2 } from 'lucide-react';

export default function WorkOrders() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const filtered = workOrders.filter(wo => {
    const matchStatus = statusFilter === 'All' || wo.status === statusFilter;
    const matchSearch = !search || 
      wo.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.bus_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.reported_by?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkOrder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workOrders'] }),
  });

  const handleDelete = (wo) => {
    if (window.confirm(`DELETE work order ${wo.order_number} for Bus #${wo.bus_number}? This cannot be undone.`)) {
      deleteMutation.mutate(wo.id);
    }
  };

  const statusClass = (s) => {
    if (s === 'Pending') return 'status-pending';
    if (s === 'In Progress') return 'status-progress';
    if (s === 'Completed') return 'status-completed';
    return 'status-cancelled';
  };

  return (
    <div className="space-y-2">
      <WinWindow title="ALL WORK ORDERS — SURVEILLANCE REPAIR LOG" icon="📋">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span className="text-[11px] font-bold">STATUS:</span>
            {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => (
              <button
                key={s}
                className={`win-button !py-0 !px-2 text-[10px] ${statusFilter === s ? '!bg-primary !text-primary-foreground' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Search className="w-3 h-3" />
            <input
              className="win-input text-[11px] w-48"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="win-panel-inset overflow-auto" style={{ maxHeight: '500px' }}>
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="bg-primary text-primary-foreground sticky top-0">
                <th className="p-1 text-left">ORDER#</th>
                <th className="p-1 text-left">DATE</th>
                <th className="p-1 text-left">BUS#</th>
                <th className="p-1 text-left">REPORTED BY</th>
                <th className="p-1 text-left">ISSUE</th>
                <th className="p-1 text-left">STATUS</th>
                <th className="p-1 text-left">TECHNICIAN</th>
                <th className="p-1 text-left">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">NO RECORDS FOUND</td></tr>
              )}
              {filtered.map((wo, i) => (
                <tr key={wo.id} className={i % 2 === 0 ? 'bg-card' : 'bg-background'}>
                  <td className="p-1 font-bold">{wo.order_number}</td>
                  <td className="p-1">{moment(wo.created_date).format('MM/DD/YY HH:mm')}</td>
                  <td className="p-1 font-bold">{wo.bus_number}</td>
                  <td className="p-1">{wo.reported_by}</td>
                  <td className="p-1 max-w-[200px] truncate">{wo.issue_description}</td>
                  <td className={`p-1 font-bold ${statusClass(wo.status)}`}>[{wo.status?.toUpperCase()}]</td>
                  <td className="p-1">{wo.technician_name || '—'}</td>
                  <td className="p-1 flex gap-1">
                    <Link
                      to={createPageUrl('WorkOrderDetail') + `?id=${wo.id}`}
                      className="win-button !py-0 !px-2 text-[10px] inline-block no-underline text-foreground"
                    >
                      OPEN
                    </Link>
                    <button
                      className="win-button !py-0 !px-2 text-[10px] !bg-destructive !text-destructive-foreground flex items-center gap-0.5"
                      onClick={() => handleDelete(wo)}
                    >
                      <Trash2 className="w-3 h-3" /> DEL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          SHOWING {filtered.length} OF {workOrders.length} RECORDS
        </div>
      </WinWindow>
    </div>
  );
}