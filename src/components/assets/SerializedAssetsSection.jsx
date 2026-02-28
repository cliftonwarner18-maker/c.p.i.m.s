import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { Plus, Edit2, Trash2, FileDown } from 'lucide-react';

const FF = "'Courier Prime', monospace";
const inputStyle = { width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };
const sectionHdr = { background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: 0 };

export default function SerializedAssetsSection() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({ queryKey: ['serializedAssets'], queryFn: () => base44.entities.SerializedAsset.list() });
  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list() });

  const createMutation = useMutation({ mutationFn: (data) => base44.entities.SerializedAsset.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['serializedAssets'] }); resetForm(); } });
  const updateMutation = useMutation({ mutationFn: (data) => base44.entities.SerializedAsset.update(editingAsset.id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['serializedAssets'] }); resetForm(); } });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.SerializedAsset.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['serializedAssets'] }) });

  const resetForm = () => { setFormData({}); setEditingAsset(null); setShowForm(false); };
  const handleEdit = (asset) => { setEditingAsset(asset); setFormData(asset); setShowForm(true); };
  const handleSubmit = (e) => { e.preventDefault(); editingAsset ? updateMutation.mutate(formData) : createMutation.mutate(formData); };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const response = await base44.functions.invoke('exportSerializedAssets', { statusFilter, startDate: '', endDate: '' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'serialized-assets.pdf';
    document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    setIsExporting(false);
  };

  const handleCleanupDuplicates = async () => {
    if (!window.confirm('Delete duplicate serialized assets?\n\nThis cannot be undone.')) return;
    setIsCleaningUp(true);
    const response = await base44.functions.invoke('cleanupDuplicates', { entityName: 'SerializedAsset' });
    queryClient.invalidateQueries({ queryKey: ['serializedAssets'] });
    alert(`Cleanup complete!\n${response.data.message}`);
    setIsCleaningUp(false);
  };

  const serialCounts = assets.reduce((acc, a) => { const key = a.serial_number?.trim().toLowerCase(); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const isAssetDuplicate = (a) => a.serial_number && serialCounts[a.serial_number.trim().toLowerCase()] > 1;
  const isMissingAssetNum = (a) => !a.asset_number || a.asset_number.trim() === '';

  const filteredAssets = assets.filter(asset => {
    const statusMatch = statusFilter === 'All' || asset.status === statusFilter;
    const searchMatch = !searchQuery || asset.asset_number?.toLowerCase().includes(searchQuery.toLowerCase()) || asset.brand?.toLowerCase().includes(searchQuery.toLowerCase()) || asset.model?.toLowerCase().includes(searchQuery.toLowerCase()) || asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden', fontFamily: FF }}>
      <DeleteConfirmModal isOpen={!!deleteTarget} label={deleteTarget ? `${deleteTarget.brand} ${deleteTarget.model} (S/N: ${deleteTarget.serial_number})` : ''} onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />

      <div style={sectionHdr}>🎥 SERIALIZED ASSETS — DVR RECORDERS & HIGH VALUE EQUIPMENT</div>

      <div style={{ padding: '10px', background: 'hsl(220,10%,98%)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => { setEditingAsset(null); setFormData({}); setShowForm(!showForm); }} style={{ ...btnBase, background: 'hsl(220,55%,38%)', color: 'white', borderColor: 'hsl(220,55%,30%)' }}><Plus style={{ width: 12, height: 12 }} /> Add Asset</button>
          <input placeholder="Search assets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...inputStyle, width: 160 }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 140 }}>
            {['All', 'In-Service', 'Decommissioned', 'Awaiting Auction', 'Sold', 'In Repair'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={handleExportPDF} disabled={isExporting} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}><FileDown style={{ width: 12, height: 12 }} /> Export PDF</button>
          <button onClick={handleCleanupDuplicates} disabled={isCleaningUp} style={{ ...btnBase, background: 'hsl(0,65%,42%)', color: 'white', borderColor: 'hsl(0,65%,35%)' }}>🧹 {isCleaningUp ? 'CLEANING...' : 'CLEAN DUPLICATES'}</button>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', padding: '12px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[['Asset #', 'asset_number'], ['Brand', 'brand'], ['Model', 'model'], ['Serial #', 'serial_number']].map(([label, field]) => (
                <div key={field}>
                  <label style={labelStyle}>{label}:</label>
                  <input style={inputStyle} value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Status:</label>
                <select style={inputStyle} value={formData.status || 'In-Service'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  {['In-Service', 'Decommissioned', 'Awaiting Auction', 'Sold', 'In Repair'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Assigned Bus #:</label>
                <select style={inputStyle} value={formData.assigned_bus_number || ''} onChange={e => setFormData({ ...formData, assigned_bus_number: e.target.value })}>
                  <option value="">None</option>
                  {buses.map(b => <option key={b.id} value={b.bus_number}>{b.bus_number}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Current Location:</label>
                <input style={inputStyle} placeholder="e.g., Upstairs Loft, Parts Room" value={formData.current_location || ''} onChange={e => setFormData({ ...formData, current_location: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={resetForm} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>Cancel</button>
                <button type="submit" style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>Save</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ fontSize: '10px', color: 'hsl(220,10%,50%)' }}>Showing {filteredAssets.length} of {assets.length} assets</div>

        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: 400, border: '1px solid hsl(220,18%,82%)', borderRadius: '2px' }}>
          <table style={{ width: '100%', fontSize: '10px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0 }}>
                {['Asset #', 'Brand', 'Model', 'Serial #', 'Status', 'Bus #', 'Location', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '5px 7px', textAlign: 'left', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, i) => {
                const dup = isAssetDuplicate(asset);
                const missing = isMissingAssetNum(asset);
                return (
                  <tr key={asset.id} style={{ background: missing ? 'hsl(45,90%,93%)' : dup ? 'hsl(0,80%,93%)' : i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                    <td style={{ padding: '4px 7px', fontWeight: '700' }}>
                      {missing && <span style={{ background: 'hsl(45,90%,50%)', color: 'hsl(30,80%,15%)', fontSize: '8px', padding: '0 3px', marginRight: 3, fontWeight: '700' }}>MISS</span>}
                      {dup && <span style={{ background: 'hsl(0,65%,45%)', color: 'white', fontSize: '8px', padding: '0 3px', marginRight: 3, fontWeight: '700' }}>DUP</span>}
                      {asset.asset_number || '—'}
                    </td>
                    <td style={{ padding: '4px 7px' }}>{asset.brand}</td>
                    <td style={{ padding: '4px 7px' }}>{asset.model}</td>
                    <td style={{ padding: '4px 7px' }}>{asset.serial_number}</td>
                    <td style={{ padding: '4px 7px' }}>{asset.status}</td>
                    <td style={{ padding: '4px 7px' }}>{asset.assigned_bus_number || '—'}</td>
                    <td style={{ padding: '4px 7px' }}>{asset.current_location || '—'}</td>
                    <td style={{ padding: '4px 7px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleEdit(asset)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(220,60%,40%)', padding: 0 }}><Edit2 style={{ width: 13, height: 13 }} /></button>
                        <button onClick={() => setDeleteTarget(asset)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(0,65%,45%)', padding: 0 }}><Trash2 style={{ width: 13, height: 13 }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}