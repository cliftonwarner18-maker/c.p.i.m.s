import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, PlusCircle } from 'lucide-react';

const FF = "'Courier Prime', monospace";

const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };
const rowStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' };
const fieldStyle = { flex: '1', minWidth: '180px' };

function SectionHeader({ title }) {
  return (
    <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(220,55%,40%)', padding: '6px 10px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', color: 'hsl(220,20%,25%)', marginBottom: '10px', marginTop: '10px', borderRadius: '2px' }}>
      {title}
    </div>
  );
}

export default function NewWorkOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existingOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const nextOrderNum = (() => {
    const nums = existingOrders
      .map(w => parseInt(w.order_number?.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 1000;
    return `WO-${String(max + 1).padStart(4, '0')}`;
  })();

  const [form, setForm] = useState({
    bus_number: '',
    reported_by: '',
    issue_description: '',
    technician_name: '',
    status: 'Pending',
    repairs_rendered: '',
    repair_start_time: '',
    repair_end_time: '',
    elapsed_time_minutes: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.create({ ...data, order_number: nextOrderNum }),
    onSuccess: (newWo) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      navigate(`/WorkOrderDetail?id=${newWo.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>NEW WORK ORDER</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>ORDER #: {nextOrderNum}</div>
          </div>
        </div>
        <Link to={createPageUrl('WorkOrders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, textDecoration: 'none' }}>
          <ArrowLeft style={{ width: 12, height: 12 }} /> CANCEL
        </Link>
      </div>

      {/* Form */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '16px' }}>
        <form onSubmit={handleSubmit}>
          <SectionHeader title="VEHICLE & REPORTING INFORMATION" />
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>BUS NUMBER *</label>
              <input
                list="bus-list"
                value={form.bus_number}
                onChange={e => setForm({ ...form, bus_number: e.target.value })}
                placeholder="Enter or select bus #"
                required
                style={inputStyle}
              />
              <datalist id="bus-list">
                {buses.map(b => <option key={b.id} value={b.bus_number}>{b.bus_number} — {b.year} {b.make} {b.model}</option>)}
              </datalist>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>REPORTED BY *</label>
              <input value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} placeholder="Name of reporter" required style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>TECHNICIAN</label>
              <input value={form.technician_name} onChange={e => setForm({ ...form, technician_name: e.target.value })} placeholder="Assigned technician" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>ISSUE DESCRIPTION *</label>
            <textarea value={form.issue_description} onChange={e => setForm({ ...form, issue_description: e.target.value })} placeholder="Describe the issue in detail..." rows={4} required style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <SectionHeader title="INITIAL STATUS" />
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>STATUS</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                {['Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>REPAIR START TIME</label>
              <input type="datetime-local" value={form.repair_start_time} onChange={e => setForm({ ...form, repair_start_time: e.target.value })} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>REPAIR END TIME</label>
              <input type="datetime-local" value={form.repair_end_time} onChange={e => setForm({ ...form, repair_end_time: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>REPAIRS RENDERED (if already completed)</label>
            <textarea value={form.repairs_rendered} onChange={e => setForm({ ...form, repairs_rendered: e.target.value })} placeholder="Describe repairs if already performed..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid hsl(220,18%,85%)' }}>
            <Link to={createPageUrl('WorkOrders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '600', textDecoration: 'none' }}>
              CANCEL
            </Link>
            <button type="submit" disabled={createMutation.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '12px', fontFamily: FF, fontWeight: '700', cursor: createMutation.isPending ? 'default' : 'pointer', letterSpacing: '0.05em' }}>
              <PlusCircle style={{ width: 13, height: 13 }} /> {createMutation.isPending ? 'CREATING...' : 'CREATE WORK ORDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}