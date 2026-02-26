import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, Send } from 'lucide-react';

export default function NewWorkOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const generateOrderNumber = () => {
    const prefix = 'WO';
    const date = moment().format('YYMMDD');
    const seq = String(workOrders.length + 1).padStart(4, '0');
    return `${prefix}-${date}-${seq}`;
  };

  const [form, setForm] = useState({
    reported_by: '',
    bus_number: '',
    base_location: '',
    issue_description: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderNumber = generateOrderNumber();
    createMutation.mutate({
      ...form,
      order_number: orderNumber,
      status: 'Pending',
    });
  };

  if (submitted) {
    return (
      <WinWindow title="WORK ORDER SUBMITTED" icon="✅">
        <div className="win-panel-inset p-6 text-center space-y-4">
          <div className="terminal-text text-3xl status-completed font-bold">
            WORK ORDER SUBMITTED SUCCESSFULLY
          </div>
          <div className="text-[12px] font-mono">
            Your work order has been placed into the PENDING REPAIRS queue.
          </div>
          <div className="flex gap-2 justify-center">
            <button
              className="win-button flex items-center gap-1"
              onClick={() => { setSubmitted(false); setForm({ reported_by: '', bus_number: '', issue_description: '' }); }}
            >
              <FileText className="w-3 h-3" /> NEW WORK ORDER
            </button>
            <button
              className="win-button flex items-center gap-1"
              onClick={() => navigate(createPageUrl('Dashboard'))}
            >
              RETURN TO DASHBOARD
            </button>
          </div>
        </div>
      </WinWindow>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      <WinWindow title="CREATE NEW WORK ORDER — CAMERA REPAIR REQUEST" icon="📝">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Auto fields */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold block mb-1">DATE/TIME (AUTO)</label>
              <div className="win-input w-full bg-secondary/50 text-[12px]">
                {moment().format('MM/DD/YYYY HH:mm:ss')}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold block mb-1">ORDER # (AUTO)</label>
              <div className="win-input w-full bg-secondary/50 text-[12px]">
                {generateOrderNumber()}
              </div>
            </div>
          </div>

          {/* Reporter */}
          <div>
            <label className="text-[11px] font-bold block mb-1">REPORTING PERSON *</label>
            <input
              type="text"
              className="win-input w-full text-[12px]"
              placeholder="Enter your full name..."
              value={form.reported_by}
              onChange={(e) => setForm({ ...form, reported_by: e.target.value })}
              required
            />
          </div>

          {/* Bus Selection */}
          <div>
            <label className="text-[11px] font-bold block mb-1">SELECT BUS # *</label>
            <select
              className="win-input w-full text-[12px]"
              value={form.bus_number}
              onChange={(e) => setForm({ ...form, bus_number: e.target.value })}
              required
            >
              <option value="">-- SELECT BUS --</option>
              {buses.map((b) => (
                <option key={b.id} value={b.bus_number}>
                  BUS #{b.bus_number} — {b.year} {b.make} {b.model} ({b.bus_type})
                </option>
              ))}
            </select>
          </div>

          {/* Issue Description */}
          <div>
            <label className="text-[11px] font-bold block mb-1">ISSUE DESCRIPTION *</label>
            <textarea
              className="win-input w-full text-[12px] h-32 resize-none"
              placeholder="Describe the camera system issue in detail..."
              value={form.issue_description}
              onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="win-button flex items-center gap-1 !bg-primary !text-primary-foreground" disabled={createMutation.isPending}>
              <Send className="w-3 h-3" />
              {createMutation.isPending ? 'SUBMITTING...' : 'SUBMIT WORK ORDER'}
            </button>
            <button
              type="button"
              className="win-button"
              onClick={() => setForm({ reported_by: '', bus_number: '', issue_description: '' })}
            >
              CLEAR FORM
            </button>
          </div>
        </form>
      </WinWindow>
    </div>
  );
}