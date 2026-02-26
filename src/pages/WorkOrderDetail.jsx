import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import moment from 'moment';
import { Printer, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WorkOrderDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const queryClient = useQueryClient();
  const printRef = useRef();

  const { data: workOrder, isLoading } = useQuery({
    queryKey: ['workOrder', id],
    queryFn: () => base44.entities.WorkOrder.list().then(orders => orders.find(o => o.id === id)),
    enabled: !!id,
  });

  const [form, setForm] = useState({
    technician_name: '',
    repairs_rendered: '',
    repair_start_time: '',
    repair_end_time: '',
    status: '',
  });

  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (workOrder) {
      setForm({
        technician_name: workOrder.technician_name || '',
        repairs_rendered: workOrder.repairs_rendered || '',
        repair_start_time: workOrder.repair_start_time || '',
        repair_end_time: workOrder.repair_end_time || '',
        status: workOrder.status || 'Pending',
      });
    }
  }, [workOrder]);

  useEffect(() => {
    if (form.repair_start_time && form.repair_end_time) {
      const start = moment(form.repair_start_time, 'HH:mm');
      const end = moment(form.repair_end_time, 'HH:mm');
      if (end.isAfter(start)) {
        const diff = moment.duration(end.diff(start));
        const hrs = Math.floor(diff.asHours());
        const mins = diff.minutes();
        setElapsed(`${hrs}h ${mins}m (${Math.round(diff.asMinutes())} min)`);
      } else {
        setElapsed('INVALID TIME RANGE');
      }
    } else {
      setElapsed('');
    }
  }, [form.repair_start_time, form.repair_end_time]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrder', id] });
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    },
  });

  const handleSave = () => {
    const elapsedMin = form.repair_start_time && form.repair_end_time
      ? moment.duration(moment(form.repair_end_time, 'HH:mm').diff(moment(form.repair_start_time, 'HH:mm'))).asMinutes()
      : 0;

    updateMutation.mutate({
      ...form,
      elapsed_time_minutes: Math.round(elapsedMin),
      completed_date: form.status === 'Completed' ? new Date().toISOString() : null,
    });
  };

  const handlePrint = () => window.print();

  if (isLoading || !workOrder) {
    return (
      <WinWindow title="LOADING...">
        <div className="win-panel-inset p-4 text-center terminal-text">LOADING WORK ORDER DATA...</div>
      </WinWindow>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-2">
      <div className="flex gap-2 no-print">
        <Link to={createPageUrl('WorkOrders')} className="win-button flex items-center gap-1 text-[11px] no-underline text-foreground">
          <ArrowLeft className="w-3 h-3" /> BACK TO WORK ORDERS
        </Link>
        <Link to={createPageUrl('Dashboard')} className="win-button text-[11px] no-underline text-foreground">
          DASHBOARD
        </Link>
      </div>

      <div ref={printRef}>
        <WinWindow title={`WORK ORDER: ${workOrder.order_number} — BUS #${workOrder.bus_number}`} icon="🔧">
          {/* Header */}
          <div className="win-panel-inset p-3 mb-2 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" className="w-10 h-10 object-contain" />
              <div>
                <div className="text-[10px] font-bold tracking-[0.2em]">NEW HANOVER COUNTY SCHOOLS</div>
                <div className="text-[13px] font-bold tracking-wider">MOBILE VEHICLE SURVEILLANCE — REPAIR WORK ORDER</div>
                <div className="text-[11px] text-muted-foreground">OFFICIAL SERVICE RECORD</div>
              </div>
            </div>
          </div>

          {/* Original Complaint */}
          <div className="win-panel p-2 mb-2">
            <div className="text-[11px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">
              ▸ ORIGINAL COMPLAINT
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><span className="font-bold">ORDER#:</span> {workOrder.order_number}</div>
              <div><span className="font-bold">DATE:</span> {moment(workOrder.created_date).format('MM/DD/YYYY HH:mm:ss')}</div>
              <div><span className="font-bold">BUS#:</span> {workOrder.bus_number}</div>
              <div><span className="font-bold">REPORTED BY:</span> {workOrder.reported_by}</div>
            </div>
            <div className="mt-2 text-[11px]">
              <span className="font-bold">ISSUE:</span>
              <div className="win-panel-inset p-2 mt-1 text-[11px]">{workOrder.issue_description}</div>
            </div>
          </div>

          {/* Repair Section */}
          <div className="win-panel p-2 mb-2">
            <div className="text-[11px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">
              ▸ REPAIRS RENDERED
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold">TECHNICIAN NAME:</label>
                <input
                  className="win-input w-full text-[12px]"
                  value={form.technician_name}
                  onChange={(e) => setForm({ ...form, technician_name: e.target.value })}
                  placeholder="Enter technician name..."
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold">START TIME:</label>
                  <input
                    type="time"
                    className="win-input w-full text-[12px]"
                    value={form.repair_start_time}
                    onChange={(e) => setForm({ ...form, repair_start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold">END TIME:</label>
                  <input
                    type="time"
                    className="win-input w-full text-[12px]"
                    value={form.repair_end_time}
                    onChange={(e) => setForm({ ...form, repair_end_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold">ELAPSED TIME:</label>
                  <div className="win-input w-full text-[12px] bg-secondary/50 font-bold">
                    {elapsed || '—'}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold">REPAIRS RENDERED:</label>
                <textarea
                  className="win-input w-full text-[12px] h-24 resize-none"
                  value={form.repairs_rendered}
                  onChange={(e) => setForm({ ...form, repairs_rendered: e.target.value })}
                  placeholder="Describe repairs performed..."
                />
              </div>
              <div>
                <label className="text-[10px] font-bold">STATUS:</label>
                <select
                  className="win-input w-full text-[12px]"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Pending">PENDING</option>
                  <option value="In Progress">IN PROGRESS</option>
                  <option value="Completed">COMPLETED</option>
                  <option value="Cancelled">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="win-panel-inset p-2 text-[10px] text-muted-foreground mb-2">
            <div>CREATED: {moment(workOrder.created_date).format('MM/DD/YYYY HH:mm:ss')}</div>
            <div>LAST UPDATED: {moment(workOrder.updated_date).format('MM/DD/YYYY HH:mm:ss')}</div>
            {workOrder.completed_date && <div>COMPLETED: {moment(workOrder.completed_date).format('MM/DD/YYYY HH:mm:ss')}</div>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 no-print">
            <button
              className="win-button flex items-center gap-1 !bg-primary !text-primary-foreground"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save className="w-3 h-3" /> {updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button className="win-button flex items-center gap-1" onClick={handlePrint}>
              <Printer className="w-3 h-3" /> PRINT RECEIPT
            </button>
          </div>
        </WinWindow>
      </div>
    </div>
  );
}