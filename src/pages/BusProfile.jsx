import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import AddHistoryForm from '../components/fleet/AddHistoryForm';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Printer, ArrowLeft, AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';
export default function BusProfile() {
  const [showAddHistory, setShowAddHistory] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const busNumber = urlParams.get('bus');

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list(),
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date'),
  });

  const queryClient = useQueryClient();

  const { data: busHistory = [] } = useQuery({
    queryKey: ['busHistory', busNumber],
    queryFn: () => base44.entities.BusHistory.filter({ bus_number: busNumber }, '-start_time'),
    enabled: !!busNumber,
  });

  const { mutate: deleteHistory } = useMutation({
    mutationFn: (id) => base44.entities.BusHistory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['busHistory', busNumber] }),
  });

  const bus = buses.find(b => b.bus_number === busNumber);
  const busWorkOrders = workOrders.filter(w => w.bus_number === busNumber);
  const busInspections = inspections.filter(i => i.bus_number === busNumber);

  if (!bus) {
    return (
      <WinWindow title="VEHICLE NOT FOUND">
        <div className="win-panel-inset p-4 text-center terminal-text">VEHICLE NOT FOUND IN DATABASE</div>
      </WinWindow>
    );
  }

  const DataRow = ({ label, value }) => (
    <div className="flex justify-between text-[11px] py-0.5 border-b border-border">
      <span className="font-bold">{label}:</span>
      <span>{value || '—'}</span>
    </div>
  );

  const overdue = bus.next_inspection_due && new Date(bus.next_inspection_due) < new Date();

  const formatElapsed = (mins) => {
    if (!mins || mins <= 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-2">
      {showAddHistory && (
        <AddHistoryForm
          busNumber={busNumber}
          onClose={() => setShowAddHistory(false)}
          onSaved={() => setShowAddHistory(false)}
        />
      )}
      <div className="flex gap-2 no-print">
        <Link to={createPageUrl('FleetManager')} className="win-button flex items-center gap-1 text-[11px] no-underline text-foreground">
          <ArrowLeft className="w-3 h-3" /> BACK TO FLEET
        </Link>
        <button className="win-button flex items-center gap-1 text-[11px]" onClick={() => window.print()}>
          <Printer className="w-3 h-3" /> PRINT FULL HISTORY REPORT
        </button>
      </div>

      {/* Header */}
      <div className="win-panel-inset p-3 text-center">
        <div className="text-[10px] font-bold tracking-[0.2em]">NEW HANOVER COUNTY SCHOOLS</div>
        <div className="terminal-text text-2xl font-bold text-primary">BUS #{bus.bus_number} — VEHICLE PROFILE</div>
        <div className="text-[11px]">{bus.bus_type} | {bus.status}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Vehicle Data */}
        <WinWindow title="VEHICLE DATA" icon="🚌">
          <div className="win-panel-inset p-2">
            <DataRow label="BUS #" value={bus.bus_number} />
            <DataRow label="TYPE" value={bus.bus_type} />
            <DataRow label="BASE LOCATION" value={bus.base_location} />
            <DataRow label="YEAR" value={bus.year} />
            <DataRow label="MAKE" value={bus.make} />
            <DataRow label="MODEL" value={bus.model} />
            <DataRow label="VIN" value={bus.vin} />
            <DataRow label="ENGINE" value={bus.engine} />
            <DataRow label="CAPACITY" value={bus.passenger_capacity} />
            <DataRow label="WHEELCHAIR" value={bus.wheelchair_accessible ? 'YES' : 'NO'} />
            <DataRow label="STATUS" value={bus.status} />
          </div>
        </WinWindow>

        {/* Camera System */}
        <WinWindow title="CAMERA SYSTEM DATA" icon="📹">
          <div className="win-panel-inset p-2">
            <DataRow label="CAMERA SYSTEM" value={bus.camera_system_type} />
            <DataRow label="SERIAL #" value={bus.camera_serial_number} />
            <DataRow label="MODEL #" value={bus.camera_model_number} />
            <DataRow label="DVR ASSET #" value={bus.asset_number} />
            <div className="mt-2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5">AI CAMERA (SAMSARA)</div>
            <DataRow label="SAMSARA" value={bus.samsara_enabled ? '☑ YES' : '☐ NO'} />
            <DataRow label="SAM AV" value={bus.samsara_av_enabled ? '☑ YES' : '☐ NO'} />
            <DataRow label="SAM INPUTS" value={bus.samsara_inputs_enabled ? '☑ YES' : '☐ NO'} />
            <DataRow label="DASH CAM SID#" value={bus.dash_cam_sid} />
            <DataRow label="GATEWAY SID#" value={bus.gateway_sid} />
          </div>
          {/* Inspection Status */}
          <div className={`mt-1 p-2 text-center text-[11px] font-bold ${overdue ? 'bg-destructive/10 status-cancelled' : 'bg-primary/10 status-completed'}`}>
            {overdue ? (
              <><AlertTriangle className="w-4 h-4 inline mr-1" />INSPECTION OVERDUE — DUE: {moment(bus.next_inspection_due).format('MM/DD/YYYY')}</>
            ) : bus.next_inspection_due ? (
              <><CheckCircle className="w-4 h-4 inline mr-1" />NEXT INSPECTION: {moment(bus.next_inspection_due).format('MM/DD/YYYY')}</>
            ) : (
              'NO INSPECTION DATE SET'
            )}
          </div>
        </WinWindow>
      </div>

      {/* Repair History */}
      <WinWindow title={`REPAIR HISTORY — BUS #${bus.bus_number}`} icon="🔧">
        <div className="win-panel-inset overflow-auto" style={{ maxHeight: '300px' }}>
          <table className="w-full text-[10px] font-mono" style={{tableLayout:'auto'}}>
            <thead>
              <tr className="bg-primary text-primary-foreground sticky top-0">
                <th className="p-1 text-left whitespace-nowrap">ORDER#</th>
                <th className="p-1 text-left whitespace-nowrap">DATE</th>
                <th className="p-1 text-left whitespace-nowrap">REPORTED</th>
                <th className="p-1 text-left">ISSUE</th>
                <th className="p-1 text-left whitespace-nowrap">STATUS</th>
                <th className="p-1 text-left whitespace-nowrap">TECH</th>
                <th className="p-1 text-left">REPAIRS</th>
              </tr>
            </thead>
            <tbody>
              {busWorkOrders.length === 0 && (
                <tr><td colSpan={7} className="p-3 text-center text-muted-foreground">NO REPAIR HISTORY</td></tr>
              )}
              {busWorkOrders.map((wo, i) => (
                <tr key={wo.id} className={i % 2 === 0 ? 'bg-card' : 'bg-background'}>
                  <td className="p-1 font-bold whitespace-nowrap">
                    <Link to={createPageUrl('WorkOrderDetail') + `?id=${wo.id}`} className="text-primary underline">
                      {wo.order_number}
                    </Link>
                  </td>
                  <td className="p-1 whitespace-nowrap">{moment(wo.created_date).format('MM/DD/YY')}</td>
                  <td className="p-1 whitespace-nowrap text-[9px]">{wo.reported_by}</td>
                  <td className="p-1">{wo.issue_description}</td>
                  <td className={`p-1 font-bold whitespace-nowrap ${wo.status === 'Completed' ? 'status-completed' : wo.status === 'Pending' ? 'status-pending' : 'status-progress'}`}>
                    [{wo.status?.toUpperCase()}]
                  </td>
                  <td className="p-1 whitespace-nowrap text-[9px]">{wo.technician_name || '—'}</td>
                  <td className="p-1">{wo.repairs_rendered || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WinWindow>

      {/* Inspection History */}
      <WinWindow title={`INSPECTION HISTORY — BUS #${bus.bus_number}`} icon="📋">
        <div className="win-panel-inset overflow-auto" style={{ maxHeight: '300px' }}>
          <table className="w-full text-[10px] font-mono" style={{tableLayout:'auto'}}>
            <thead>
              <tr className="bg-primary text-primary-foreground sticky top-0">
                <th className="p-1 text-left whitespace-nowrap">INSP#</th>
                <th className="p-1 text-left whitespace-nowrap">DATE</th>
                <th className="p-1 text-left whitespace-nowrap">INSPECTOR</th>
                <th className="p-1 text-left">CAMERA</th>
                <th className="p-1 text-left">LENSES</th>
                <th className="p-1 text-left">DVR</th>
                <th className="p-1 text-left">RESULT</th>
              </tr>
            </thead>
            <tbody>
              {busInspections.length === 0 && (
                <tr><td colSpan={7} className="p-3 text-center text-muted-foreground">NO INSPECTION HISTORY</td></tr>
              )}
              {busInspections.map((insp, i) => (
                <tr key={insp.id} className={i % 2 === 0 ? 'bg-card' : 'bg-background'}>
                  <td className="p-1 font-bold whitespace-nowrap">
                    <Link to={createPageUrl('InspectionDetail') + `?id=${insp.id}`} className="text-primary underline">
                      {insp.inspection_number}
                    </Link>
                  </td>
                  <td className="p-1 whitespace-nowrap">{moment(insp.created_date).format('MM/DD/YY')}</td>
                  <td className="p-1 whitespace-nowrap text-[9px]">{insp.inspector_name}</td>
                  <td className="p-1 text-center">{insp.camera_system_functional ? '✓' : '✗'}</td>
                  <td className="p-1">{insp.lenses_condition || '—'}</td>
                  <td className="p-1 text-center">{insp.dvr_functional ? '✓' : '✗'}</td>
                  <td className={`p-1 font-bold whitespace-nowrap ${insp.overall_status === 'Pass' ? 'status-completed' : insp.overall_status === 'Fail' ? 'status-cancelled' : 'status-pending'}`}>
                    [{insp.overall_status?.toUpperCase() || 'N/A'}]
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WinWindow>

      {/* Manual History */}
       <WinWindow title={`MANUAL HISTORY LOG — BUS #${bus.bus_number}`} icon="📝">
         <div className="flex justify-end mb-2 no-print">
           <button
             className="win-button flex items-center gap-1 text-[11px] !bg-primary !text-primary-foreground"
             onClick={() => setShowAddHistory(true)}
           >
             <Plus className="w-3 h-3" /> ADD HISTORY ENTRY
           </button>
         </div>
        <div className="win-panel-inset overflow-auto" style={{ maxHeight: '300px' }}>
         <table className="w-full text-[10px] font-mono" style={{tableLayout:'auto'}}>
           <thead>
             <tr className="bg-primary text-primary-foreground sticky top-0">
               <th className="p-1 text-left whitespace-nowrap">START</th>
               <th className="p-1 text-left whitespace-nowrap">END</th>
               <th className="p-1 text-left whitespace-nowrap">ELAPSED</th>
               <th className="p-1 text-left whitespace-nowrap">TECH</th>
               <th className="p-1 text-left">DESCRIPTION</th>
               <th className="p-1 text-left no-print whitespace-nowrap">ACTION</th>
             </tr>
           </thead>
           <tbody>
             {busHistory.length === 0 && (
               <tr><td colSpan={6} className="p-3 text-center text-muted-foreground">NO HISTORY ENTRIES</td></tr>
             )}
             {busHistory.map((h, i) => (
               <tr key={h.id} className={i % 2 === 0 ? 'bg-card' : 'bg-background'}>
                 <td className="p-1 whitespace-nowrap text-[9px]">{h.start_time ? moment(h.start_time).format('MM/DD/YY HH:mm') : '—'}</td>
                 <td className="p-1 whitespace-nowrap text-[9px]">{h.end_time ? moment(h.end_time).format('MM/DD/YY HH:mm') : '—'}</td>
                 <td className="p-1 font-bold whitespace-nowrap">{formatElapsed(h.elapsed_minutes)}</td>
                 <td className="p-1 whitespace-nowrap text-[9px]">{h.technician}</td>
                 <td className="p-1">{h.description}</td>
                 <td className="p-1 no-print whitespace-nowrap">
                   <button
                     className="win-button !py-0 !px-1 text-[9px]"
                     onClick={() => { if (confirm('Delete this entry?')) deleteHistory(h.id); }}
                     title="Delete"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
        </div>
      </WinWindow>

      {/* Notes */}
      {bus.notes && (
        <WinWindow title="VEHICLE NOTES" icon="📝">
          <div className="win-panel-inset p-2 text-[11px]">{bus.notes}</div>
        </WinWindow>
      )}

      {/* Legacy Upload */}
      {bus.legacy_upload && (
        <WinWindow title="LEGACY UPLOAD — AUDIT/REPAIR LOG" icon="📄">
          <div className="win-panel-inset p-2 text-[11px] font-mono whitespace-pre-wrap break-words max-h-80 overflow-auto">
            {bus.legacy_upload}
          </div>
        </WinWindow>
      )}
      </div>
      );
      }