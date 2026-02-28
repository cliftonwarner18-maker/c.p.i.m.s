import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, Plus, Search, Edit2, Trash2, ArrowRightLeft, AlertTriangle, FileText } from 'lucide-react';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };
const rowStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' };
const fieldStyle = { flex: '1', minWidth: '160px' };

const EMPTY_DRIVE = { make: '', model: '', serial_number: '', current_user: '', current_lot: '', current_sublocation: '', seized: false, seizing_agency: '', seizing_person: '', seizure_case_number: '', seizure_date: '', seizure_reason: '', seizure_notes: '' };
const EMPTY_CUSTODY = { hdrive_serial: '', transferred_from: '', transferred_to: '', previous_location: '', new_lot: '', new_sublocation: '', reason: '', transfer_date: '' };
const LOTS = ['Main', 'North', 'Central', 'Other'];

function SectionHeader({ title }) {
  return (
    <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '10px', marginTop: '4px', borderRadius: '2px' }}>
      {title}
    </div>
  );
}

function Btn({ onClick, children, color = 'hsl(220,55%,38%)', style = {} }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: color, color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer', ...style }}>
      {children}
    </button>
  );
}

export default function HdriveManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [form, setForm] = useState(EMPTY_DRIVE);
  const [showCustody, setShowCustody] = useState(false);
  const [custodyForm, setCustodyForm] = useState(EMPTY_CUSTODY);
  const [custodyDrive, setCustodyDrive] = useState(null);
  const [showLogs, setShowLogs] = useState(null); // serial number to show logs for
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tab, setTab] = useState('drives'); // 'drives' | 'seized'

  const { data: drives = [], isLoading } = useQuery({
    queryKey: ['hdrives'],
    queryFn: () => base44.entities.HDrive.list('serial_number'),
  });

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });
  const activeUsers = systemUsers.filter(u => u.active !== false);

  const { data: custodyLogs = [] } = useQuery({
    queryKey: ['custodyLogs'],
    queryFn: () => base44.entities.CustodyLog.list('-transfer_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HDrive.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setShowForm(false); setForm(EMPTY_DRIVE); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HDrive.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setShowForm(false); setEditDrive(null); setForm(EMPTY_DRIVE); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HDrive.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setDeleteTarget(null); },
  });

  const custodyMutation = useMutation({
    mutationFn: async ({ driveId, logData, driveUpdates }) => {
      await base44.entities.CustodyLog.create({ ...logData, transfer_date: new Date().toISOString() });
      await base44.entities.HDrive.update(driveId, driveUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hdrives'] });
      queryClient.invalidateQueries({ queryKey: ['custodyLogs'] });
      setShowCustody(false);
      setCustodyDrive(null);
      setCustodyForm(EMPTY_CUSTODY);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const combined = [form.current_lot, form.current_sublocation].filter(Boolean).join(' — ');
    const data = { ...form, current_location: combined };
    if (editDrive) updateMutation.mutate({ id: editDrive.id, data });
    else createMutation.mutate(data);
  };

  const openEdit = (drive) => {
    setEditDrive(drive);
    // Try to split stored location back into lot/sublocation
    const parts = (drive.current_location || '').split(' — ');
    const lot = LOTS.includes(parts[0]) ? parts[0] : '';
    const sub = lot ? parts.slice(1).join(' — ') : (drive.current_location || '');
    setForm({ ...drive, current_lot: lot, current_sublocation: sub });
    setShowForm(true);
  };

  const openCustody = (drive) => {
    setCustodyDrive(drive);
    setCustodyForm({ ...EMPTY_CUSTODY, hdrive_serial: drive.serial_number, previous_location: drive.current_location || '', transferred_from: drive.current_user || '', new_lot: '', new_sublocation: '' });
    setShowCustody(true);
  };

  const handleCustodySubmit = (e) => {
    e.preventDefault();
    const newLocation = [custodyForm.new_lot, custodyForm.new_sublocation].filter(Boolean).join(' — ');
    custodyMutation.mutate({
      driveId: custodyDrive.id,
      logData: { ...custodyForm, new_location: newLocation },
      driveUpdates: { current_user: custodyForm.transferred_to, current_location: newLocation },
    });
  };

  const filtered = drives.filter(d => {
    const q = search.toLowerCase();
    return !q || d.serial_number?.toLowerCase().includes(q) || d.make?.toLowerCase().includes(q) || d.model?.toLowerCase().includes(q) || d.current_user?.toLowerCase().includes(q);
  });

  const displayDrives = tab === 'seized' ? filtered.filter(d => d.seized) : filtered.filter(d => !d.seized);
  const seizedCount = drives.filter(d => d.seized).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>H-DRIVE MANAGEMENT</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>CHAIN OF CUSTODY &amp; SEIZURE TRACKING — {drives.length} DRIVES ON RECORD</div>
          </div>
        </div>
        <Btn onClick={() => { setEditDrive(null); setForm(EMPTY_DRIVE); setShowForm(true); }} style={{ background: 'hsl(140,55%,38%)' }}>
          <Plus style={{ width: 12, height: 12 }} /> ADD DRIVE
        </Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL DRIVES', value: drives.length, color: 'hsl(220,55%,40%)' },
          { label: 'ACTIVE', value: drives.filter(d => !d.seized).length, color: 'hsl(140,55%,35%)' },
          { label: 'SEIZED', value: seizedCount, color: 'hsl(0,65%,45%)' },
          { label: 'CUSTODY LOGS', value: custodyLogs.length, color: 'hsl(220,30%,45%)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 14px', minWidth: '120px', flex: '1' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: s.color, fontFamily: "'VT323', monospace" }}>{s.value}</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.07em', color: 'hsl(220,10%,50%)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px' }}>
          <SectionHeader title={editDrive ? `EDIT DRIVE — ${editDrive.serial_number}` : 'ADD NEW H-DRIVE'} />
          <form onSubmit={handleSubmit}>
            <div style={rowStyle}>
              <div style={fieldStyle}><label style={labelStyle}>MAKE *</label><input required value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} style={inputStyle} placeholder="e.g. SEON, Safety Vision" /></div>
              <div style={fieldStyle}><label style={labelStyle}>MODEL *</label><input required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} style={inputStyle} /></div>
              <div style={fieldStyle}><label style={labelStyle}>SERIAL NUMBER *</label><input required value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>CURRENT USER</label>
                <select value={form.current_user} onChange={e => setForm({ ...form, current_user: e.target.value })} style={inputStyle}>
                  <option value="">— Select User —</option>
                  {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` — ${u.role}` : ''}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>LOT (GENERAL LOCATION)</label>
                <select value={form.current_lot || ''} onChange={e => setForm({ ...form, current_lot: e.target.value })} style={inputStyle}>
                  <option value="">— Select Lot —</option>
                  {LOTS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>SUB LOCATION (PINPOINTED)</label>
                <input value={form.current_sublocation || ''} onChange={e => setForm({ ...form, current_sublocation: e.target.value })} style={inputStyle} placeholder="e.g. Officer drawer left side locked" />
              </div>
            </div>

            {/* Seizure */}
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="seized" checked={!!form.seized} onChange={e => setForm({ ...form, seized: e.target.checked })} style={{ width: 14, height: 14 }} />
              <label htmlFor="seized" style={{ ...labelStyle, marginBottom: 0, color: 'hsl(0,65%,40%)', cursor: 'pointer' }}>MARK AS SEIZED</label>
            </div>
            {form.seized && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '2px', padding: '10px', marginBottom: '10px' }}>
                <div style={rowStyle}>
                  <div style={fieldStyle}><label style={labelStyle}>SEIZING AGENCY</label><input value={form.seizing_agency} onChange={e => setForm({ ...form, seizing_agency: e.target.value })} style={inputStyle} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>SEIZING PERSON</label><input value={form.seizing_person} onChange={e => setForm({ ...form, seizing_person: e.target.value })} style={inputStyle} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>CASE NUMBER</label><input value={form.seizure_case_number} onChange={e => setForm({ ...form, seizure_case_number: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={rowStyle}>
                  <div style={fieldStyle}><label style={labelStyle}>SEIZURE DATE</label><input type="datetime-local" value={form.seizure_date ? moment(form.seizure_date).format('YYYY-MM-DDTHH:mm') : ''} onChange={e => setForm({ ...form, seizure_date: e.target.value ? new Date(e.target.value).toISOString() : '' })} style={inputStyle} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>REASON</label><input value={form.seizure_reason} onChange={e => setForm({ ...form, seizure_reason: e.target.value })} style={inputStyle} placeholder="e.g. Title 9, Crash, Investigation" /></div>
                </div>
                <div><label style={labelStyle}>SEIZURE NOTES</label><textarea value={form.seizure_notes} onChange={e => setForm({ ...form, seizure_notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid hsl(220,18%,85%)' }}>
              <button type="button" onClick={() => { setShowForm(false); setEditDrive(null); }} style={{ padding: '7px 14px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>CANCEL</button>
              <Btn onClick={null} style={{ padding: '7px 18px', background: 'hsl(140,55%,38%)' }}>
                {(createMutation.isPending || updateMutation.isPending) ? 'SAVING...' : editDrive ? 'SAVE CHANGES' : 'ADD DRIVE'}
              </Btn>
            </div>
          </form>
        </div>
      )}

      {/* Custody Transfer Form */}
      {showCustody && custodyDrive && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px' }}>
          <SectionHeader title={`CUSTODY TRANSFER — ${custodyDrive.serial_number}`} />
          <form onSubmit={handleCustodySubmit}>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>TRANSFERRED FROM *</label>
                <select required value={custodyForm.transferred_from} onChange={e => setCustodyForm({ ...custodyForm, transferred_from: e.target.value })} style={inputStyle}>
                  <option value="">— Select User —</option>
                  {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` — ${u.role}` : ''}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>TRANSFERRED TO *</label>
                <select required value={custodyForm.transferred_to} onChange={e => setCustodyForm({ ...custodyForm, transferred_to: e.target.value })} style={inputStyle}>
                  <option value="">— Select User —</option>
                  {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` — ${u.role}` : ''}</option>)}
                </select>
              </div>
            </div>
            <div style={rowStyle}>
              <div style={fieldStyle}><label style={labelStyle}>PREVIOUS LOCATION</label><input readOnly value={custodyForm.previous_location} style={{ ...inputStyle, background: 'hsl(220,15%,96%)', color: 'hsl(220,10%,50%)' }} /></div>
              <div style={fieldStyle}>
                <label style={labelStyle}>NEW LOT *</label>
                <select required value={custodyForm.new_lot || ''} onChange={e => setCustodyForm({ ...custodyForm, new_lot: e.target.value })} style={inputStyle}>
                  <option value="">— Select Lot —</option>
                  {LOTS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>NEW SUB LOCATION *</label>
                <input required value={custodyForm.new_sublocation || ''} onChange={e => setCustodyForm({ ...custodyForm, new_sublocation: e.target.value })} style={inputStyle} placeholder="e.g. Officer drawer left side locked" />
              </div>
            </div>
            <div><label style={labelStyle}>REASON FOR TRANSFER</label><textarea value={custodyForm.reason} onChange={e => setCustodyForm({ ...custodyForm, reason: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px' }} /></div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid hsl(220,18%,85%)' }}>
              <button type="button" onClick={() => { setShowCustody(false); setCustodyDrive(null); }} style={{ padding: '7px 14px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>CANCEL</button>
              <Btn style={{ padding: '7px 18px' }}>{custodyMutation.isPending ? 'SAVING...' : 'LOG TRANSFER'}</Btn>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '2px', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#991b1b', fontWeight: '700' }}><AlertTriangle style={{ width: 13, height: 13, display: 'inline', marginRight: 5 }} />DELETE {deleteTarget.serial_number}? This is permanent.</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Btn onClick={() => deleteMutation.mutate(deleteTarget.id)} color="hsl(0,65%,45%)">{deleteMutation.isPending ? 'DELETING...' : 'CONFIRM DELETE'}</Btn>
            <button onClick={() => setDeleteTarget(null)} style={{ padding: '5px 12px', background: 'hsl(220,18%,88%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>CANCEL</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'hsl(220,18%,90%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '4px' }}>
        {[['drives', 'ALL DRIVES'], ['seized', `SEIZED (${seizedCount})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '5px 14px', fontSize: '11px', fontFamily: FF, fontWeight: '700', border: 'none', borderRadius: '2px', cursor: 'pointer', background: tab === key ? 'hsl(220,55%,38%)' : 'transparent', color: tab === key ? 'white' : 'hsl(220,20%,30%)', letterSpacing: '0.05em' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Search style={{ width: 14, height: 14, color: 'hsl(220,10%,50%)', flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by serial, make, model, user..." style={{ ...inputStyle, maxWidth: '360px' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '11px', color: 'hsl(220,10%,50%)', fontFamily: FF }}>LOADING...</div>
        ) : displayDrives.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '11px', color: 'hsl(220,10%,50%)', fontFamily: FF }}>NO DRIVES FOUND</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: FF }}>
            <thead>
              <tr style={{ background: 'hsl(220,18%,94%)', borderBottom: '2px solid hsl(220,18%,75%)' }}>
                {['SERIAL NUMBER', 'MAKE', 'MODEL', 'CURRENT USER', 'CURRENT LOCATION', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.07em', color: 'hsl(220,20%,30%)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayDrives.map((drive, i) => (
                <tr key={drive.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,12%,98%)', borderBottom: '1px solid hsl(220,18%,88%)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: '700' }}>{drive.serial_number}</td>
                  <td style={{ padding: '6px 8px' }}>{drive.make}</td>
                  <td style={{ padding: '6px 8px' }}>{drive.model}</td>
                  <td style={{ padding: '6px 8px' }}>{drive.current_user || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>{drive.current_location || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{ background: drive.seized ? '#fef2f2' : '#f0fdf4', color: drive.seized ? '#991b1b' : '#166534', border: `1px solid ${drive.seized ? '#fecaca' : '#bbf7d0'}`, borderRadius: '2px', padding: '2px 7px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {drive.seized ? 'SEIZED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                      <button title="Transfer Custody" onClick={() => openCustody(drive)} style={{ padding: '3px 7px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontFamily: FF }}>
                        <ArrowRightLeft style={{ width: 11, height: 11 }} />
                      </button>
                      <button title="View Logs" onClick={() => setShowLogs(showLogs === drive.serial_number ? null : drive.serial_number)} style={{ padding: '3px 7px', background: 'hsl(45,70%,45%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontFamily: FF, fontWeight: '700' }}>
                        LOG
                      </button>
                      <button title="Edit" onClick={() => openEdit(drive)} style={{ padding: '3px 7px', background: 'hsl(220,18%,82%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,65%)', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontFamily: FF }}>
                        <Edit2 style={{ width: 11, height: 11 }} />
                      </button>
                      <button title="Delete" onClick={() => setDeleteTarget(drive)} style={{ padding: '3px 7px', background: 'hsl(0,65%,45%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontFamily: FF }}>
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Custody Logs inline */}
      {showLogs && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '12px' }}>
          <SectionHeader title={`CUSTODY LOG — ${showLogs}`} />
          {custodyLogs.filter(l => l.hdrive_serial === showLogs).length === 0 ? (
            <div style={{ fontSize: '11px', color: 'hsl(220,10%,50%)', padding: '8px 0' }}>No custody logs found for this drive.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: FF }}>
              <thead>
                <tr style={{ background: 'hsl(220,18%,94%)', borderBottom: '1px solid hsl(220,18%,75%)' }}>
                  {['DATE/TIME', 'FROM', 'TO', 'PREV LOCATION', 'NEW LOCATION', 'REASON'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', color: 'hsl(220,20%,30%)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {custodyLogs.filter(l => l.hdrive_serial === showLogs).map((log, i) => (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,12%,98%)', borderBottom: '1px solid hsl(220,18%,88%)' }}>
                    <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{log.transfer_date ? moment(log.transfer_date).format('MM/DD/YYYY HH:mm') : '—'}</td>
                    <td style={{ padding: '5px 8px' }}>{log.transferred_from}</td>
                    <td style={{ padding: '5px 8px' }}>{log.transferred_to}</td>
                    <td style={{ padding: '5px 8px' }}>{log.previous_location || '—'}</td>
                    <td style={{ padding: '5px 8px' }}>{log.new_location}</td>
                    <td style={{ padding: '5px 8px' }}>{log.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ fontSize: '10px', color: 'hsl(220,10%,55%)', fontFamily: FF, paddingBottom: '4px' }}>
        SHOWING {displayDrives.length} OF {drives.length} DRIVES
      </div>
    </div>
  );
}