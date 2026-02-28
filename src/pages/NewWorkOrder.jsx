import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileText, Send } from 'lucide-react';

const FF = "'Courier Prime', monospace";
const inputStyle = { width: '100%', padding: '6px 8px', fontSize: '12px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '4px', letterSpacing: '0.05em', color: 'hsl(220,20%,30%)' };
const sectionHdr = { background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '10px' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 16px', fontSize: '11px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };

export default function NewWorkOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list('bus_number') });
  const { data: systemUsers = [] } = useQuery({ queryKey: ['systemUsers'], queryFn: () => base44.entities.SystemUser.list('name') });
  const { data: workOrders = [] } = useQuery({ queryKey: ['workOrders'], queryFn: () => base44.entities.WorkOrder.list('-created_date') });

  const generateOrderNumber = () => `WO-${moment().format('YYMMDD')}-${String(workOrders.length + 1).padStart(4, '0')}`;

  const [form, setForm] = useState({ reported_by: '', bus_number: '', base_location: '', issue_description: '' });
  const [submitted, setSubmitted] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workOrders'] }); setSubmitted(true); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, order_number: generateOrderNumber(), status: 'Pending' });
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: FF }}>
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ ...sectionHdr, marginBottom: 0, background: 'hsl(140,55%,38%)' }}>✅ WORK ORDER SUBMITTED</div>
          <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'hsl(140,55%,30%)' }}>WORK ORDER SUBMITTED SUCCESSFULLY</div>
            <div style={{ fontSize: '12px' }}>Your work order has been placed into the PENDING REPAIRS queue.</div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => { setSubmitted(false); setForm({ reported_by: '', bus_number: '', base_location: '', issue_description: '' }); }}
                style={{ ...btnBase, background: 'hsl(220,55%,38%)', color: 'white', borderColor: 'hsl(220,55%,30%)' }}>
                <FileText style={{ width: 13, height: 13 }} /> NEW WORK ORDER
              </button>
              <button onClick={() => navigate(createPageUrl('Dashboard'))}
                style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>
                RETURN TO DASHBOARD
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', fontFamily: FF }}>
      <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px' }}>
        <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText style={{ width: 16, height: 16 }} /> CREATE NEW WORK ORDER — CAMERA REPAIR REQUEST
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Auto fields */}
          <div style={{ background: 'white', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={sectionHdr}>▸ AUTO-GENERATED INFO</div>
            <div style={{ padding: '0 12px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>DATE/TIME (AUTO)</label>
                <div style={{ ...inputStyle, background: 'hsl(220,18%,96%)', display: 'flex', alignItems: 'center' }}>{moment().format('MM/DD/YYYY HH:mm:ss')}</div>
              </div>
              <div>
                <label style={labelStyle}>ORDER # (AUTO)</label>
                <div style={{ ...inputStyle, background: 'hsl(220,18%,96%)', display: 'flex', alignItems: 'center', fontWeight: '700' }}>{generateOrderNumber()}</div>
              </div>
            </div>
          </div>

          {/* Form fields */}
          <div style={{ background: 'white', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={sectionHdr}>▸ WORK ORDER DETAILS</div>
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={labelStyle}>REPORTING PERSON *</label>
                <select style={inputStyle} value={form.reported_by} onChange={e => setForm({ ...form, reported_by: e.target.value })} required>
                  <option value="">-- SELECT PERSON --</option>
                  {systemUsers.filter(u => u.active !== false).map(u => (
                    <option key={u.id} value={u.name}>{u.name}{u.role ? ` (${u.role})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>BASE LOCATION *</label>
                <select style={inputStyle} value={form.base_location} onChange={e => setForm({ ...form, base_location: e.target.value })} required>
                  <option value="">-- SELECT LOCATION --</option>
                  {['Main', 'North', 'Central', 'Sold'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>SELECT BUS # *</label>
                <select style={inputStyle} value={form.bus_number} onChange={e => setForm({ ...form, bus_number: e.target.value })} required>
                  <option value="">-- SELECT BUS --</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.bus_number}>BUS #{b.bus_number} — {b.year} {b.make} {b.model} ({b.bus_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>ISSUE DESCRIPTION *</label>
                <textarea style={{ ...inputStyle, height: 128, resize: 'none' }} placeholder="Describe the camera system issue in detail..." value={form.issue_description} onChange={e => setForm({ ...form, issue_description: e.target.value })} required />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={createMutation.isPending} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>
              <Send style={{ width: 13, height: 13 }} /> {createMutation.isPending ? 'SUBMITTING...' : 'SUBMIT WORK ORDER'}
            </button>
            <button type="button" onClick={() => setForm({ reported_by: '', bus_number: '', base_location: '', issue_description: '' })}
              style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>
              CLEAR FORM
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}