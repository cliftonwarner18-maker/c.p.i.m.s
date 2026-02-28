import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };
const rowStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' };
const fieldStyle = { flex: '1', minWidth: '180px' };

function SectionHeader({ title }) {
  return (
    <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,78%)', borderLeft: '3px solid hsl(220,55%,40%)', padding: '6px 10px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', color: 'hsl(220,20%,25%)', marginBottom: '10px', marginTop: '6px', borderRadius: '2px' }}>
      {title}
    </div>
  );
}

export default function NewWorkOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const now = moment().format('MM/DD/YYYY HH:mm');

  const { data: existingOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });

  const nextOrderNum = (() => {
    const nums = existingOrders
      .map(w => parseInt(w.order_number?.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 1000;
    return `WO-${String(max + 1).padStart(4, '0')}`;
  })();

  const activeUsers = systemUsers.filter(u => u.active !== false);

  const [form, setForm] = useState({
    lot: 'Main',
    reported_by: '',
    bus_number: '',
    issue_description: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.create({
      ...data,
      order_number: nextOrderNum,
      status: 'Pending',
    }),
    onSuccess: (newWo) => {
      queryClient.invalidateQueries({ queryKey: ['workOrders'] });
      navigate(createPageUrl(`WorkOrderDetail?id=${newWo.id}`));
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
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>NEW WORK ORDER — INITIAL COMPLAINT</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>ORDER #: {nextOrderNum} &nbsp;|&nbsp; DATE/TIME: {now}</div>
          </div>
        </div>
        <Link to={createPageUrl('WorkOrders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, textDecoration: 'none' }}>
          <ArrowLeft style={{ width: 12, height: 12 }} /> CANCEL
        </Link>
      </div>

      {/* Info banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '2px', padding: '8px 12px', fontSize: '11px', color: '#1e40af', fontFamily: FF }}>
        <strong>STEP 1 of 2:</strong> Fill out the initial complaint below and save. The technician will complete repairs in the next step after saving.
      </div>

      {/* Form */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '16px' }}>
        <form onSubmit={handleSubmit}>
          <SectionHeader title="WORK ORDER IDENTIFICATION" />

          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>ORDER NUMBER (AUTO)</label>
              <input value={nextOrderNum} readOnly style={{ ...inputStyle, background: 'hsl(220,10%,96%)', color: 'hsl(220,10%,40%)', fontWeight: '700' }} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>DATE / TIME (AUTO)</label>
              <input value={now} readOnly style={{ ...inputStyle, background: 'hsl(220,10%,96%)', color: 'hsl(220,10%,40%)' }} />
            </div>
          </div>

          <SectionHeader title="REPORTING INFORMATION" />
          <div style={rowStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>LOT *</label>
              <select value={form.lot} onChange={e => setForm({ ...form, lot: e.target.value })} required style={inputStyle}>
                <option value="">— Select Lot —</option>
                {['Main', 'North', 'Central'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>REPORTED BY *</label>
              <select value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} required style={inputStyle}>
                <option value="">— Select User —</option>
                {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` — ${u.role}` : ''}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>BUS NUMBER *</label>
              <select value={form.bus_number} onChange={e => setForm({ ...form, bus_number: e.target.value })} required style={inputStyle}>
                <option value="">— Select Bus —</option>
                {buses.filter(b => b.status !== 'Retired').map(b => (
                  <option key={b.id} value={b.bus_number}>
                    {b.bus_number}{b.make ? ` — ${b.year || ''} ${b.make} ${b.model || ''}`.trim() : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SectionHeader title="INITIAL COMPLAINT" />
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>DESCRIBE ISSUES WITH SYSTEM *</label>
            <textarea
              value={form.issue_description}
              onChange={e => setForm({ ...form, issue_description: e.target.value })}
              placeholder="Describe the issue(s) in detail..."
              rows={6}
              required
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid hsl(220,18%,85%)' }}>
            <Link to={createPageUrl('WorkOrders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '600', textDecoration: 'none' }}>
              CANCEL
            </Link>
            <button type="submit" disabled={createMutation.isPending} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '12px', fontFamily: FF, fontWeight: '700', cursor: createMutation.isPending ? 'default' : 'pointer', letterSpacing: '0.05em' }}>
              <PlusCircle style={{ width: 13, height: 13 }} /> {createMutation.isPending ? 'SAVING...' : 'SAVE COMPLAINT & OPEN WORK ORDER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}