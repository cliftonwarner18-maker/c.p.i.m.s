import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { Printer, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const FF = "'Courier Prime', monospace";
const inputStyle = { width: '100%', padding: '5px 8px', fontSize: '12px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px', letterSpacing: '0.05em', color: 'hsl(220,20%,30%)' };
const sectionHdr = { background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '6px 10px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.07em', marginBottom: '8px' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', fontSize: '11px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };

export default function WorkOrderDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const queryClient = useQueryClient();

  const { data: workOrder, isLoading } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: async () => {
      const orders = await base44.entities.WorkOrder.list();
      return orders.find(o => o.id === id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState({ technician_name: '', repairs_rendered: '', repair_start_time: '', repair_end_time: '', status: '' });
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (workOrder) setForm({ technician_name: workOrder.technician_name || '', repairs_rendered: workOrder.repairs_rendered || '', repair_start_time: workOrder.repair_start_time || '', repair_end_time: workOrder.repair_end_time || '', status: workOrder.status || 'Pending' });
  }, [workOrder]);

  useEffect(() => {
    if (form.repair_start_time && form.repair_end_time) {
      const start = moment(form.repair_start_time, 'HH:mm');
      const end = moment(form.repair_end_time, 'HH:mm');
      if (end.isAfter(start)) {
        const diff = moment.duration(end.diff(start));
        setElapsed(`${Math.floor(diff.asHours())}h ${diff.minutes()}m (${Math.round(diff.asMinutes())} min)`);
      } else setElapsed('INVALID TIME RANGE');
    } else setElapsed('');
  }, [form.repair_start_time, form.repair_end_time]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workOrder', id] }); queryClient.invalidateQueries({ queryKey: ['workOrders'] }); },
  });

  const handleSave = () => {
    const elapsedMin = form.repair_start_time && form.repair_end_time
      ? moment.duration(moment(form.repair_end_time, 'HH:mm').diff(moment(form.repair_start_time, 'HH:mm'))).asMinutes() : 0;
    updateMutation.mutate({ ...form, elapsed_time_minutes: Math.round(elapsedMin), completed_date: form.status === 'Completed' ? new Date().toISOString() : null });
  };

  if (isLoading || !workOrder) {
    return (
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '40px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontFamily: FF, fontSize: '12px' }}>
        LOADING WORK ORDER DATA...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      {/* Nav - no print */}
      <div className="no-print" style={{ display: 'flex', gap: '6px' }}>
        <Link to={createPageUrl('WorkOrders')} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> BACK TO WORK ORDERS
        </Link>
        <Link to={createPageUrl('Dashboard')} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>
          DASHBOARD
        </Link>
      </div>

      {/* Main card */}
      <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px' }}>
        <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.07em' }}>
          🔧 WORK ORDER: {workOrder.order_number} — BUS #{workOrder.bus_number}
        </div>

        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Header */}
          <div style={{ background: 'white', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', padding: '12px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{ width: 38, height: 38, objectFit: 'contain' }} alt="NHCS" />
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.2em' }}>NEW HANOVER COUNTY SCHOOLS</div>
                <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.05em' }}>MOBILE VEHICLE SURVEILLANCE — REPAIR WORK ORDER</div>
                <div style={{ fontSize: '11px', color: 'hsl(220,10%,45%)' }}>OFFICIAL SERVICE RECORD</div>
              </div>
            </div>
          </div>

          {/* Original Complaint */}
          <div style={{ background: 'white', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={sectionHdr}>▸ ORIGINAL COMPLAINT</div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                <div><span style={{ fontWeight: '700' }}>ORDER#:</span> {workOrder.order_number}</div>
                <div><span style={{ fontWeight: '700' }}>DATE:</span> {moment(workOrder.created_date).format('MM/DD/YYYY HH:mm:ss')}</div>
                <div><span style={{ fontWeight: '700' }}>BUS#:</span> {workOrder.bus_number}</div>
                <div><span style={{ fontWeight: '700' }}>REPORTED BY:</span> {workOrder.reported_by}</div>
              </div>
              <div style={{ fontSize: '12px' }}>
                <span style={{ fontWeight: '700' }}>ISSUE:</span>
                <div style={{ marginTop: 4, padding: '8px', background: 'hsl(220,18%,97%)', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px', fontSize: '12px' }}>{workOrder.issue_description}</div>
              </div>
            </div>
          </div>

          {/* Repairs Rendered */}
          <div style={{ background: 'white', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={sectionHdr}>▸ REPAIRS RENDERED</div>
            <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={labelStyle}>TECHNICIAN NAME:</label>
                <input style={inputStyle} value={form.technician_name} onChange={e => setForm({ ...form, technician_name: e.target.value })} placeholder="Enter technician name..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>START TIME:</label>
                  <input type="time" style={inputStyle} value={form.repair_start_time} onChange={e => setForm({ ...form, repair_start_time: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>END TIME:</label>
                  <input type="time" style={inputStyle} value={form.repair_end_time} onChange={e => setForm({ ...form, repair_end_time: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>ELAPSED TIME:</label>
                  <div style={{ ...inputStyle, background: 'hsl(220,18%,96%)', fontWeight: '700', display: 'flex', alignItems: 'center' }}>{elapsed || '—'}</div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>REPAIRS RENDERED:</label>
                <textarea style={{ ...inputStyle, height: 96, resize: 'vertical' }} value={form.repairs_rendered} onChange={e => setForm({ ...form, repairs_rendered: e.target.value })} placeholder="Describe repairs performed..." />
              </div>
              <div>
                <label style={labelStyle}>STATUS:</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="Pending">PENDING</option>
                  <option value="In Progress">IN PROGRESS</option>
                  <option value="Completed">COMPLETED</option>
                  <option value="Cancelled">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div style={{ padding: '8px 10px', background: 'hsl(220,18%,97%)', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px', fontSize: '10px', color: 'hsl(220,10%,45%)', fontFamily: FF }}>
            <div>CREATED: {moment(workOrder.created_date).format('MM/DD/YYYY HH:mm:ss')}</div>
            <div>LAST UPDATED: {moment(workOrder.updated_date).format('MM/DD/YYYY HH:mm:ss')}</div>
            {workOrder.completed_date && <div>COMPLETED: {moment(workOrder.completed_date).format('MM/DD/YYYY HH:mm:ss')}</div>}
          </div>

          {/* Actions */}
          <div className="no-print" style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleSave} disabled={updateMutation.isPending} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>
              <Save style={{ width: 13, height: 13 }} /> {updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button onClick={() => window.print()} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>
              <Printer style={{ width: 13, height: 13 }} /> PRINT RECEIPT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}