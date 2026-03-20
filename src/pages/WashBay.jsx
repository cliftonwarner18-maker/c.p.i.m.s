import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, FileDown, Trash2, Pencil } from 'lucide-react';
import moment from 'moment';
import { exportWashBayPDF } from '../utils/exports/exportWashBay';
import LoadingScreen from '../components/LoadingScreen';
import BulkBusWashForm from '../components/wash/BulkBusWashForm';
import BusWashOrderDetail from '../components/wash/BusWashOrderDetail';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import SeasonalBatchWashAction from '../components/wash/SeasonalBatchWashAction';
import BulkDeletePendingWash from '../components/wash/BulkDeletePendingWash';

const FF = "'Courier Prime', monospace";

export default function WashBay() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editOrder, setEditOrder] = useState(null);

  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['busWashOrders'],
    queryFn: () => base44.entities.BusWashOrder.list('-assigned_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (orderId) => {
      await base44.entities.BusWashOrder.delete(orderId);
      queryClient.invalidateQueries({ queryKey: ['busWashOrders'] });
    },
    onSuccess: () => {
      setDeleteTarget(null);
    }
  });

  const filteredOrders = filterStatus === 'All' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const pending = orders.filter(o => o.status === 'Pending').length;
  const completed = orders.filter(o => o.status === 'Completed').length;
  const inProgress = orders.filter(o => o.status === 'In Progress').length;

  const totalHours = orders
    .filter(o => o.status === 'Completed')
    .reduce((sum, o) => sum + (o.elapsed_time_minutes || 0), 0) / 60;

  const hoursByWasher = {};
  orders.forEach(order => {
    if (order.status === 'Completed' && order.washers) {
      order.washers.forEach(washer => {
        if (!hoursByWasher[washer]) hoursByWasher[washer] = 0;
        hoursByWasher[washer] += (order.elapsed_time_minutes || 0) / 60;
      });
    }
  });

  const handleExportPDF = () => {
    exportWashBayPDF({ orders: filteredOrders, totalHours, hoursByWasher });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      <LoadingScreen isLoading={isLoading} message="LOADING WASH BAY DATA..." />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(140,55%,30%), hsl(140,50%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>BUS WASH MANAGEMENT SYSTEM</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>SUMMER HOURS TRACKING — {orders.length} TOTAL ORDERS</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(45,90%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '80px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(45,90%,40%)', lineHeight: 1 }}>{pending}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>PENDING</div>
        </div>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(220,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '80px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(220,55%,40%)', lineHeight: 1 }}>{inProgress}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>IN PROGRESS</div>
        </div>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(140,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '80px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(140,55%,40%)', lineHeight: 1 }}>{completed}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>COMPLETED</div>
        </div>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(280,55%,40%)', borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '80px' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(280,55%,40%)', lineHeight: 1 }}>{totalHours.toFixed(1)}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>TOTAL HOURS</div>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={filteredOrders.length === 0 || isExporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 14px',
            fontSize: '11px',
            fontFamily: FF,
            fontWeight: '700',
            background: 'hsl(220,55%,38%)',
            color: 'white',
            border: 'none',
            borderRadius: '2px',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          <FileDown size={14} /> {isExporting ? 'EXPORTING...' : 'EXPORT PDF'}
        </button>
      </div>

      {/* Bulk Form & Actions */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <BulkBusWashForm />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100%', paddingBottom: '4px' }}>
          <SeasonalBatchWashAction onSuccess={() => refetch()} />
          <BulkDeletePendingWash onSuccess={() => refetch()} />
        </div>
      </div>

      {/* Filter */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', whiteSpace: 'nowrap' }}>FILTER:</span>
        {['All', 'Pending', 'In Progress', 'Completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              padding: '4px 10px',
              fontSize: '10px',
              fontFamily: FF,
              fontWeight: '700',
              background: filterStatus === status ? 'hsl(220,55%,40%)' : 'hsl(220,18%,88%)',
              color: filterStatus === status ? 'white' : 'hsl(220,20%,20%)',
              border: `1px solid ${filterStatus === status ? 'hsl(220,55%,30%)' : 'hsl(220,18%,70%)'}`,
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ maxHeight: 600, overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0 }}>
                {['ORDER#', 'DATE', 'BUS#', 'STATUS', 'WASHERS', 'START', 'END', 'HOURS', 'ACTION'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>
                    NO WASH ORDERS
                  </td>
                </tr>
              )}
              {filteredOrders.map((order, idx) => (
                <tr key={order.id} style={{ background: idx % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                  <td style={{ padding: '5px 8px', fontWeight: '700' }}>{order.order_number}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{order.assigned_date}</td>
                  <td style={{ padding: '5px 8px', fontWeight: '700' }}>{order.bus_number}</td>
                  <td style={{
                    padding: '5px 8px',
                    fontWeight: '700',
                    color: order.status === 'Pending' ? 'hsl(45,90%,40%)' : order.status === 'In Progress' ? 'hsl(220,65%,42%)' : 'hsl(140,55%,30%)',
                    fontSize: '10px'
                  }}>
                    [{order.status}]
                  </td>
                  <td style={{ padding: '5px 8px', fontSize: '10px' }}>
                    {(order.washers || []).join(', ') || '—'}
                  </td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{order.start_time || '—'}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{order.end_time || '—'}</td>
                  <td style={{ padding: '5px 8px', fontWeight: '700' }}>
                    {order.elapsed_time_minutes ? ((order.elapsed_time_minutes / 60).toFixed(2) + ' hrs') : '—'}
                  </td>
                  <td style={{ padding: '5px 8px', display: 'flex', gap: '4px' }}>
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '2px 8px',
                          fontSize: '9px',
                          fontFamily: FF,
                          fontWeight: '700',
                          background: 'hsl(140,55%,40%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '2px',
                          cursor: 'pointer'
                        }}
                      >
                        START
                      </button>
                    )}
                    <button
                      onClick={() => setEditOrder(order)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        fontFamily: FF,
                        fontWeight: '700',
                        background: 'hsl(220,55%,42%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(order)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        fontFamily: FF,
                        fontWeight: '700',
                        background: 'hsl(0,65%,48%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Detail Modal */}
      {selectedOrder && (
        <BusWashOrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onComplete={() => {
            setSelectedOrder(null);
            refetch();
          }}
        />
      )}

      {/* Edit Modal */}
      {editOrder && (
        <BusWashOrderDetail
          order={editOrder}
          editMode={true}
          onClose={() => setEditOrder(null)}
          onComplete={() => {
            setEditOrder(null);
            refetch();
          }}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          title={`DELETE BUS WASH ORDER #${deleteTarget.order_number}`}
          message={`This will permanently delete the wash order for Bus ${deleteTarget.bus_number}. This action cannot be undone.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Footer */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 12px', fontSize: '10px', color: 'hsl(220,10%,40%)', fontFamily: FF, lineHeight: '1.6', no_print: true }}>
        <div>&gt; BUS WASH ORDER MANAGEMENT SYSTEM — TRACK STAFF HOURS</div>
        <div>&gt; {orders.length} TOTAL ORDERS | {completed} COMPLETED | {totalHours.toFixed(2)} HOURS</div>
      </div>
    </div>
  );
}