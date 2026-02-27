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
    queryFn: async () => {
      const orders = await base44.entities.WorkOrder.list();
      return orders.find(o => o.id === id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
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
    <div style={{maxWidth:'900px',margin:'0 auto',display:'flex',flexDirection:'column',gap:'4px'}}>
      <div className="no-print" style={{display:'flex',gap:'4px'}}>
         <Link to={createPageUrl('WorkOrders')} className="win-button no-underline" style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'inherit'}}>
           <ArrowLeft className="w-3 h-3" /> BACK TO WORK ORDERS
         </Link>
         <Link to={createPageUrl('Dashboard')} className="win-button no-underline" style={{fontSize:'11px',color:'inherit'}}>
           DASHBOARD
         </Link>
       </div>

      <div ref={printRef}>
        <WinWindow title={`WORK ORDER: ${workOrder.order_number} — BUS #${workOrder.bus_number}`} icon="🔧">
          {/* Header */}
          <div className="win-panel-inset" style={{padding:'8px',marginBottom:'4px',textAlign:'center'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',marginBottom:'4px'}}>
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{width:40,height:40,objectFit:'contain'}} />
              <div>
                <div style={{fontSize:'10px',fontWeight:'bold',letterSpacing:'0.2em'}}>NEW HANOVER COUNTY SCHOOLS</div>
                <div style={{fontSize:'13px',fontWeight:'bold',letterSpacing:'0.05em'}}>MOBILE VEHICLE SURVEILLANCE — REPAIR WORK ORDER</div>
                <div style={{fontSize:'11px',color:'hsl(220,10%,40%)'}}>OFFICIAL SERVICE RECORD</div>
              </div>
            </div>
          </div>

          {/* Original Complaint */}
          <div className="win-panel" style={{padding:'4px',marginBottom:'4px',background:'hsl(220,15%,90%)',border:'2px solid hsl(220,15%,50%)'}}>
            <div style={{fontSize:'11px',fontWeight:'bold',background:'hsl(220,70%,35%)',color:'white',padding:'2px 4px',marginBottom:'4px'}}>
              ▸ ORIGINAL COMPLAINT
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',fontSize:'11px',padding:'0 4px'}}>
              <div><span style={{fontWeight:'bold'}}>ORDER#:</span> {workOrder.order_number}</div>
              <div><span style={{fontWeight:'bold'}}>DATE:</span> {moment(workOrder.created_date).format('MM/DD/YYYY HH:mm:ss')}</div>
              <div><span style={{fontWeight:'bold'}}>BUS#:</span> {workOrder.bus_number}</div>
              <div><span style={{fontWeight:'bold'}}>REPORTED BY:</span> {workOrder.reported_by}</div>
            </div>
            <div style={{marginTop:'4px',fontSize:'11px',padding:'0 4px'}}>
              <span style={{fontWeight:'bold'}}>ISSUE:</span>
              <div className="win-panel-inset" style={{padding:'4px',marginTop:'2px',fontSize:'11px'}}>{workOrder.issue_description}</div>
            </div>
          </div>

          {/* Repair Section */}
          <div className="win-panel" style={{padding:'4px',marginBottom:'4px',background:'hsl(220,15%,90%)',border:'2px solid hsl(220,15%,50%)'}}>
            <div style={{fontSize:'11px',fontWeight:'bold',background:'hsl(220,70%,35%)',color:'white',padding:'2px 4px',marginBottom:'4px'}}>
              ▸ REPAIRS RENDERED
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'4px',padding:'0 4px'}}>
              <div>
                <label style={{fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>TECHNICIAN NAME:</label>
                <input
                  className="win-input"
                  style={{width:'100%',fontSize:'12px'}}
                  value={form.technician_name}
                  onChange={(e) => setForm({ ...form, technician_name: e.target.value })}
                  placeholder="Enter technician name..."
                />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px'}}>
                <div>
                  <label style={{fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>START TIME:</label>
                  <input
                    type="time"
                    className="win-input"
                    style={{width:'100%',fontSize:'12px'}}
                    value={form.repair_start_time}
                    onChange={(e) => setForm({ ...form, repair_start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>END TIME:</label>
                  <input
                    type="time"
                    className="win-input"
                    style={{width:'100%',fontSize:'12px'}}
                    value={form.repair_end_time}
                    onChange={(e) => setForm({ ...form, repair_end_time: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>ELAPSED TIME:</label>
                  <div className="win-input" style={{width:'100%',fontSize:'12px',background:'hsl(220,20%,92%)',fontWeight:'bold',padding:'2px 4px',boxSizing:'border-box'}}>
                    {elapsed || '—'}
                  </div>
                </div>
              </div>
              <div>
                <label style={{fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>REPAIRS RENDERED:</label>
                <textarea
                  className="win-input"
                  style={{width:'100%',fontSize:'12px',height:'96px',resize:'none'}}
                  value={form.repairs_rendered}
                  onChange={(e) => setForm({ ...form, repairs_rendered: e.target.value })}
                  placeholder="Describe repairs performed..."
                />
              </div>
              <div>
                <label style={{fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'2px'}}>STATUS:</label>
                <select
                  className="win-input"
                  style={{width:'100%',fontSize:'12px'}}
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
          <div className="win-panel-inset" style={{padding:'4px',marginBottom:'4px',fontSize:'10px',color:'hsl(220,10%,40%)'}}>
            <div>CREATED: {moment(workOrder.created_date).format('MM/DD/YYYY HH:mm:ss')}</div>
            <div>LAST UPDATED: {moment(workOrder.updated_date).format('MM/DD/YYYY HH:mm:ss')}</div>
            {workOrder.completed_date && <div>COMPLETED: {moment(workOrder.completed_date).format('MM/DD/YYYY HH:mm:ss')}</div>}
          </div>

          {/* Actions */}
          <div className="no-print" style={{display:'flex',gap:'4px'}}>
            <button
              className="win-button"
              style={{display:'flex',alignItems:'center',gap:'4px',background:'hsl(220,70%,35%)',color:'white'}}
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              <Save className="w-3 h-3" /> {updateMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button className="win-button" style={{display:'flex',alignItems:'center',gap:'4px'}} onClick={handlePrint}>
              <Printer className="w-3 h-3" /> PRINT RECEIPT
            </button>
          </div>
        </WinWindow>
      </div>
    </div>
  );
}