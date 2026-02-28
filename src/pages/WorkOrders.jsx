import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { Search, Filter, Trash2, FileText } from 'lucide-react';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '4px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none' };
const statusColor = (s) => {
  if (s === 'Pending') return 'hsl(45,85%,38%)';
  if (s === 'In Progress') return 'hsl(220,65%,42%)';
  if (s === 'Completed') return 'hsl(140,55%,30%)';
  return 'hsl(0,60%,45%)';
};

export default function WorkOrders() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: workOrders = [], isLoading } = useQuery({
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

  const btnFilter = (active) => ({
    padding: '3px 8px', fontSize: '10px', fontFamily: FF, fontWeight: active ? '700' : '500',
    background: active ? 'hsl(220,55%,38%)' : 'white', color: active ? 'white' : 'hsl(220,20%,30%)',
    border: `1px solid ${active ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer'
  });

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
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText style={{ width: 18, height: 18 }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>WORK ORDERS</div>
          <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>SURVEILLANCE REPAIR LOG — {workOrders.length} TOTAL</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Filter style={{ width: 12, height: 12, color: 'hsl(220,30%,45%)' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>STATUS:</span>
          {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={btnFilter(statusFilter === s)}>{s === 'All' ? 'ALL' : s.toUpperCase()}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
          <Search style={{ width: 12, height: 12, color: 'hsl(220,20%,45%)' }} />
          <input placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: 200 }} />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 520 }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0 }}>
                {['ORDER#', 'DATE', 'BUS#', 'REPORTED BY', 'ISSUE', 'STATUS', 'TECHNICIAN', 'ACTION'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>NO RECORDS FOUND</td></tr>
              )}
              {filtered.map((wo, i) => (
                <tr key={wo.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '700' }}>{wo.order_number}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{moment(wo.created_date).format('MM/DD/YY HH:mm')}</td>
                  <td style={{ padding: '5px 8px', fontWeight: '700' }}>{wo.bus_number}</td>
                  <td style={{ padding: '5px 8px' }}>{wo.reported_by}</td>
                  <td style={{ padding: '5px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.issue_description}</td>
                  <td style={{ padding: '5px 8px', fontWeight: '700', color: statusColor(wo.status), whiteSpace: 'nowrap' }}>[{wo.status?.toUpperCase()}]</td>
                  <td style={{ padding: '5px 8px' }}>{wo.technician_name || '—'}</td>
                  <td style={{ padding: '5px 8px' }}>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      <Link to={createPageUrl('WorkOrderDetail') + `?id=${wo.id}`}
                        style={{ display: 'inline-block', padding: '2px 8px', fontSize: '10px', fontFamily: FF, fontWeight: '700', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', textDecoration: 'none' }}>
                        OPEN
                      </Link>
                      <button onClick={() => setDeleteTarget(wo)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '2px 6px', fontSize: '10px', fontFamily: FF, fontWeight: '700', background: 'hsl(0,65%,45%)', color: 'white', border: '1px solid hsl(0,65%,38%)', borderRadius: '2px', cursor: 'pointer' }}>
                        <Trash2 style={{ width: 11, height: 11 }} /> DEL
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '5px 10px', fontSize: '10px', color: 'hsl(220,10%,45%)', borderTop: '1px solid hsl(220,18%,90%)', background: 'hsl(220,18%,97%)' }}>
          SHOWING {filtered.length} OF {workOrders.length} RECORDS
        </div>
      </div>
    </div>
  );
}