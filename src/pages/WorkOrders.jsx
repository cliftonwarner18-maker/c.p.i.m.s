import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, Plus, Search, Eye, Trash2, Filter } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";

const STATUS_COLORS = {
  Pending:     { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  'In Progress': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  Completed:   { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  Cancelled:   { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

export default function WorkOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkOrder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workOrders'] }),
  });

  const filtered = workOrders.filter(wo => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      wo.order_number?.toLowerCase().includes(q) ||
      wo.bus_number?.toLowerCase().includes(q) ||
      wo.reported_by?.toLowerCase().includes(q) ||
      wo.technician_name?.toLowerCase().includes(q) ||
      wo.issue_description?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || wo.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: workOrders.length,
    pending: workOrders.filter(w => w.status === 'Pending').length,
    inProgress: workOrders.filter(w => w.status === 'In Progress').length,
    completed: workOrders.filter(w => w.status === 'Completed').length,
    cancelled: workOrders.filter(w => w.status === 'Cancelled').length,
  };

  const statBox = (label, count, color) => (
    <div key={label} style={{ background: 'white', border: `1px solid hsl(220,18%,78%)`, borderLeft: `3px solid ${color}`, borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '90px' }}>
      <div style={{ fontSize: '18px', fontWeight: '700', color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );

  const btnBase = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 6px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', cursor: 'pointer', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,15%)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      <LoadingScreen isLoading={isLoading} message="LOADING WORK ORDERS..." />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        label={deleteTarget ? `Work Order ${deleteTarget.order_number} (Bus #${deleteTarget.bus_number})` : ''}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>WORK ORDER MANAGEMENT</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>REPAIR LOG — {workOrders.length} TOTAL RECORDS</div>
          </div>
        </div>
        <Link
          to={createPageUrl('NewWorkOrder')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '600', cursor: 'pointer', letterSpacing: '0.05em', textDecoration: 'none' }}
        >
          <Plus style={{ width: 13, height: 13 }} /> NEW WORK ORDER
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {statBox('TOTAL', counts.total, 'hsl(220,50%,40%)')}
        {statBox('PENDING', counts.pending, 'hsl(40,80%,45%)')}
        {statBox('IN PROGRESS', counts.inProgress, 'hsl(220,70%,45%)')}
        {statBox('COMPLETED', counts.completed, 'hsl(140,55%,40%)')}
        {statBox('CANCELLED', counts.cancelled, 'hsl(0,65%,50%)')}
        {statBox('SHOWING', filtered.length, 'hsl(220,20%,55%)')}
      </div>

      {/* Filters */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Filter style={{ width: 12, height: 12, color: 'hsl(220,30%,45%)' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>STATUS:</span>
          {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: FF, fontWeight: statusFilter === s ? '700' : '500', background: statusFilter === s ? 'hsl(220,55%,38%)' : 'white', color: statusFilter === s ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${statusFilter === s ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer' }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
          <Search style={{ width: 12, height: 12, color: 'hsl(220,20%,45%)' }} />
          <input
            placeholder="Search order#, bus#, tech, issue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', width: '240px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white' }}>
                {['ORDER #', 'DATE', 'BUS #', 'REPORTED BY', 'ISSUE', 'TECHNICIAN', 'STATUS', 'ELAPSED', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontSize: '12px' }}>NO WORK ORDERS FOUND</td></tr>
              )}
              {filtered.map((wo, i) => {
                const sc = STATUS_COLORS[wo.status] || { bg: '#f5f5f5', color: '#444', border: '#ddd' };
                const elapsed = wo.elapsed_time_minutes ? `${Math.floor(wo.elapsed_time_minutes / 60)}h ${wo.elapsed_time_minutes % 60}m` : '—';
                return (
                  <tr key={wo.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,15%,97%)', borderBottom: '1px solid hsl(220,18%,88%)' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>{wo.order_number}</td>
                    <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{moment(wo.created_date).format('MM/DD/YY')}</td>
                    <td style={{ padding: '5px 8px', fontWeight: '700' }}>{wo.bus_number}</td>
                    <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{wo.reported_by}</td>
                    <td style={{ padding: '5px 8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={wo.issue_description}>{wo.issue_description}</td>
                    <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{wo.technician_name || '—'}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: '2px', padding: '2px 6px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {wo.status?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{elapsed}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <Link to={`/WorkOrderDetail?id=${wo.id}`} style={{ ...btnBase, textDecoration: 'none' }} title="View">
                          <Eye style={{ width: 12, height: 12 }} />
                        </Link>
                        <button style={btnBase} onClick={() => setDeleteTarget(wo)} title="Delete">
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '6px 10px', background: 'hsl(220,18%,96%)', borderTop: '1px solid hsl(220,18%,82%)', fontSize: '10px', color: 'hsl(220,10%,45%)', fontFamily: FF }}>
          SHOWING {filtered.length} OF {workOrders.length} WORK ORDERS
        </div>
      </div>
    </div>
  );
}