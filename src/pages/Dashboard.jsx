import '../globals.css';
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import LoadingScreen from '../components/LoadingScreen';
import DashboardStats from '../components/dashboard/DashboardStats';
import ActiveWorkOrders from '../components/dashboard/ActiveWorkOrders';
import QuickTranscribe from '../components/dashboard/QuickTranscribe';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { AlertTriangle, PlusCircle, Bus, ClipboardCheck, Zap } from 'lucide-react';
import moment from 'moment';

export default function Dashboard() {
  const [showTranscribe, setShowTranscribe] = useState(false);

  const { data: buses = [], isLoading: busesLoading, error: busesError } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('-created_date'),
    retry: 2,
  });

  const { data: workOrders = [], isLoading: woLoading, error: woError } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
    retry: 2,
  });

  const { data: inspections = [], isLoading: inspLoading, error: inspError } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date'),
    retry: 2,
  });

  if (busesError || woError || inspError) {
    return <div className="p-4 text-red-600">Error loading data. Refresh the page.</div>;
  }

  const isLoading = busesLoading || woLoading || inspLoading;

  const recentCompleted = workOrders
    .filter(w => w.status === 'Completed')
    .slice(0, 5);

  const overdueInspections = buses.filter(b => {
    if (!b.next_inspection_due) return false;
    return new Date(b.next_inspection_due) < new Date();
  });

  return (
    <>
      <LoadingScreen isLoading={isLoading} message="LOADING FLEET DATA..." />
      <div style={{display:'flex',flexDirection:'column',gap:'8px',width:'100%',padding:'0',boxSizing:'border-box'}}>
      {/* Header Banner */}
      <div className="win-panel-inset" style={{padding:'16px',boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px'}}>
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{width:48,height:48,objectFit:'contain',flexShrink:0}} alt="NHCS Logo" />
        <div style={{flex:1,textAlign:'center',lineHeight:'1.4'}}>
          <div style={{fontSize:'12px',fontWeight:'bold',letterSpacing:'0.1em',textTransform:'uppercase',color:'hsl(220,10%,40%)',marginBottom:'4px'}}>New Hanover County Schools</div>
          <div style={{fontSize:'18px',fontWeight:'bold',letterSpacing:'0.08em',textTransform:'uppercase',color:'hsl(220,70%,35%)',marginBottom:'4px',fontFamily:"'Courier Prime', monospace"}}>SCHOOL BUS SURVEILLANCE SYSTEM</div>
          <div style={{fontSize:'11px',letterSpacing:'0.08em',textTransform:'uppercase',color:'hsl(220,10%,40%)'}}>Camera Repair &amp; Maintenance Management Database</div>
        </div>
        <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{width:48,height:48,objectFit:'contain',flexShrink:0}} alt="NHCS Logo" />
      </div>

      {/* Stats */}
      <div style={{display:'flex',flexDirection:'column',width:'100%'}}>
        <div className="win-titlebar" style={{width:'100%',margin:0}}>📊 SYSTEM STATUS OVERVIEW</div>
        <DashboardStats buses={buses} workOrders={workOrders} inspections={inspections} />
      </div>

      {/* Quick Actions */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
        <Link to={createPageUrl('NewWorkOrder')} className="win-button no-underline" style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',fontSize:'13px',background:'hsl(140,70%,40%)',color:'white',fontWeight:'bold'}}>
          <PlusCircle className="w-4 h-4" /> NEW WORK ORDER
        </Link>
        <Link to={createPageUrl('FleetManager')} className="win-button no-underline text-foreground" style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',fontSize:'13px'}}>
          <Bus className="w-4 h-4" /> MANAGE FLEET
        </Link>
        <Link to={createPageUrl('Inspections')} className="win-button no-underline text-foreground" style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',fontSize:'13px'}}>
          <ClipboardCheck className="w-4 h-4" /> INSPECTIONS
        </Link>
        <button
          className="win-button font-bold"
          style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',fontSize:'13px',background:'hsl(45,90%,50%)',color:'hsl(220,20%,10%)'}}
          onClick={() => setShowTranscribe(true)}
        >
          <Zap className="w-4 h-4" /> QUICK TRANSCRIBE
        </button>
      </div>

      {showTranscribe && <QuickTranscribe onClose={() => setShowTranscribe(false)} />}

      {/* Active Work Orders - full width */}
      <WinWindow title="ACTIVE WORK ORDERS — PENDING REPAIRS" icon="⚠️">
        <ActiveWorkOrders workOrders={workOrders} />
      </WinWindow>

      {/* Overdue Inspections - full width */}
      <WinWindow title="OVERDUE INSPECTIONS" icon="🔴">
        <div className="win-panel-inset" style={{ maxHeight: '400px', minHeight: '80px', overflow: 'auto', padding: '8px' }}>
          {overdueInspections.length === 0 ? (
            <div className="text-center text-[13px] p-4 text-muted-foreground">NO OVERDUE INSPECTIONS</div>
          ) : (
            overdueInspections.map(b => (
              <div key={b.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'13px',padding:'8px',borderBottom:'1px solid hsl(220,15%,70%)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',flex:1}}>
                  <AlertTriangle className="w-5 h-5" style={{color:'hsl(0,60%,45%)',flexShrink:0}} />
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:'bold'}}>BUS #{b.bus_number}</div>
                    <div style={{fontSize:'12px',color:'hsl(220,10%,40%)'}}>{b.year} {b.make} {b.model}</div>
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{color:'hsl(0,60%,45%)',fontWeight:'bold',fontSize:'12px'}}>OVERDUE</div>
                  <div style={{fontWeight:'bold',fontSize:'12px'}}>DUE: {moment(b.next_inspection_due).format('MM/DD/YY')}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </WinWindow>

      {/* Recently Completed */}
      <WinWindow title="RECENTLY COMPLETED REPAIRS" icon="✅">
        <div className="win-panel-inset" style={{ maxHeight: '320px', minHeight: '80px', overflow: 'auto', padding: '8px' }}>
          {recentCompleted.length === 0 ? (
            <div className="text-center text-[13px] p-4 text-muted-foreground">NO COMPLETED REPAIRS</div>
          ) : (
            recentCompleted.map(wo => (
              <div key={wo.id} style={{fontSize:'13px',padding:'8px',borderBottom:'1px solid hsl(220,15%,70%)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:'bold'}}>{wo.order_number} — BUS #{wo.bus_number}</span>
                  <span style={{color:'hsl(140,60%,30%)',fontWeight:'bold'}}>[DONE]</span>
                </div>
                <div style={{color:'hsl(220,10%,40%)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:'4px'}}>{wo.repairs_rendered}</div>
                {wo.technician_name && <div style={{fontSize:'12px',color:'hsl(220,10%,40%)',marginTop:'2px'}}>TECH: {wo.technician_name}</div>}
              </div>
            ))
          )}
        </div>
      </WinWindow>

      {/* System Log Footer */}
      <div className="win-panel-inset font-mono text-muted-foreground" style={{padding:'8px',margin:0,boxSizing:'border-box',fontSize:'12px',lineHeight:'1.6'}}>
        <div>&gt; SYSTEM INITIALIZED — NHCS MOBILE VEHICLE SURVEILLANCE INSPECTION SYSTEM</div>
        <div>&gt; DATABASE CONNECTION: <span className="status-completed font-bold">ONLINE</span></div>
        <div>&gt; TOTAL RECORDS: {buses.length} VEHICLES | {workOrders.length} WORK ORDERS | {inspections.length} INSPECTIONS</div>
        <div>&gt; SESSION ACTIVE — {moment().format('dddd, MMMM D, YYYY HH:mm:ss')}</div>
        <div style={{marginTop:'8px',paddingTop:'8px',borderTop:'1px solid hsl(220,15%,70%)',color:'hsl(220,10%,50%)',fontStyle:'italic',textAlign:'right',fontSize:'11px',letterSpacing:'0.04em'}}>
          Powered by Base44 &nbsp;|&nbsp; Developed by Clifton Warner M. &nbsp;&copy; {new Date().getFullYear()}
        </div>
      </div>
      </div>
      </>
      );
      }