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

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
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
        <div className="win-panel-inset" style={{padding:'24px',textAlign:'center',display:'flex',flexDirection:'column',gap:'16px'}}>
          <div style={{fontSize:'24px',fontWeight:'bold',color:'hsl(140,60%,30%)',fontFamily:"'VT323', 'Courier New', monospace"}}>
            WORK ORDER SUBMITTED SUCCESSFULLY
          </div>
          <div style={{fontSize:'12px',fontFamily:"'Courier Prime', monospace"}}>
            Your work order has been placed into the PENDING REPAIRS queue.
          </div>
          <div style={{display:'flex',gap:'4px',justifyContent:'center'}}>
            <button
              className="win-button"
              style={{display:'flex',alignItems:'center',gap:'4px'}}
              onClick={() => { setSubmitted(false); setForm({ reported_by: '', bus_number: '', base_location: '', issue_description: '' }); }}
            >
              <FileText className="w-3 h-3" /> NEW WORK ORDER
            </button>
            <button
              className="win-button"
              style={{display:'flex',alignItems:'center',gap:'4px'}}
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
    <div style={{maxWidth:'640px',margin:'0 auto',display:'flex',flexDirection:'column',gap:'4px'}}>
       <WinWindow title="CREATE NEW WORK ORDER — CAMERA REPAIR REQUEST" icon="📝">
         <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          {/* Auto fields */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px'}}>
            <div>
              <label style={{fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>DATE/TIME (AUTO)</label>
              <div className="win-input" style={{width:'100%',background:'hsl(220,20%,92%)',fontSize:'12px',padding:'4px'}}>
                {moment().format('MM/DD/YYYY HH:mm:ss')}
              </div>
            </div>
            <div>
              <label style={{fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>ORDER # (AUTO)</label>
              <div className="win-input" style={{width:'100%',background:'hsl(220,20%,92%)',fontSize:'12px',padding:'4px'}}>
                {generateOrderNumber()}
              </div>
            </div>
          </div>

          {/* Reporter */}
          <div>
            <label style={{fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>REPORTING PERSON *</label>
            <select
              className="win-input"
              style={{width:'100%',fontSize:'12px',fontFamily:"'Courier Prime', monospace"}}
              value={form.reported_by}
              onChange={(e) => setForm({ ...form, reported_by: e.target.value })}
              required
            >
              <option value="">-- SELECT PERSON --</option>
              {systemUsers.filter(u => u.active !== false).map(u => (
                <option key={u.id} value={u.name}>{u.name}{u.role ? ` (${u.role})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Base Location */}
          <div>
            <label style={{fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>BASE LOCATION *</label>
            <select
              className="win-input"
              style={{width:'100%',fontSize:'12px'}}
              value={form.base_location}
              onChange={(e) => setForm({ ...form, base_location: e.target.value })}
              required
            >
              <option value="">-- SELECT LOCATION --</option>
              <option value="Main">Main</option>
              <option value="North">North</option>
              <option value="Central">Central</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          {/* Bus Selection */}
          <div>
            <label style={{fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>SELECT BUS # *</label>
            <select
              className="win-input"
              style={{width:'100%',fontSize:'12px'}}
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
            <label style={{fontSize:'11px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>ISSUE DESCRIPTION *</label>
            <textarea
              className="win-input"
              style={{width:'100%',fontSize:'12px',height:'128px',resize:'none'}}
              placeholder="Describe the camera system issue in detail..."
              value={form.issue_description}
              onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
              required
            />
          </div>

          <div style={{display:'flex',gap:'4px'}}>
            <button type="submit" className="win-button" style={{display:'flex',alignItems:'center',gap:'4px',background:'hsl(220,70%,35%)',color:'white'}} disabled={createMutation.isPending}>
              <Send className="w-3 h-3" />
              {createMutation.isPending ? 'SUBMITTING...' : 'SUBMIT WORK ORDER'}
            </button>
            <button
              type="button"
              className="win-button"
              onClick={() => setForm({ reported_by: '', bus_number: '', base_location: '', issue_description: '' })}
            >
              CLEAR FORM
            </button>
          </div>
        </form>
      </WinWindow>
    </div>
  );
}