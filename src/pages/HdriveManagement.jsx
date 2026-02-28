import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Plus, ArrowRight, Trash2, Search, Upload, FileDown, Pencil, HardDrive } from 'lucide-react';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };
const sectionHdr = { background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '8px' };
const FLEET_LOCATIONS = ['Main', 'North', 'Central'];

function UserDropdown({ value, onChange, placeholder = 'Select user...', style = {} }) {
  const { data: systemUsers = [] } = useQuery({ queryKey: ['systemUsers'], queryFn: () => base44.entities.SystemUser.list('name') });
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, ...style }}>
      <option value="">{placeholder}</option>
      {systemUsers.filter(u => u.active !== false).map(u => (
        <option key={u.id} value={u.name}>{u.name}{u.role ? ` (${u.role})` : ''}</option>
      ))}
    </select>
  );
}

function LocationFields({ fleetKey, subKey, values, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 auto' }}>
        <label style={labelStyle}>FLEET LOCATION:</label>
        <select style={{ ...inputStyle, width: 140 }} value={values[fleetKey]} onChange={e => onChange({ [fleetKey]: e.target.value })}>
          <option value="">-- Select --</option>
          {FLEET_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
      <div style={{ flex: '1 1 140px' }}>
        <label style={labelStyle}>SUB-LOCATION:</label>
        <input style={{ ...inputStyle, width: '100%' }} placeholder="e.g., Desk drawer, Filing cabinet" value={values[subKey]} onChange={e => onChange({ [subKey]: e.target.value })} />
      </div>
    </div>
  );
}

function DriveForm({ title, data, setData, onSave, onCancel, saving }) {
  return (
    <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', marginBottom: '8px' }}>
      <div style={sectionHdr}>{title}</div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[['MAKE', 'make'], ['MODEL', 'model'], ['SERIAL NUMBER', 'serial_number']].map(([label, field]) => (
          <div key={field}>
            <label style={labelStyle}>{label}:</label>
            <input style={{ ...inputStyle, width: '100%' }} value={data[field]} onChange={e => setData({ ...data, [field]: e.target.value })} />
          </div>
        ))}
        <div>
          <label style={labelStyle}>LOCATION:</label>
          <LocationFields fleetKey="fleet_location" subKey="sub_location" values={data} onChange={v => setData({ ...data, ...v })} />
        </div>
        <div>
          <label style={labelStyle}>CURRENT USER:</label>
          <UserDropdown value={data.current_user} onChange={v => setData({ ...data, current_user: v })} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onSave} disabled={saving} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '7px', background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>SAVE</button>
          <button onClick={onCancel} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '7px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

export default function HdriveManagement() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [editData, setEditData] = useState({ make: '', model: '', serial_number: '', fleet_location: '', sub_location: '', current_user: '', seized: false, seizing_agency: '', seizing_person: '', seizure_case_number: '', seizure_date: '', seizure_reason: '', seizure_notes: '' });
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [seizedFilter, setSeizedFilter] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isExportingList, setIsExportingList] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [formData, setFormData] = useState({ make: '', model: '', serial_number: '', fleet_location: '', sub_location: '', current_user: '' });
  const [transferData, setTransferData] = useState({ transferred_to: '', fleet_location: '', sub_location: '', reason: '' });
  const [bulkText, setBulkText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('');
  const [auditLocationFilter, setAuditLocationFilter] = useState('');
  const [auditSiezedOnly, setAuditSeizedOnly] = useState(false);

  const { data: drives = [], isLoading } = useQuery({ queryKey: ['hdrives'], queryFn: () => base44.entities.HDrive.list('-created_date') });
  const { data: custody = [] } = useQuery({ queryKey: ['custody'], queryFn: () => base44.entities.CustodyLog.list('-transfer_date') });

  const buildLocation = (fleet, sub) => [fleet, sub].filter(Boolean).join(' — ');

  const createDriveMutation = useMutation({
    mutationFn: (data) => base44.entities.HDrive.create({ ...data, current_location: buildLocation(data.fleet_location, data.sub_location) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setFormData({ make: '', model: '', serial_number: '', fleet_location: '', sub_location: '', current_user: '' }); setShowAddForm(false); },
  });

  const transferMutation = useMutation({
    mutationFn: async (data) => {
      const custodyEntry = { hdrive_serial: selectedDrive.serial_number, transferred_from: selectedDrive.current_user || 'Unknown', transferred_to: data.transferred_to, previous_location: selectedDrive.current_location || 'Unknown', new_location: buildLocation(data.fleet_location, data.sub_location), reason: data.reason, transfer_date: new Date().toISOString() };
      await base44.entities.CustodyLog.create(custodyEntry);
      await base44.entities.HDrive.update(selectedDrive.id, { current_user: data.transferred_to, current_location: buildLocation(data.fleet_location, data.sub_location) });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); queryClient.invalidateQueries({ queryKey: ['custody'] }); setShowTransferForm(false); setSelectedDrive(null); setTransferData({ transferred_to: '', fleet_location: '', sub_location: '', reason: '' }); },
  });

  const updateDriveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HDrive.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setShowEditForm(false); setEditDrive(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HDrive.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hdrives'] }),
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (drivesData) => (await base44.functions.invoke('bulkImportHDrives', { drives: drivesData })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setBulkText(''); setShowBulkImport(false); },
  });

  const handleCleanupDuplicates = async () => {
    if (!window.confirm('Delete duplicate H-drives (keeping most detailed records)?\n\nThis cannot be undone.')) return;
    setIsCleaningUp(true);
    const response = await base44.functions.invoke('cleanupDuplicates', { entityName: 'HDrive' });
    queryClient.invalidateQueries({ queryKey: ['hdrives'] });
    alert(`Cleanup complete!\n${response.data.message}`);
    setIsCleaningUp(false);
  };

  const filtered = drives.filter(d => {
    const matchSearch = !search || d.serial_number?.toLowerCase().includes(search.toLowerCase()) || d.model?.toLowerCase().includes(search.toLowerCase()) || d.make?.toLowerCase().includes(search.toLowerCase()) || d.current_location?.toLowerCase().includes(search.toLowerCase());
    const matchUser = !userFilter || d.current_user === userFilter;
    const matchLocation = !locationFilter || d.current_location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchSeized = !seizedFilter || !!d.seized;
    return matchSearch && matchUser && matchLocation && matchSeized;
  });

  const serialCounts = drives.reduce((acc, d) => { const key = d.serial_number?.trim().toLowerCase(); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const isDuplicate = (d) => serialCounts[d.serial_number?.trim().toLowerCase()] > 1;

  const handleBulkImport = () => {
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const drivesToImport = lines.map(line => { const parts = line.split('\t').map(p => p.trim()); return { make: parts[0], model: parts[1], serial_number: parts[2] }; });
    if (drivesToImport.length > 0) bulkImportMutation.mutate(drivesToImport);
  };

  const handleExportList = async () => {
    setIsExportingList(true);
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    doc.setFillColor(30, 60, 120); doc.rect(0, 0, pageW, 36, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont('courier', 'bold');
    doc.text('NEW HANOVER COUNTY SCHOOLS — TRANSPORTATION DEPT.', pageW / 2, 14, { align: 'center' });
    doc.setFontSize(10); doc.text('H-DRIVE INVENTORY LIST', pageW / 2, 27, { align: 'center' });
    doc.setTextColor(0, 0, 0); doc.setFontSize(8); doc.setFont('courier', 'normal');
    doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}   Total: ${filtered.length}`, 20, 50);
    const cols = [{ label: '#', x: 20, w: 20 }, { label: 'SERIAL NUMBER', x: 40, w: 120 }, { label: 'MAKE', x: 160, w: 80 }, { label: 'MODEL', x: 240, w: 110 }, { label: 'CURRENT USER', x: 350, w: 120 }, { label: 'LOCATION', x: 470, w: 200 }, { label: 'SEIZED', x: 670, w: 50 }];
    let y = 62;
    doc.setFillColor(30, 60, 120); doc.rect(20, y, pageW - 40, 14, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('courier', 'bold');
    cols.forEach(c => doc.text(c.label, c.x + 2, y + 10)); y += 14;
    doc.setFont('courier', 'normal');
    filtered.forEach((d, i) => {
      if (y > 540) { doc.addPage(); y = 20; }
      const bg = d.seized ? [255, 230, 180] : i % 2 === 0 ? [245, 247, 252] : [255, 255, 255];
      doc.setFillColor(...bg); doc.rect(20, y, pageW - 40, 12, 'F');
      doc.setTextColor(0, 0, 0); doc.setFontSize(7.5);
      const clean = s => (s || '-').replace(/[^\x00-\x7F]/g, '');
      doc.text(String(i + 1), cols[0].x + 2, y + 9); doc.text(clean(d.serial_number).substring(0, 20), cols[1].x + 2, y + 9);
      doc.text(clean(d.make).substring(0, 12), cols[2].x + 2, y + 9); doc.text(clean(d.model).substring(0, 16), cols[3].x + 2, y + 9);
      doc.text(clean(d.current_user).substring(0, 18), cols[4].x + 2, y + 9); doc.text(clean(d.current_location).substring(0, 30), cols[5].x + 2, y + 9);
      if (d.seized) { doc.setTextColor(180, 0, 0); doc.text('YES', cols[6].x + 2, y + 9); doc.setTextColor(0, 0, 0); }
      y += 12;
    });
    doc.save(`hdrive-inventory-${now.toISOString().slice(0, 10)}.pdf`);
    setIsExportingList(false);
  };

  const handleExportAudit = async () => {
    setIsExporting(true);
    const response = await base44.functions.invoke('exportHDriveAudit', { search: auditSearch, userFilter: auditUserFilter, locationFilter: auditLocationFilter, seizedOnly: auditSiezedOnly });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hdrive-audit-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    setIsExporting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      <LoadingScreen isLoading={isLoading} message="LOADING H-DRIVE INVENTORY..." />
      <DeleteConfirmModal isOpen={!!deleteTarget} label={deleteTarget ? `H-Drive S/N: ${deleteTarget.serial_number}` : ''} onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <HardDrive style={{ width: 18, height: 18 }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>H-DRIVE MANAGEMENT</div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>CHAIN OF CUSTODY TRACKING — {drives.length} TOTAL DRIVES</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <DriveForm title="💾 ADD NEW H-DRIVE" data={formData} setData={setFormData}
          onSave={() => createDriveMutation.mutate(formData)} onCancel={() => setShowAddForm(false)} saving={createDriveMutation.isPending} />
      )}

      {/* Edit Form */}
      {showEditForm && editDrive && (
        <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', marginBottom: '4px' }}>
          <div style={sectionHdr}>✏️ EDIT H-DRIVE — {editDrive.serial_number}</div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[['MAKE', 'make'], ['MODEL', 'model'], ['SERIAL NUMBER', 'serial_number']].map(([label, field]) => (
              <div key={field}>
                <label style={labelStyle}>{label}:</label>
                <input style={{ ...inputStyle, width: '100%' }} value={editData[field]} onChange={e => setEditData({ ...editData, [field]: e.target.value })} />
              </div>
            ))}
            <div><label style={labelStyle}>LOCATION:</label><LocationFields fleetKey="fleet_location" subKey="sub_location" values={editData} onChange={v => setEditData({ ...editData, ...v })} /></div>
            <div><label style={labelStyle}>CURRENT USER:</label><UserDropdown value={editData.current_user} onChange={v => setEditData({ ...editData, current_user: v })} style={{ width: '100%' }} /></div>

            {/* Seized */}
            <div style={{ border: `2px solid ${editData.seized ? 'hsl(0,65%,40%)' : 'hsl(220,18%,75%)'}`, padding: '8px', background: editData.seized ? 'hsl(0,80%,97%)' : 'transparent', borderRadius: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: editData.seized ? '8px' : 0 }}>
                <input type="checkbox" checked={!!editData.seized} onChange={e => { if (!e.target.checked) setEditData({ ...editData, seized: false, seizing_agency: '', seizing_person: '', seizure_case_number: '', seizure_date: '', seizure_reason: '', seizure_notes: '' }); else setEditData({ ...editData, seized: true }); }} />
                <span style={{ fontSize: '11px', fontWeight: '700', color: editData.seized ? 'hsl(0,65%,40%)' : 'inherit' }}>⚠️ DRIVE SEIZED / UNDER LEGAL HOLD</span>
              </div>
              {editData.seized && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[['SEIZING AGENCY:', 'seizing_agency', 'e.g., NHCSO, NHCPD'], ['SEIZING PERSON:', 'seizing_person', 'e.g., Det. John Smith'], ['CASE #:', 'seizure_case_number', 'e.g., 2024-CR-1234']].map(([label, field, ph]) => (
                      <div key={field} style={{ flex: '1 1 140px' }}>
                        <label style={labelStyle}>{label}</label>
                        <input style={{ ...inputStyle, width: '100%' }} value={editData[field]} onChange={e => setEditData({ ...editData, [field]: e.target.value })} placeholder={ph} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 160px' }}>
                      <label style={labelStyle}>DATE/TIME OF SEIZURE:</label>
                      <input type="datetime-local" style={{ ...inputStyle, width: '100%' }} value={editData.seizure_date} onChange={e => setEditData({ ...editData, seizure_date: e.target.value })} />
                    </div>
                    <div style={{ flex: '1 1 160px' }}>
                      <label style={labelStyle}>SEIZURE REASON:</label>
                      <select style={{ ...inputStyle, width: '100%' }} value={editData.seizure_reason} onChange={e => setEditData({ ...editData, seizure_reason: e.target.value })}>
                        <option value="">-- Select --</option>
                        {['Title 9 Investigation', 'Crash Investigation', 'Criminal Investigation', 'Civil Litigation', 'Internal Affairs', 'Child Welfare Investigation', 'Law Enforcement Request', 'Court Order', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>SEIZURE NOTES:</label>
                    <textarea rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} value={editData.seizure_notes} onChange={e => setEditData({ ...editData, seizure_notes: e.target.value })} placeholder="Additional details, badge numbers, receipt #, etc." />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => { const saveData = { ...editData, current_location: buildLocation(editData.fleet_location, editData.sub_location) }; if (!saveData.seized) { saveData.seizing_agency = ''; saveData.seizing_person = ''; saveData.seizure_case_number = ''; saveData.seizure_date = ''; saveData.seizure_reason = ''; saveData.seizure_notes = ''; } updateDriveMutation.mutate({ id: editDrive.id, data: saveData }); }}
                style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '7px', background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>SAVE</button>
              <button onClick={() => { setShowEditForm(false); setEditDrive(null); }} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '7px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {showBulkImport && (
        <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', marginBottom: '4px' }}>
          <div style={sectionHdr}>📋 BULK IMPORT H-DRIVES</div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '10px', color: 'hsl(220,10%,45%)' }}>Paste tab-separated data (MAKE, MODEL#, SERIAL#) with one drive per line:</div>
            <textarea rows={10} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"SEON\tTL-H320G\tE0504639\nSEON\tTL-H320G\tE0505655"} style={{ ...inputStyle, width: '100%', resize: 'vertical', height: 160 }} />
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleBulkImport} disabled={bulkImportMutation.isPending} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '7px', background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>
                IMPORT {bulkImportMutation.isPending ? '...' : ''}
              </button>
              <button onClick={() => setShowBulkImport(false)} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '7px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Form */}
      {showTransferForm && selectedDrive && (
        <div style={{ background: 'hsl(220,18%,94%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', marginBottom: '4px' }}>
          <div style={sectionHdr}>🔄 TRANSFER H-DRIVE — {selectedDrive.serial_number}</div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700' }}>FROM: {selectedDrive.current_user || 'Unassigned'} → {selectedDrive.current_location || 'Unknown'}</div>
            <div><label style={labelStyle}>TRANSFER TO (USER):</label><UserDropdown value={transferData.transferred_to} onChange={v => setTransferData({ ...transferData, transferred_to: v })} style={{ width: '100%' }} /></div>
            <div><label style={labelStyle}>NEW LOCATION:</label><LocationFields fleetKey="fleet_location" subKey="sub_location" values={transferData} onChange={v => setTransferData({ ...transferData, ...v })} /></div>
            <div><label style={labelStyle}>REASON FOR TRANSFER:</label><textarea rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} value={transferData.reason} onChange={e => setTransferData({ ...transferData, reason: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => transferMutation.mutate(transferData)} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '7px', background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>TRANSFER</button>
              <button onClick={() => { setShowTransferForm(false); setSelectedDrive(null); setTransferData({ transferred_to: '', fleet_location: '', sub_location: '', reason: '' }); }} style={{ ...btnBase, flex: 1, justifyContent: 'center', padding: '7px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Export Panel */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ ...sectionHdr, margin: 0 }}>📋 EXPORT AUDIT REPORT — PDF</div>
        <div style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' }}>
          <div><label style={labelStyle}>SEARCH (serial / make / model):</label><input style={{ ...inputStyle, width: 180 }} placeholder="e.g. SEON, E050..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} /></div>
          <div><label style={labelStyle}>FILTER BY USER:</label><UserDropdown value={auditUserFilter} onChange={setAuditUserFilter} placeholder="All users" style={{ width: 150 }} /></div>
          <div>
            <label style={labelStyle}>FILTER BY LOCATION:</label>
            <select style={{ ...inputStyle, width: 140 }} value={auditLocationFilter} onChange={e => setAuditLocationFilter(e.target.value)}>
              <option value="">All Locations</option>
              {FLEET_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" id="auditSeized" checked={!!auditSiezedOnly} onChange={e => setAuditSeizedOnly(e.target.checked)} />
            <label htmlFor="auditSeized" style={{ fontSize: '11px', fontWeight: '700', color: auditSiezedOnly ? 'hsl(0,65%,40%)' : 'inherit', whiteSpace: 'nowrap' }}>⚠️ SEIZED ONLY</label>
          </div>
          <button onClick={handleExportAudit} disabled={isExporting} style={{ ...btnBase, background: 'hsl(0,65%,42%)', color: 'white', borderColor: 'hsl(0,65%,35%)', padding: '7px 12px' }}>
            <FileDown style={{ width: 13, height: 13 }} /> {isExporting ? 'GENERATING...' : 'EXPORT AUDIT PDF'}
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ ...sectionHdr, margin: 0 }}>💾 H-DRIVE INVENTORY</div>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid hsl(220,18%,85%)', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <button onClick={() => setShowAddForm(true)} style={{ ...btnBase, background: 'hsl(220,55%,38%)', color: 'white', borderColor: 'hsl(220,55%,30%)' }}><Plus style={{ width: 12, height: 12 }} /> ADD H-DRIVE</button>
          <button onClick={() => setShowBulkImport(true)} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}><Upload style={{ width: 12, height: 12 }} /> BULK IMPORT</button>
          <button onClick={handleCleanupDuplicates} disabled={isCleaningUp} style={{ ...btnBase, background: 'hsl(0,65%,42%)', color: 'white', borderColor: 'hsl(0,65%,35%)' }}>🧹 {isCleaningUp ? 'CLEANING...' : 'CLEAN DUPLICATES'}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <Search style={{ width: 12, height: 12 }} />
            <input style={{ ...inputStyle, width: 160 }} placeholder="Search serial/make..." value={search} onChange={e => setSearch(e.target.value)} />
            <UserDropdown value={userFilter} onChange={setUserFilter} placeholder="Filter by user..." style={{ width: 140 }} />
            <select style={{ ...inputStyle, width: 130 }} value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
              <option value="">All Locations</option>
              {FLEET_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" id="seizedFilter" checked={seizedFilter} onChange={e => setSeizedFilter(e.target.checked)} />
              <label htmlFor="seizedFilter" style={{ fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap', color: seizedFilter ? 'hsl(0,65%,40%)' : 'inherit' }}>SEIZED</label>
            </div>
            <button onClick={handleExportList} disabled={isExportingList} style={{ ...btnBase, background: 'hsl(140,55%,35%)', color: 'white', borderColor: 'hsl(140,55%,28%)' }}>
              <FileDown style={{ width: 11, height: 11 }} /> {isExportingList ? 'EXPORTING...' : 'EXPORT LIST'}
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 560 }}>
          <table style={{ width: '100%', fontSize: '10px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0 }}>
                {['SERIAL #', 'MAKE/MODEL', 'CURRENT USER', 'LOCATION', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)' }}>NO H-DRIVES FOUND</td></tr>}
              {filtered.map((d, i) => {
                const dup = isDuplicate(d);
                return (
                  <tr key={d.id} style={{ background: dup ? 'hsl(0,80%,93%)' : i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)', outline: dup ? '2px solid hsl(0,65%,50%)' : 'none' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '700' }}>
                      {dup && <span style={{ background: 'hsl(0,65%,45%)', color: 'white', fontSize: '8px', padding: '0 3px', marginRight: 4, fontWeight: '700' }}>DUP</span>}
                      {d.seized && <span style={{ background: 'hsl(30,85%,42%)', color: 'white', fontSize: '8px', padding: '0 3px', marginRight: 4, fontWeight: '700' }}>⚠️SEIZED</span>}
                      {d.serial_number}
                    </td>
                    <td style={{ padding: '5px 8px' }}>{d.make} / {d.model}</td>
                    <td style={{ padding: '5px 8px' }}>{d.current_user || '—'}</td>
                    <td style={{ padding: '5px 8px', fontSize: '9px' }}>{d.current_location || '—'}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center', flexWrap: 'nowrap' }}>
                        <button onClick={() => { setSelectedDrive(d); setShowTransferForm(true); }} style={{ ...btnBase, background: 'hsl(220,55%,38%)', color: 'white', borderColor: 'hsl(220,55%,30%)' }}>
                          <ArrowRight style={{ width: 11, height: 11 }} /> TRANSFER
                        </button>
                        <button onClick={() => { const parts = (d.current_location || '').split(' — '); setEditDrive(d); setEditData({ make: d.make || '', model: d.model || '', serial_number: d.serial_number || '', fleet_location: parts[0] || '', sub_location: parts.slice(1).join(' — ') || '', current_user: d.current_user || '', seized: !!d.seized, seizing_agency: d.seizing_agency || '', seizing_person: d.seizing_person || '', seizure_case_number: d.seizure_case_number || '', seizure_date: d.seizure_date ? d.seizure_date.slice(0, 16) : '', seizure_reason: d.seizure_reason || '', seizure_notes: d.seizure_notes || '' }); setShowEditForm(true); }}
                          style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>
                          <Pencil style={{ width: 11, height: 11 }} /> EDIT
                        </button>
                        <button onClick={() => setDeleteTarget(d)} style={{ ...btnBase, background: 'hsl(0,65%,45%)', color: 'white', borderColor: 'hsl(0,65%,38%)', padding: '4px 6px' }}>
                          <Trash2 style={{ width: 11, height: 11 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '5px 10px', fontSize: '10px', color: 'hsl(220,10%,45%)', borderTop: '1px solid hsl(220,18%,90%)', background: 'hsl(220,18%,97%)' }}>
          TOTAL: {filtered.length} {search || userFilter || locationFilter || seizedFilter ? `(filtered from ${drives.length})` : ''}
        </div>
      </div>

      {/* Chain of Custody Log */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ ...sectionHdr, margin: 0 }}>📜 CHAIN OF CUSTODY LOG</div>
        <div style={{ overflowX: 'auto', maxHeight: 460 }}>
          {custody.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontSize: '11px' }}>NO CUSTODY TRANSFERS</div>
          ) : (
            <table style={{ width: '100%', fontSize: '9px', fontFamily: FF, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0 }}>
                  {['SERIAL #', 'FROM', 'TO', 'LOCATION', 'REASON', 'DATE/TIME'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '9px', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {custody.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                    <td style={{ padding: '4px 8px', fontWeight: '700' }}>{c.hdrive_serial}</td>
                    <td style={{ padding: '4px 8px' }}>{c.transferred_from || '—'}</td>
                    <td style={{ padding: '4px 8px' }}>{c.transferred_to || '—'}</td>
                    <td style={{ padding: '4px 8px', fontSize: '8px' }}>{c.previous_location || '—'} → {c.new_location || '—'}</td>
                    <td style={{ padding: '4px 8px', fontSize: '8px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.reason || '—'}</td>
                    <td style={{ padding: '4px 8px', fontSize: '8px', whiteSpace: 'nowrap' }}>{new Date(c.transfer_date).toLocaleDateString()} {new Date(c.transfer_date).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}