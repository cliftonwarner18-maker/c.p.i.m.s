import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddHistoryForm from '../components/fleet/AddHistoryForm';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { FileDown, ArrowLeft, AlertTriangle, CheckCircle, Plus, Trash2, Bus, Camera, Wrench, ClipboardList, FileText, StickyNote } from 'lucide-react';

const Section = ({ title, icon: Icon, iconColor = 'hsl(220,55%,40%)', children, action }) => (
  <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
    <div style={{ background: 'hsl(220,45%,28%)', color: 'white', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.07em' }}>
        {Icon && <Icon style={{ width: 13, height: 13 }} />}
        {title}
      </div>
      {action}
    </div>
    <div style={{ padding: '12px' }}>{children}</div>
  </div>
);

const InfoGrid = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px' }}>
    {children}
  </div>
);

const InfoItem = ({ label, value, mono }) => (
  <div style={{ background: 'hsl(220,18%,97%)', border: '1px solid hsl(220,18%,88%)', borderRadius: '2px', padding: '6px 10px' }}>
    <div style={{ fontSize: '9px', color: 'hsl(220,10%,50%)', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
    <div style={{ fontSize: '12px', fontWeight: '600', color: 'hsl(220,20%,20%)', fontFamily: mono ? 'monospace' : "'Courier Prime', monospace", wordBreak: 'break-all' }}>{value || '—'}</div>
  </div>
);

const BoolItem = ({ label, value }) => (
  <div style={{ background: value ? 'hsl(140,55%,95%)' : 'hsl(220,18%,97%)', border: `1px solid ${value ? 'hsl(140,55%,78%)' : 'hsl(220,18%,88%)'}`, borderRadius: '2px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ fontSize: '10px', color: 'hsl(220,10%,45%)', fontWeight: '700', letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ fontSize: '11px', fontWeight: '700', color: value ? 'hsl(140,55%,30%)' : 'hsl(220,10%,55%)' }}>{value ? '✓ YES' : '✗ NO'}</div>
  </div>
);

const TableHead = ({ cols }) => (
  <thead>
    <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0, zIndex: 5 }}>
      {cols.map((c, i) => (
        <th key={i} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderRight: i < cols.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>{c}</th>
      ))}
    </tr>
  </thead>
);

export default function BusProfile() {
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const busNumber = urlParams.get('bus');
  const queryClient = useQueryClient();

  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list() });
  const { data: workOrders = [] } = useQuery({ queryKey: ['workOrders'], queryFn: () => base44.entities.WorkOrder.list('-created_date') });
  const { data: inspections = [] } = useQuery({ queryKey: ['inspections'], queryFn: () => base44.entities.Inspection.list('-created_date') });
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
  const overdue = bus?.next_inspection_due && new Date(bus.next_inspection_due) < new Date();

  const formatElapsed = (mins) => {
    if (!mins || mins <= 0) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('exportBusHistory', { busNumber });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `bus-${busNumber}-history.pdf`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); a.remove();
    } catch (error) {
      alert('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!bus) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontSize: '12px', letterSpacing: '0.06em', fontFamily: "'Courier Prime', monospace" }}>
        VEHICLE NOT FOUND IN DATABASE
      </div>
    );
  }

  const statusColors = { 'Active': 'hsl(140,55%,35%)', 'Out of Service': 'hsl(0,65%,42%)', 'Retired': 'hsl(220,10%,40%)' };
  const statusBg = { 'Active': 'hsl(140,55%,92%)', 'Out of Service': 'hsl(0,65%,93%)', 'Retired': 'hsl(220,10%,88%)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: "'Courier Prime', monospace" }}>
      {showAddHistory && (
        <AddHistoryForm busNumber={busNumber} onClose={() => setShowAddHistory(false)} onSaved={() => setShowAddHistory(false)} />
      )}

      {/* Top Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }} className="no-print">
        <Link to={createPageUrl('FleetManager')} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'white', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', textDecoration: 'none', color: 'hsl(220,20%,25%)', fontSize: '11px', fontWeight: '600', fontFamily: "'Courier Prime', monospace", letterSpacing: '0.05em' }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> BACK TO FLEET
        </Link>
        <button onClick={handleExportPDF} disabled={isExporting} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'hsl(220,55%,38%)', color: 'white', border: '1px solid hsl(220,55%,30%)', borderRadius: '2px', fontSize: '11px', fontWeight: '600', fontFamily: "'Courier Prime', monospace", letterSpacing: '0.05em', cursor: isExporting ? 'default' : 'pointer' }}>
          <FileDown style={{ width: 13, height: 13 }} /> {isExporting ? 'EXPORTING...' : 'EXPORT PDF REPORT'}
        </button>
      </div>

      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,28%), hsl(220,45%,38%))', color: 'white', borderRadius: '2px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '4px', padding: '10px', display: 'flex' }}>
            <Bus style={{ width: 32, height: 32 }} />
          </div>
          <div>
            <div style={{ fontSize: '10px', opacity: 0.75, letterSpacing: '0.1em', textTransform: 'uppercase' }}>New Hanover County Schools</div>
            <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '0.04em', lineHeight: 1.1 }}>BUS #{bus.bus_number}</div>
            <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>{bus.bus_type}{bus.make ? ` — ${bus.year || ''} ${bus.make} ${bus.model || ''}`.trim() : ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ display: 'inline-block', padding: '3px 10px', background: statusBg[bus.status] || 'hsl(140,55%,92%)', color: statusColors[bus.status] || 'hsl(140,55%,35%)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '2px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.06em' }}>{bus.status || 'Active'}</span>
          {bus.base_location && <span style={{ fontSize: '10px', opacity: 0.8 }}>📍 {bus.base_location} Base</span>}
          {overdue && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'hsl(0,70%,80%)', fontWeight: '700' }}><AlertTriangle style={{ width: 11, height: 11 }} /> INSPECTION OVERDUE</span>}
        </div>
      </div>

      {/* Two-column top section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Vehicle Data */}
        <Section title="VEHICLE DATA" icon={Bus}>
          <InfoGrid>
            <InfoItem label="BUS NUMBER" value={bus.bus_number} />
            <InfoItem label="TYPE" value={bus.bus_type} />
            <InfoItem label="BASE LOCATION" value={bus.base_location} />
            <InfoItem label="YEAR" value={bus.year} />
            <InfoItem label="MAKE" value={bus.make} />
            <InfoItem label="MODEL" value={bus.model} />
            <InfoItem label="VIN" value={bus.vin} mono />
            <InfoItem label="ENGINE" value={bus.engine} />
            <InfoItem label="PASSENGER CAPACITY" value={bus.passenger_capacity} />
            <BoolItem label="WHEELCHAIR ACCESSIBLE" value={bus.wheelchair_accessible} />
          </InfoGrid>
        </Section>

        {/* Camera System */}
        <Section title="CAMERA SYSTEM" icon={Camera}>
          <InfoGrid>
            <InfoItem label="CAMERA SYSTEM" value={bus.camera_system_type} />
            <InfoItem label="SERIAL #" value={bus.camera_serial_number} mono />
            <InfoItem label="MODEL #" value={bus.camera_model_number} mono />
            <InfoItem label="DVR ASSET #" value={bus.asset_number} mono />
            <InfoItem label="DASH CAM SID #" value={bus.dash_cam_sid} mono />
            <InfoItem label="GATEWAY SID #" value={bus.gateway_sid} mono />
          </InfoGrid>
          <div style={{ marginTop: '8px', borderTop: '1px solid hsl(220,18%,88%)', paddingTop: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,40%)', letterSpacing: '0.07em', marginBottom: '6px' }}>SAMSARA / AI CAMERA</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              <BoolItem label="SAMSARA" value={bus.samsara_enabled} />
              <BoolItem label="SAM AV" value={bus.samsara_av_enabled} />
              <BoolItem label="SAM INPUTS" value={bus.samsara_inputs_enabled} />
            </div>
          </div>
          {/* Inspection Status Banner */}
          <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: '700', background: overdue ? 'hsl(0,65%,93%)' : bus.next_inspection_due ? 'hsl(140,55%,92%)' : 'hsl(220,18%,94%)', color: overdue ? 'hsl(0,65%,38%)' : bus.next_inspection_due ? 'hsl(140,55%,30%)' : 'hsl(220,10%,45%)', border: `1px solid ${overdue ? 'hsl(0,65%,78%)' : 'hsl(140,55%,75%)'}` }}>
            {overdue ? <AlertTriangle style={{ width: 14, height: 14 }} /> : <CheckCircle style={{ width: 14, height: 14 }} />}
            {overdue
              ? `INSPECTION OVERDUE — DUE: ${moment(bus.next_inspection_due).format('MM/DD/YYYY')}`
              : bus.next_inspection_due
                ? `NEXT INSPECTION: ${moment(bus.next_inspection_due).format('MM/DD/YYYY')}`
                : 'NO INSPECTION DATE SET'}
          </div>
        </Section>
      </div>

      {/* Repair History */}
      <Section title={`REPAIR HISTORY — BUS #${bus.bus_number}`} icon={Wrench}>
        <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace", borderCollapse: 'collapse' }}>
            <TableHead cols={['ORDER #', 'DATE', 'REPORTED BY', 'ISSUE', 'STATUS', 'TECH', 'REPAIRS']} />
            <tbody>
              {busWorkOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'hsl(220,10%,55%)', fontSize: '11px' }}>NO REPAIR HISTORY</td></tr>
              ) : busWorkOrders.map((wo, i) => (
                <tr key={wo.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                    <Link to={createPageUrl('WorkOrderDetail') + `?id=${wo.id}`} style={{ color: 'hsl(220,60%,38%)', fontWeight: '700', textDecoration: 'underline' }}>{wo.order_number}</Link>
                  </td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', color: 'hsl(220,10%,40%)' }}>{moment(wo.created_date).format('MM/DD/YY')}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', fontSize: '10px' }}>{wo.reported_by}</td>
                  <td style={{ padding: '5px 8px' }}>{wo.issue_description}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', fontWeight: '700', fontSize: '10px', color: wo.status === 'Completed' ? 'hsl(140,55%,30%)' : wo.status === 'Pending' ? 'hsl(45,80%,35%)' : 'hsl(220,60%,38%)' }}>{wo.status}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', fontSize: '10px' }}>{wo.technician_name || '—'}</td>
                  <td style={{ padding: '5px 8px', fontSize: '10px' }}>{wo.repairs_rendered || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Inspection History */}
      <Section title={`INSPECTION HISTORY — BUS #${bus.bus_number}`} icon={ClipboardList}>
        <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace", borderCollapse: 'collapse' }}>
            <TableHead cols={['INSP #', 'DATE', 'INSPECTOR', 'CAMERA', 'LENSES', 'DVR', 'RESULT']} />
            <tbody>
              {busInspections.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'hsl(220,10%,55%)', fontSize: '11px' }}>NO INSPECTION HISTORY</td></tr>
              ) : busInspections.map((insp, i) => (
                <tr key={insp.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                    <Link to={createPageUrl('InspectionDetail') + `?id=${insp.id}`} style={{ color: 'hsl(220,60%,38%)', fontWeight: '700', textDecoration: 'underline' }}>{insp.inspection_number}</Link>
                  </td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', color: 'hsl(220,10%,40%)' }}>{moment(insp.created_date).format('MM/DD/YY')}</td>
                  <td style={{ padding: '5px 8px', fontSize: '10px' }}>{insp.inspector_name}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: '700', color: insp.camera_system_functional ? 'hsl(140,55%,30%)' : 'hsl(0,65%,38%)' }}>{insp.camera_system_functional ? '✓' : '✗'}</td>
                  <td style={{ padding: '5px 8px' }}>{insp.lenses_condition || '—'}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: '700', color: insp.dvr_functional ? 'hsl(140,55%,30%)' : 'hsl(0,65%,38%)' }}>{insp.dvr_functional ? '✓' : '✗'}</td>
                  <td style={{ padding: '5px 8px', fontWeight: '700', fontSize: '10px', color: insp.overall_status === 'Pass' ? 'hsl(140,55%,30%)' : insp.overall_status === 'Fail' ? 'hsl(0,65%,38%)' : 'hsl(45,80%,35%)' }}>{insp.overall_status || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Manual History Log */}
      <Section
        title={`MANUAL HISTORY LOG — BUS #${bus.bus_number}`}
        icon={FileText}
        action={
          <button onClick={() => setShowAddHistory(true)} className="no-print" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: '700', cursor: 'pointer', letterSpacing: '0.05em' }}>
            <Plus style={{ width: 11, height: 11 }} /> ADD ENTRY
          </button>
        }
      >
        <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace", borderCollapse: 'collapse' }}>
            <TableHead cols={['START', 'END', 'ELAPSED', 'TECH', 'DESCRIPTION', '']} />
            <tbody>
              {busHistory.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'hsl(220,10%,55%)', fontSize: '11px' }}>NO HISTORY ENTRIES</td></tr>
              ) : busHistory.map((h, i) => (
                <tr key={h.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', fontSize: '10px' }}>{h.start_time ? moment(h.start_time).format('MM/DD/YY HH:mm') : '—'}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', fontSize: '10px' }}>{h.end_time ? moment(h.end_time).format('MM/DD/YY HH:mm') : '—'}</td>
                  <td style={{ padding: '5px 8px', fontWeight: '700', whiteSpace: 'nowrap', color: 'hsl(220,55%,38%)' }}>{formatElapsed(h.elapsed_minutes)}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', fontSize: '10px' }}>{h.technician}</td>
                  <td style={{ padding: '5px 8px' }}>{h.description}</td>
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }} className="no-print">
                    <button onClick={() => { if (confirm('Delete this entry?')) deleteHistory(h.id); }} title="Delete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, background: 'hsl(0,65%,48%)', color: 'white', borderRadius: '2px', border: '1px solid hsl(0,65%,38%)', cursor: 'pointer' }}>
                      <Trash2 style={{ width: 10, height: 10 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Notes */}
      {bus.notes && (
        <Section title="VEHICLE NOTES" icon={StickyNote}>
          <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'hsl(220,20%,25%)', background: 'hsl(220,18%,97%)', border: '1px solid hsl(220,18%,85%)', borderRadius: '2px', padding: '10px 12px' }}>{bus.notes}</div>
        </Section>
      )}

      {/* Legacy Upload */}
      {bus.legacy_upload && (
        <Section title="LEGACY AUDIT / REPAIR LOG" icon={FileText}>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '320px', overflowY: 'auto', background: 'hsl(220,20%,10%)', color: 'hsl(140,60%,55%)', padding: '12px', borderRadius: '2px', lineHeight: '1.5' }}>{bus.legacy_upload}</div>
        </Section>
      )}
    </div>
  );
}