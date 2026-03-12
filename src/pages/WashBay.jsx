import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, FileDown, Trash2 } from 'lucide-react';
import moment from 'moment';
import LoadingScreen from '../components/LoadingScreen';
import BulkBusWashForm from '../components/wash/BulkBusWashForm';
import BusWashOrderDetail from '../components/wash/BusWashOrderDetail';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import SeasonalBatchWashAction from '../components/wash/SeasonalBatchWashAction';

const FF = "'Courier Prime', monospace";

export default function WashBay() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const handleExportPDF = async () => {
    setIsExporting(true);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 40;

    const navy = [20, 44, 95];
    const gold = [180, 140, 40];
    const white = [255, 255, 255];

    // Header
    doc.setFillColor(...navy);
    doc.rect(0, 0, W, 70, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, 70, W, 2, 'F');
    doc.setTextColor(...white);
    doc.setFont('courier', 'bold');
    doc.setFontSize(14);
    doc.text('NEW HANOVER COUNTY SCHOOLS', margin, 22);
    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    doc.text('Transportation Department — Summer Wash Bay Hours', margin, 36);
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...gold);
    doc.text('BUS WASH ORDERS REPORT', margin, 54);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(200, 210, 230);
    doc.text(`Generated: ${moment().format('MM/DD/YYYY [at] HH:mm')} ET | Total Hours: ${totalHours.toFixed(2)} hrs`, margin, 65);

    let y = 88;

    // Summary Section
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.setFont('courier', 'bold');
    doc.text('SUMMARY BY WASHER', margin, y);
    y += 14;

    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    Object.entries(hoursByWasher).forEach(([washer, hours]) => {
      doc.text(`${washer}: ${hours.toFixed(2)} hours`, margin + 10, y);
      y += 10;
    });

    y += 8;

    // Table Header
    const cols = [
      { label: 'ORDER#', x: margin, w: 50 },
      { label: 'DATE', x: margin + 50, w: 45 },
      { label: 'BUS#', x: margin + 95, w: 50 },
      { label: 'STATUS', x: margin + 145, w: 50 },
      { label: 'WASHERS', x: margin + 195, w: 120 },
      { label: 'START', x: margin + 315, w: 55 },
      { label: 'END', x: margin + 370, w: 55 },
      { label: 'HOURS', x: margin + 425, w: 45 },
    ];

    doc.setFillColor(...navy);
    doc.rect(margin, y, W - margin * 2, 18, 'F');
    doc.setTextColor(...white);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    cols.forEach(c => doc.text(c.label, c.x + 2, y + 12));
    y += 18;

    // Data Rows
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    filteredOrders.forEach((order, idx) => {
      if (y > H - 60) {
        doc.addPage();
        y = 40;
        doc.setFillColor(...navy);
        doc.rect(margin, y, W - margin * 2, 18, 'F');
        doc.setTextColor(...white);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8);
        cols.forEach(c => doc.text(c.label, c.x + 2, y + 12));
        y += 18;
        doc.setFont('courier', 'normal');
      }

      const isEven = idx % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 249, isEven ? 255 : 253);
      doc.rect(margin, y, W - margin * 2, 14, 'F');
      doc.setDrawColor(210, 215, 225);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, W - margin * 2, 14);

      doc.setTextColor(30, 30, 30);
      const rowY = y + 9;
      const hours = ((order.elapsed_time_minutes || 0) / 60).toFixed(2);
      doc.text(order.order_number || '—', cols[0].x + 2, rowY);
      doc.text(order.assigned_date || '—', cols[1].x + 2, rowY);
      doc.text(order.bus_number, cols[2].x + 2, rowY);
      doc.text(order.status, cols[3].x + 2, rowY);
      doc.text((order.washers || []).join(', ').substring(0, 20), cols[4].x + 2, rowY);
      doc.text(order.start_time || '—', cols[5].x + 2, rowY);
      doc.text(order.end_time || '—', cols[6].x + 2, rowY);
      doc.setFont('courier', 'bold');
      doc.text(`${hours} hrs`, cols[7].x + 2, rowY);
      doc.setFont('courier', 'normal');
      y += 14;
    });

    // Footer
    doc.setFillColor(...navy);
    doc.rect(0, H - 32, W, 32, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, H - 32, W, 1.5, 'F');
    doc.setTextColor(200, 210, 230);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text('NEW HANOVER COUNTY SCHOOLS — Transportation Department — Wash Bay Hours Tracking', W / 2, H - 15, { align: 'center' });

    doc.save(`NHCS_BusWash_${moment().format('YYYYMMDD')}.pdf`);
    setIsExporting(false);
  };

  const handlePrint = () => {
    window.print();
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

      {/* Bulk Form & Seasonal Batch */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <BulkBusWashForm />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '4px' }}>
          <SeasonalBatchWashAction onSuccess={() => refetch()} />
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

      {/* Hours Summary */}
      {Object.keys(hoursByWasher).length > 0 && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(to right, hsl(280,55%,32%), hsl(280,50%,42%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em' }}>
            COMPLETED HOURS BY WASHER
          </div>
          <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {Object.entries(hoursByWasher).map(([washer, hours]) => (
              <div key={washer} style={{ background: 'hsl(220,10%,97%)', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', fontFamily: FF }}>{washer}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(140,55%,40%)', background: 'hsl(140,70%,92%)', padding: '4px 10px', borderRadius: '2px', fontFamily: FF }}>{hours.toFixed(2)} hrs</div>
              </div>
            ))}
          </div>
        </div>
      )}

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