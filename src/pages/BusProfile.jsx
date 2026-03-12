import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Bus, Wrench, ClipboardCheck, FileText, Plus, Download, Edit, AlertTriangle, CheckCircle, XCircle, Clock, Pencil, Trash2 } from 'lucide-react';

const S = {
  label: { fontSize: '9px', fontWeight: '700', letterSpacing: '0.07em', color: 'hsl(220,10%,50%)', textTransform: 'uppercase', marginBottom: '2px' },
  value: { fontSize: '12px', fontFamily: "'Courier Prime', monospace", color: 'hsl(220,20%,15%)', fontWeight: '500' },
  card: { background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '12px 14px' },
  th: { padding: '6px 8px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', textAlign: 'left', background: 'hsl(220,45%,28%)', color: 'white', whiteSpace: 'nowrap' },
  td: { padding: '5px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", borderBottom: '1px solid hsl(220,18%,90%)' },
};

function Field({ label, value }) {
  return (
    <div>
      <div style={S.label}>{label}</div>
      <div style={S.value}>{value || <span style={{ color: 'hsl(220,10%,65%)' }}>—</span>}</div>
    </div>
  );
}

function SectionHeader({ title, icon: Icon, color = 'hsl(220,45%,28%)' }) {
  return (
    <div style={{ background: color, color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '2px 2px 0 0' }}>
      {Icon && <Icon style={{ width: 13, height: 13 }} />}
      {title}
    </div>
  );
}

export default function BusProfile() {
  const params = new URLSearchParams(window.location.search);
  const busNumber = params.get('bus');
  const queryClient = useQueryClient();
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [historyForm, setHistoryForm] = useState({ technician: '', description: '', start_time: '', end_time: '' });
  const [isExporting, setIsExporting] = useState(false);

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date'),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['busHistory'],
    queryFn: () => base44.entities.BusHistory.list('-created_date'),
  });

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });

  const addHistoryMutation = useMutation({
    mutationFn: (data) => base44.entities.BusHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busHistory'] });
      setShowHistoryForm(false);
      setHistoryForm({ technician: '', description: '', start_time: '', end_time: '' });
    },
  });

  const updateHistoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BusHistory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busHistory'] });
      setEditingHistoryId(null);
      setHistoryForm({ technician: '', description: '', start_time: '', end_time: '' });
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: (id) => base44.entities.BusHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busHistory'] });
    },
  });

  const bus = buses.find(b => b.bus_number === busNumber);
  const busWOs = workOrders.filter(wo => wo.bus_number === busNumber);
  const busInspections = inspections.filter(i => i.bus_number === busNumber);
  const busHistory = history.filter(h => h.bus_number === busNumber);

  if (!bus && buses.length > 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Courier Prime', monospace" }}>
        <div style={{ fontSize: '13px', color: 'hsl(0,65%,40%)', marginBottom: '12px' }}>BUS #{busNumber} NOT FOUND IN DATABASE</div>
        <Link to={createPageUrl('FleetManager')} style={{ fontSize: '11px', color: 'hsl(220,60%,40%)', textDecoration: 'underline' }}>← BACK TO FLEET</Link>
      </div>
    );
  }

  const overdue = bus?.next_inspection_due && new Date(bus.next_inspection_due) < new Date();

  const calcElapsed = (start, end) => {
    if (!start || !end) return null;
    const diff = Math.round((new Date(end) - new Date(start)) / 60000);
    return diff > 0 ? diff : null;
  };

  const handleAddHistory = () => {
    const elapsed = calcElapsed(historyForm.start_time, historyForm.end_time);
    addHistoryMutation.mutate({
      bus_number: busNumber,
      technician: historyForm.technician,
      description: historyForm.description,
      start_time: historyForm.start_time,
      end_time: historyForm.end_time,
      elapsed_minutes: elapsed,
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('exportBusHistory', { busNumber });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bus-${busNumber}-history.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      alert('Export failed: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const statusColor = bus?.status === 'Active' ? 'hsl(140,55%,35%)' : bus?.status === 'Out of Service' ? 'hsl(0,65%,40%)' : 'hsl(220,10%,40%)';
  const statusBg = bus?.status === 'Active' ? 'hsl(140,55%,92%)' : bus?.status === 'Out of Service' ? 'hsl(0,65%,93%)' : 'hsl(220,10%,88%)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: "'Courier Prime', monospace" }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link to={createPageUrl('FleetManager')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', color: 'white', textDecoration: 'none' }}>
            <ArrowLeft style={{ width: 14, height: 14 }} />
          </Link>
          <Bus style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.08em' }}>Bus #{busNumber} - Vehicle Profile</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>
              {bus ? `${bus.year || ''} ${bus.make || ''} ${bus.model || ''}`.trim() || 'Vehicle Details' : 'Loading...'}
            </div>
          </div>
          {bus && (
            <span style={{ padding: '3px 9px', background: statusBg, color: statusColor, border: `1px solid ${statusColor}`, borderRadius: '2px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em' }}>
              {bus.status}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleExport} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: 'pointer', letterSpacing: '0.05em' }}>
            <Download style={{ width: 13, height: 13 }} /> {isExporting ? 'EXPORTING...' : 'EXPORT PDF'}
          </button>
        </div>
      </div>

      {!bus ? (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '40px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontSize: '12px' }}>
          LOADING VEHICLE DATA...
        </div>
      ) : (
        <>
          {/* Vehicle Info */}
          <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
            <SectionHeader title="VEHICLE INFORMATION" icon={Bus} />
            <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', background: 'white' }}>
              <Field label="Bus Number" value={bus.bus_number} />
              <Field label="Type" value={bus.bus_type} />
              <Field label="Year" value={bus.year} />
              <Field label="Make" value={bus.make} />
              <Field label="Model" value={bus.model} />
              <Field label="VIN" value={bus.vin} />
              <Field label="Engine" value={bus.engine} />
              <Field label="Capacity" value={bus.passenger_capacity ? `${bus.passenger_capacity} passengers` : null} />
              <Field label="Location" value={bus.base_location} />
              <Field label="Asset #" value={bus.asset_number} />
              <Field label="Wheelchair" value={bus.wheelchair_accessible ? 'YES' : 'NO'} />
              <Field label="Next Inspection" value={bus.next_inspection_due ? (
                <span style={{ color: overdue ? 'hsl(0,65%,40%)' : 'hsl(140,50%,32%)', fontWeight: overdue ? '700' : '500' }}>
                  {overdue ? '⚠ OVERDUE — ' : ''}{new Date(bus.next_inspection_due).toLocaleDateString()}
                </span>
              ) : null} />
            </div>
          </div>

          {/* Camera System */}
          <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
            <SectionHeader title="CAMERA & SURVEILLANCE SYSTEM" icon={ClipboardCheck} color="hsl(200,65%,30%)" />
            <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', background: 'white' }}>
              <Field label="Primary Camera Type" value={bus.camera_system_type} />
              <Field label="Camera Serial Number" value={bus.camera_serial_number} />
              <Field label="Camera Model Number" value={bus.camera_model_number} />
              <Field label="Inside Cameras" value={bus.cameras_inside != null ? String(bus.cameras_inside) : '—'} />
              <Field label="Outside Cameras" value={bus.cameras_outside != null ? String(bus.cameras_outside) : '—'} />
              <Field label="AI Cameras" value={bus.cameras_ai != null ? String(bus.cameras_ai) : '—'} />
              <Field label="Total Cameras Installed" value={
                (() => {
                  const total = (bus.cameras_inside||0)+(bus.cameras_outside||0)+(bus.cameras_ai||0);
                  const parts = [];
                  if (bus.cameras_inside != null) parts.push(`${bus.cameras_inside} inside`);
                  if (bus.cameras_outside != null) parts.push(`${bus.cameras_outside} outside`);
                  if (bus.cameras_ai != null) parts.push(`${bus.cameras_ai} AI`);
                  return <span style={{fontWeight:'700',color:'hsl(220,70%,35%)'}}>{total} <span style={{fontSize:'10px',color:'hsl(220,10%,50%)',fontWeight:'400'}}>{parts.length ? `(${parts.join(' + ')})` : ''}</span></span>;
                })()
              } />
              <Field label="AI Cameras Installed" value={
                <span style={{fontWeight:'700',color: bus.ai_cameras_installed ? 'hsl(140,55%,30%)' : 'hsl(0,60%,40%)'}}>{bus.ai_cameras_installed ? '✓ YES' : '✗ NO'}</span>
              } />
              <Field label="Stop Arm Violation Cameras" value={
                <span style={{fontWeight:'700',color: bus.stop_arm_cameras ? 'hsl(140,55%,30%)' : 'hsl(0,60%,40%)'}}>{bus.stop_arm_cameras ? '✓ INSTALLED' : '✗ NOT INSTALLED'}</span>
              } />
              <Field label="Dash Cam SID" value={bus.dash_cam_sid} />
              <Field label="Gateway SID" value={bus.gateway_sid} />
              <Field label="Samsara Enabled" value={bus.samsara_enabled ? 'YES' : 'NO'} />
              <Field label="Samsara Audio-Video" value={bus.samsara_av_enabled ? 'YES' : 'NO'} />
              <Field label="Samsara Inputs Module" value={bus.samsara_inputs_enabled ? 'YES' : 'NO'} />
            </div>
          </div>

          {/* Work Orders */}
          <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
            <SectionHeader title={`WORK ORDERS (${busWOs.length})`} icon={Wrench} color="hsl(30,65%,35%)" />
            {busWOs.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,55%)', fontSize: '11px', background: 'white' }}>NO WORK ORDERS ON FILE</div>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
                  <thead>
                    <tr>
                      {['W/O #', 'DATE', 'REPORTED BY', 'ISSUE', 'STATUS', 'TECHNICIAN', 'ELAPSED'].map((h, i) => (
                        <th key={i} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {busWOs.map((wo, i) => (
                      <tr key={wo.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,20%,97%)' }}>
                        <td style={S.td}>
                          <Link to={`/WorkOrderDetail?id=${wo.id}`} style={{ color: 'hsl(220,60%,40%)', textDecoration: 'none', fontWeight: '700' }}>
                            {wo.order_number || wo.id?.slice(-6)}
                          </Link>
                        </td>
                        <td style={S.td}>{wo.created_date ? new Date(wo.created_date).toLocaleDateString() : '—'}</td>
                        <td style={S.td}>{wo.reported_by || '—'}</td>
                        <td style={{ ...S.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wo.issue_description || '—'}</td>
                        <td style={S.td}>
                          <span style={{ fontWeight: '700', color: wo.status === 'Completed' ? 'hsl(140,55%,30%)' : wo.status === 'Pending' ? 'hsl(30,70%,38%)' : 'hsl(220,55%,35%)' }}>
                            {wo.status}
                          </span>
                        </td>
                        <td style={S.td}>{wo.technician_name || '—'}</td>
                        <td style={S.td}>{wo.elapsed_time_minutes ? `${wo.elapsed_time_minutes} min` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Inspections */}
          <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
            <SectionHeader title={`INSPECTIONS (${busInspections.length})`} icon={ClipboardCheck} color="hsl(140,50%,28%)" />
            {busInspections.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,55%)', fontSize: '11px', background: 'white' }}>NO INSPECTIONS ON FILE</div>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
                  <thead>
                    <tr>
                      {['DATE', 'INSPECTOR', 'OVERALL', 'CAMERA', 'DVR', 'SIGNALS', 'NEXT DUE', 'NOTES'].map((h, i) => (
                        <th key={i} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {busInspections.map((ins, i) => (
                      <tr key={ins.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,20%,97%)' }}>
                        <td style={S.td}>{ins.inspection_date ? new Date(ins.inspection_date).toLocaleDateString() : new Date(ins.created_date).toLocaleDateString()}</td>
                        <td style={S.td}>{ins.inspector_name || '—'}</td>
                        <td style={S.td}>
                          <span style={{ fontWeight: '700', color: ins.overall_status === 'Pass' ? 'hsl(140,55%,30%)' : ins.overall_status === 'Fail' ? 'hsl(0,65%,40%)' : 'hsl(30,70%,38%)' }}>
                            {ins.overall_status || '—'}
                          </span>
                        </td>
                        <td style={S.td}>{ins.camera_system_functional ? '✓' : '✗'}</td>
                        <td style={S.td}>{ins.dvr_functional ? '✓' : '✗'}</td>
                        <td style={S.td}>{ins.signals_lights_functional ? '✓' : '✗'}</td>
                        <td style={S.td}>{ins.next_inspection_due ? new Date(ins.next_inspection_due).toLocaleDateString() : '—'}</td>
                        <td style={{ ...S.td, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.inspection_notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manual Service Log */}
          <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ background: 'hsl(280,40%,30%)', color: 'white', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '2px 2px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.07em' }}>
                <FileText style={{ width: 13, height: 13 }} />
                MANUAL SERVICE LOG ({busHistory.length})
              </div>
              <button onClick={() => setShowHistoryForm(!showHistoryForm)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: 'pointer', letterSpacing: '0.05em' }}>
                <Plus style={{ width: 11, height: 11 }} /> ADD ENTRY
              </button>
            </div>

            {showHistoryForm && (
              <div style={{ padding: '12px 14px', background: 'hsl(220,18%,96%)', borderBottom: '1px solid hsl(220,18%,82%)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <div style={S.label}>TECHNICIAN *</div>
                    <select value={historyForm.technician} onChange={e => setHistoryForm(f => ({ ...f, technician: e.target.value }))} style={{ width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' }}>
                      <option value="">-- SELECT TECHNICIAN --</option>
                      {systemUsers.filter(u => u.active !== false).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={S.label}>START TIME</div>
                    <input type="datetime-local" value={historyForm.start_time} onChange={e => setHistoryForm(f => ({ ...f, start_time: e.target.value }))} style={{ width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={S.label}>END TIME</div>
                    <input type="datetime-local" value={historyForm.end_time} onChange={e => setHistoryForm(f => ({ ...f, end_time: e.target.value }))} style={{ width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={S.label}>DESCRIPTION *</div>
                    <textarea value={historyForm.description} onChange={e => setHistoryForm(f => ({ ...f, description: e.target.value }))} placeholder="Work performed..." rows={3} style={{ width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleAddHistory} disabled={!historyForm.technician || !historyForm.description} style={{ padding: '6px 14px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid hsl(140,55%,30%)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: 'pointer' }}>
                    SAVE ENTRY
                  </button>
                  <button onClick={() => setShowHistoryForm(false)} style={{ padding: '6px 14px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,25%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", cursor: 'pointer' }}>
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {busHistory.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,55%)', fontSize: '11px', background: 'white' }}>NO MANUAL LOG ENTRIES</div>
            ) : (
              <div style={{ overflowX: 'auto', background: 'white' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
                  <thead>
                    <tr>
                      {['DATE', 'TECHNICIAN', 'START', 'END', 'ELAPSED', 'DESCRIPTION'].map((h, i) => (
                        <th key={i} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {busHistory.map((h, i) => (
                      <tr key={h.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,20%,97%)' }}>
                        <td style={S.td}>{new Date(h.created_date).toLocaleDateString()}</td>
                        <td style={S.td}>{h.technician}</td>
                        <td style={S.td}>{h.start_time ? new Date(h.start_time).toLocaleString() : '—'}</td>
                        <td style={S.td}>{h.end_time ? new Date(h.end_time).toLocaleString() : '—'}</td>
                        <td style={S.td}>{h.elapsed_minutes ? `${h.elapsed_minutes} min` : '—'}</td>
                        <td style={{ ...S.td, maxWidth: '300px' }}>{h.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes & Legacy */}
          {(bus.notes || bus.legacy_upload) && (
            <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
              <SectionHeader title="NOTES & LEGACY DATA" icon={FileText} color="hsl(220,20%,35%)" />
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'white' }}>
                {bus.notes && (
                  <div>
                    <div style={S.label}>NOTES</div>
                    <div style={{ fontSize: '11px', color: 'hsl(220,20%,20%)', whiteSpace: 'pre-wrap', background: 'hsl(220,18%,97%)', padding: '8px', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px' }}>{bus.notes}</div>
                  </div>
                )}
                {bus.legacy_upload && (
                  <div>
                    <div style={S.label}>LEGACY UPLOAD DATA</div>
                    <div style={{ fontSize: '10px', color: 'hsl(220,10%,35%)', whiteSpace: 'pre-wrap', background: 'hsl(50,20%,97%)', padding: '8px', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', maxHeight: '200px', overflowY: 'auto', fontFamily: 'monospace' }}>{bus.legacy_upload}</div>
                    <button onClick={handleExport} disabled={isExporting} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'hsl(30,70%,45%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: 'pointer' }}>
                      <Download style={{ width: 13, height: 13 }} /> EXPORT LEGACY DATA TO PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}