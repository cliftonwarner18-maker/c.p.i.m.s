import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import LoadingScreen from '../components/LoadingScreen';
import { Plus, ArrowRight, Trash2, Search, Upload } from 'lucide-react';

export default function HdriveManagement() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [formData, setFormData] = useState({ make: '', model: '', serial_number: '', current_location: '', current_user: '' });
  const [transferData, setTransferData] = useState({ transferred_to: '', new_location: '', reason: '' });
  const [bulkText, setBulkText] = useState('');

  const { data: drives = [], isLoading } = useQuery({
    queryKey: ['hdrives'],
    queryFn: () => base44.entities.HDrive.list('-created_date'),
  });

  const { data: custody = [] } = useQuery({
    queryKey: ['custody'],
    queryFn: () => base44.entities.CustodyLog.list('-transfer_date'),
  });

  const createDriveMutation = useMutation({
    mutationFn: (data) => base44.entities.HDrive.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hdrives'] });
      setFormData({ make: '', model: '', serial_number: '', current_location: '', current_user: '' });
      setShowAddForm(false);
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data) => {
      const custodyEntry = {
        hdrive_serial: selectedDrive.serial_number,
        transferred_from: selectedDrive.current_user || 'Unknown',
        transferred_to: data.transferred_to,
        previous_location: selectedDrive.current_location || 'Unknown',
        new_location: data.new_location,
        reason: data.reason,
        transfer_date: new Date().toISOString(),
      };
      
      await base44.entities.CustodyLog.create(custodyEntry);
      await base44.entities.HDrive.update(selectedDrive.id, {
        current_user: data.transferred_to,
        current_location: data.new_location,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hdrives'] });
      queryClient.invalidateQueries({ queryKey: ['custody'] });
      setShowTransferForm(false);
      setSelectedDrive(null);
      setTransferData({ transferred_to: '', new_location: '', reason: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HDrive.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hdrives'] }),
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (drivesData) => {
      const response = await base44.functions.invoke('bulkImportHDrives', { drives: drivesData });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hdrives'] });
      setBulkText('');
      setShowBulkImport(false);
    },
  });

  const filtered = drives.filter(d => 
    !search || 
    d.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
    d.model?.toLowerCase().includes(search.toLowerCase()) ||
    d.make?.toLowerCase().includes(search.toLowerCase())
  );

  const serialCounts = drives.reduce((acc, d) => {
    const key = d.serial_number?.trim().toLowerCase();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const isDuplicate = (d) => serialCounts[d.serial_number?.trim().toLowerCase()] > 1;

  const handleBulkImport = () => {
    const lines = bulkText.trim().split('\n').filter(l => l.trim());
    const drivesToImport = lines.map(line => {
      const parts = line.split('\t').map(p => p.trim());
      return {
        make: parts[0],
        model: parts[1],
        serial_number: parts[2],
      };
    });
    
    if (drivesToImport.length > 0) {
      bulkImportMutation.mutate(drivesToImport);
    }
  };

  const getDriveHistory = (serial) => custody.filter(c => c.hdrive_serial === serial);

  return (
    <>
      <LoadingScreen isLoading={isLoading} message="LOADING H-DRIVE INVENTORY..." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        
        {/* Add Drive Form */}
        {showAddForm && (
          <WinWindow title="ADD NEW H-DRIVE" icon="💾">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>MAKE:</label>
                <input className="win-input" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>MODEL:</label>
                <input className="win-input" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>SERIAL NUMBER:</label>
                <input className="win-input" value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>CURRENT LOCATION:</label>
                <input className="win-input" placeholder="e.g., Desk drawer locked" value={formData.current_location} onChange={(e) => setFormData({...formData, current_location: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>CURRENT USER:</label>
                <input className="win-input" value={formData.current_user} onChange={(e) => setFormData({...formData, current_user: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button className="win-button" style={{ flex: 1, background: 'hsl(220,70%,35%)', color: 'white' }} 
                  onClick={() => createDriveMutation.mutate(formData)}>
                  SAVE
                </button>
                <button className="win-button" style={{ flex: 1 }} onClick={() => setShowAddForm(false)}>CANCEL</button>
              </div>
            </div>
          </WinWindow>
        )}

        {/* Bulk Import Form */}
        {showBulkImport && (
          <WinWindow title="BULK IMPORT H-DRIVES" icon="📋">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', color: 'hsl(220,10%,40%)', marginBottom: '4px' }}>
                Paste tab-separated data (MAKE, MODEL#, SERIAL#) with one drive per line:
              </div>
              <textarea className="win-input" rows="10" value={bulkText} onChange={(e) => setBulkText(e.target.value)} 
                placeholder="SEON&#9;TL-H320G&#9;E0504639&#10;SEON&#9;TL-H320G&#9;E0505655" 
                style={{ fontFamily: "'Courier Prime', monospace", fontSize: '10px' }} />
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button className="win-button" style={{ flex: 1, background: 'hsl(220,70%,35%)', color: 'white' }} 
                  onClick={handleBulkImport} disabled={bulkImportMutation.isPending}>
                  IMPORT {bulkImportMutation.isPending ? '...' : ''}
                </button>
                <button className="win-button" style={{ flex: 1 }} onClick={() => setShowBulkImport(false)}>CANCEL</button>
              </div>
            </div>
          </WinWindow>
        )}

        {/* Transfer Form */}
        {showTransferForm && selectedDrive && (
          <WinWindow title={`TRANSFER H-DRIVE — ${selectedDrive.serial_number}`} icon="🔄">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                FROM: {selectedDrive.current_user || 'Unassigned'} → {selectedDrive.current_location || 'Unknown'}
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>TRANSFER TO (USER):</label>
                <input className="win-input" value={transferData.transferred_to} onChange={(e) => setTransferData({...transferData, transferred_to: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>NEW LOCATION:</label>
                <input className="win-input" placeholder="e.g., Desk drawer locked, Filing cabinet brown" value={transferData.new_location} onChange={(e) => setTransferData({...transferData, new_location: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 'bold' }}>REASON FOR TRANSFER:</label>
                <textarea className="win-input" rows="3" value={transferData.reason} onChange={(e) => setTransferData({...transferData, reason: e.target.value})} 
                  style={{ fontFamily: "'Courier Prime', monospace", fontSize: '10px' }} />
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button className="win-button" style={{ flex: 1, background: 'hsl(220,70%,35%)', color: 'white' }} 
                  onClick={() => transferMutation.mutate(transferData)}>
                  TRANSFER
                </button>
                <button className="win-button" style={{ flex: 1 }} onClick={() => { setShowTransferForm(false); setSelectedDrive(null); }}>CANCEL</button>
              </div>
            </div>
          </WinWindow>
        )}

        {/* Main H-Drive List */}
        <WinWindow title="H-DRIVE INVENTORY — CHAIN OF CUSTODY TRACKING SYSTEM" icon="💾">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '4px', alignItems: 'center' }}>
            <button className="win-button" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: 'hsl(220,70%,35%)', color: 'white' }}
              onClick={() => setShowAddForm(true)}>
              <Plus className="w-3 h-3" /> ADD H-DRIVE
            </button>
            <button className="win-button" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: 'hsl(140,70%,40%)', color: 'white' }}
              onClick={() => setShowBulkImport(true)}>
              <Upload className="w-3 h-3" /> BULK IMPORT
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              <Search className="w-3 h-3" />
              <input className="win-input" style={{ fontSize: '11px', width: '192px' }} placeholder="Search serial..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="win-panel-inset" style={{ maxHeight: '600px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <table style={{ width: '100%', fontSize: '10px', fontFamily: "'Courier Prime', monospace" }}>
              <thead>
                <tr style={{ background: 'hsl(220,70%,35%)', color: 'white', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '4px', textAlign: 'left' }}>SERIAL #</th>
                  <th style={{ padding: '4px', textAlign: 'left' }}>MAKE/MODEL</th>
                  <th style={{ padding: '4px', textAlign: 'left' }}>CURRENT USER</th>
                  <th style={{ padding: '4px', textAlign: 'left' }}>LOCATION</th>
                  <th style={{ padding: '4px', textAlign: 'left', minWidth: '120px' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,40%)' }}>NO H-DRIVES FOUND</td></tr>
                )}
                {filtered.map((d, i) => {
                  const dup = isDuplicate(d);
                  return (
                  <tr key={d.id} style={{ backgroundColor: dup ? 'hsl(0,80%,92%)' : i % 2 === 0 ? 'hsl(220,15%,96%)' : 'hsl(220,20%,92%)', height: '24px', lineHeight: '24px', outline: dup ? '2px solid hsl(0,72%,45%)' : 'none' }}>
                    <td style={{ padding: '0 4px', fontWeight: 'bold' }}>
                      {dup && <span style={{ background: 'hsl(0,72%,45%)', color: 'white', fontSize: '8px', padding: '0 3px', marginRight: '4px', fontWeight: 'bold' }}>⚠ DUPLICATE</span>}
                      {d.serial_number}
                    </td>
                    <td style={{ padding: '0 4px' }}>{d.make} / {d.model}</td>
                    <td style={{ padding: '0 4px' }}>{d.current_user || '—'}</td>
                    <td style={{ padding: '0 4px', fontSize: '9px' }}>{d.current_location || '—'}</td>
                    <td style={{ padding: '0 4px', display: 'flex', gap: '2px', whiteSpace: 'nowrap', alignItems: 'center' }}>
                      <button className="win-button" style={{ padding: '0 4px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                        onClick={() => { setSelectedDrive(d); setShowTransferForm(true); }} title="Transfer">
                        <ArrowRight className="w-3 h-3" /> TRANSFER
                      </button>
                      <button className="win-button" style={{ padding: '0 2px', fontSize: '10px', display: 'inline-flex' }}
                        onClick={() => { if (confirm('Delete this H-Drive?')) deleteMutation.mutate(d.id); }} title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '10px', color: 'hsl(220,10%,40%)', marginTop: '2px' }}>
            TOTAL H-DRIVES: {filtered.length}
          </div>
        </WinWindow>

        {/* Chain of Custody Log */}
        <WinWindow title="CHAIN OF CUSTODY LOG" icon="📜">
          <div className="win-panel-inset" style={{ maxHeight: '500px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
            {custody.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'hsl(220,10%,40%)' }}>NO CUSTODY TRANSFERS</div>
            ) : (
              <table style={{ width: '100%', fontSize: '9px', fontFamily: "'Courier Prime', monospace" }}>
                <thead>
                  <tr style={{ background: 'hsl(220,70%,35%)', color: 'white', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '4px', textAlign: 'left' }}>SERIAL #</th>
                    <th style={{ padding: '4px', textAlign: 'left' }}>FROM → TO</th>
                    <th style={{ padding: '4px', textAlign: 'left' }}>LOCATION</th>
                    <th style={{ padding: '4px', textAlign: 'left' }}>REASON</th>
                    <th style={{ padding: '4px', textAlign: 'left' }}>DATE/TIME</th>
                  </tr>
                </thead>
                <tbody>
                  {custody.map((c, i) => (
                    <tr key={c.id} style={{ backgroundColor: i % 2 === 0 ? 'hsl(220,15%,96%)' : 'hsl(220,20%,92%)' }}>
                      <td style={{ padding: '2px 4px', fontWeight: 'bold' }}>{c.hdrive_serial}</td>
                      <td style={{ padding: '2px 4px', fontSize: '8px' }}>{c.transferred_from} → {c.transferred_to}</td>
                      <td style={{ padding: '2px 4px', fontSize: '8px' }}>{c.previous_location} → {c.new_location}</td>
                      <td style={{ padding: '2px 4px', fontSize: '8px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.reason}</td>
                      <td style={{ padding: '2px 4px', fontSize: '8px', whiteSpace: 'nowrap' }}>{new Date(c.transfer_date).toLocaleDateString()} {new Date(c.transfer_date).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </WinWindow>
      </div>
    </>
  );
}