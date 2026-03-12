import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { Plus, Edit2, Trash2, FileDown } from 'lucide-react';

const FF = "'Courier Prime', monospace";
const inputStyle = { width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };
const sectionHdr = { background: 'linear-gradient(to right, hsl(0,60%,32%), hsl(0,55%,42%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: 0 };

export default function DecommissionedAssetsSection() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOutOfInventory, setFilterOutOfInventory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkModifyMode, setBulkModifyMode] = useState(false);
  const [bulkData, setBulkData] = useState({ decom_status: '', out_of_inventory: null });
  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({ queryKey: ['decommissionedAssets'], queryFn: () => base44.entities.DecommissionedAsset.list() });
  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list() });

  const createMutation = useMutation({ mutationFn: (data) => base44.entities.DecommissionedAsset.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['decommissionedAssets'] }); resetForm(); } });
  const updateMutation = useMutation({ mutationFn: (data) => base44.entities.DecommissionedAsset.update(editingAsset.id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['decommissionedAssets'] }); resetForm(); } });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.DecommissionedAsset.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decommissionedAssets'] }) });
  const bulkUpdateMutation = useMutation({ mutationFn: async (updates) => {
    return Promise.all(Array.from(selectedIds).map(id => base44.entities.DecommissionedAsset.update(id, updates)));
  }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['decommissionedAssets'] }); setSelectedIds(new Set()); setBulkModifyMode(false); setBulkData({ decom_status: '', out_of_inventory: null }); } });

  const resetForm = () => { setFormData({}); setEditingAsset(null); setShowForm(false); };
  const handleEdit = (asset) => { setEditingAsset(asset); setFormData(asset); setShowForm(true); };
  const handleSubmit = (e) => { e.preventDefault(); editingAsset ? updateMutation.mutate(formData) : createMutation.mutate(formData); };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const response = await base44.functions.invoke('exportDecommissionedAssets', { statusFilter, startDate, endDate, filterOutOfInventory }, { responseType: 'arraybuffer' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'decommissioned-assets.pdf';
    document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
    setIsExporting(false);
  };

  const serialCounts = assets.reduce((acc, a) => { const key = a.serial_number?.trim().toLowerCase(); if (key) acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const isAssetDuplicate = (a) => a.serial_number && serialCounts[a.serial_number.trim().toLowerCase()] > 1;
  const isMissingAssetNum = (a) => !a.asset_number || a.asset_number.trim() === '';

  const filteredAssets = assets.filter(a => {
    const statusMatch = statusFilter === 'All' || a.decom_status === statusFilter;
    const startMatch = !startDate || a.out_of_service_date >= startDate;
    const endMatch = !endDate || a.out_of_service_date <= endDate;
    const invMatch = !filterOutOfInventory || !!a.out_of_inventory;
    return statusMatch && startMatch && endMatch && invMatch;
  });

  return (
    <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden', fontFamily: FF }}>
      <DeleteConfirmModal isOpen={!!deleteTarget} label={deleteTarget ? `${deleteTarget.make} ${deleteTarget.model}` : ''} onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />

      <div style={sectionHdr}>🗑️ DECOMMISSIONED ASSETS — SALVAGE & DISPOSAL LOG</div>

      <div style={{ padding: '10px', background: 'hsl(220,10%,98%)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => { setEditingAsset(null); setFormData({}); setShowForm(!showForm); }} style={{ ...btnBase, background: 'hsl(0,60%,42%)', color: 'white', borderColor: 'hsl(0,60%,35%)' }}><Plus style={{ width: 12, height: 12 }} /> Log Decommission</button>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 150 }}>
            {['All', 'In Bad Parts', 'Awaiting Auction', 'Took to Auction', 'Rebuilt', 'Salvaged'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, width: 140 }} />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputStyle, width: 140 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'white', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px' }}>
            <input type="checkbox" id="filter_oo_inv" checked={filterOutOfInventory} onChange={e => setFilterOutOfInventory(e.target.checked)} style={{ cursor: 'pointer' }} />
            <label htmlFor="filter_oo_inv" style={{ fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Out of Inv. Only</label>
          </div>
          <button onClick={handleExportPDF} disabled={isExporting} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}><FileDown style={{ width: 12, height: 12 }} /> Export PDF</button>
        </div>

        {showForm && (
          <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', padding: '12px', maxHeight: 480, overflowY: 'auto' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={labelStyle}>Out of Service Date:</label>
                <input type="date" style={inputStyle} value={formData.out_of_service_date || ''} onChange={e => setFormData({ ...formData, out_of_service_date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Employee:</label>
                <input style={inputStyle} value={formData.employee || ''} onChange={e => setFormData({ ...formData, employee: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Bus # (if applicable):</label>
                <select style={inputStyle} value={formData.bus_number || ''} onChange={e => setFormData({ ...formData, bus_number: e.target.value })}>
                  <option value="">None</option>
                  {buses.map(b => <option key={b.id} value={b.bus_number}>{b.bus_number}</option>)}
                </select>
              </div>
              {[['Purpose for OOS', 'purpose_for_oos'], ['Make', 'make'], ['Model', 'model'], ['Asset # (if applicable)', 'asset_number'], ['Serial # (if applicable)', 'serial_number']].map(([label, field]) => (
                <div key={field}>
                  <label style={labelStyle}>{label}:</label>
                  <input style={inputStyle} value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Describe OOS Reason:</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={formData.oos_reason || ''} onChange={e => setFormData({ ...formData, oos_reason: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Decom Status:</label>
                <select style={inputStyle} value={formData.decom_status || 'Awaiting Auction'} onChange={e => setFormData({ ...formData, decom_status: e.target.value })}>
                  {['In Bad Parts', 'Awaiting Auction', 'Took to Auction', 'Rebuilt', 'Salvaged'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Current Location:</label>
                <input style={inputStyle} placeholder="e.g., Storage Room A, Building 2" value={formData.current_location || ''} onChange={e => setFormData({ ...formData, current_location: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px', background: 'hsl(45,90%,95%)', border: '1px solid hsl(45,90%,65%)', borderRadius: '2px' }}>
                <input type="checkbox" id="out_of_inv_chk" checked={!!formData.out_of_inventory} onChange={e => setFormData({ ...formData, out_of_inventory: e.target.checked })} style={{ cursor: 'pointer' }} />
                <label htmlFor="out_of_inv_chk" style={{ cursor: 'pointer', fontWeight: '700', color: 'hsl(30,80%,30%)', fontSize: '11px' }}>✓ Device Out of Inventory — Sold/Auctioned</label>
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={resetForm} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>Cancel</button>
                <button type="submit" style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>Save</button>
              </div>
            </form>
          </div>
        )}

        {bulkModifyMode && selectedIds.size > 0 && (
          <div style={{ background: 'hsl(200,80%,92%)', border: '1px solid hsl(200,80%,70%)', borderRadius: '2px', padding: '10px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(200,80%,25%)' }}>BULK MODIFY {selectedIds.size} SELECTED ITEMS</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <label style={labelStyle}>Decom Status:</label>
                <select style={{ ...inputStyle, width: 180 }} value={bulkData.decom_status} onChange={e => setBulkData({ ...bulkData, decom_status: e.target.value })}>
                  <option value="">Keep Current</option>
                  {['In Bad Parts', 'Awaiting Auction', 'Took to Auction', 'Rebuilt', 'Salvaged'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'white', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px' }}>
                <input type="checkbox" id="bulk_oo_inv" checked={bulkData.out_of_inventory === true} onChange={e => setBulkData({ ...bulkData, out_of_inventory: e.target.checked ? true : null })} style={{ cursor: 'pointer' }} />
                <label htmlFor="bulk_oo_inv" style={{ cursor: 'pointer', fontWeight: '600', fontSize: '11px', whiteSpace: 'nowrap' }}>Mark Out of Inventory</label>
              </div>
              <button onClick={() => { const updates = {}; if (bulkData.decom_status) updates.decom_status = bulkData.decom_status; if (bulkData.out_of_inventory) updates.out_of_inventory = true; bulkUpdateMutation.mutate(updates); }} disabled={(!bulkData.decom_status && !bulkData.out_of_inventory) || bulkUpdateMutation.isPending} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>Apply</button>
              <button onClick={() => { setBulkModifyMode(false); setSelectedIds(new Set()); setBulkData({ decom_status: '', out_of_inventory: null }); }} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ fontSize: '10px', color: 'hsl(220,10%,50%)', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
          <span>Showing {filteredAssets.length} of {assets.length} records</span>
          {!bulkModifyMode ? (
            <button onClick={() => setBulkModifyMode(true)} style={{ ...btnBase, background: 'hsl(200,70%,42%)', color: 'white', borderColor: 'hsl(200,70%,35%)', fontSize: '10px' }}>BULK MODIFY</button>
          ) : null}
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 400, border: '1px solid hsl(220,18%,82%)', borderRadius: '2px' }}>
          <table style={{ width: '100%', fontSize: '10px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(0,55%,30%)', color: 'white', position: 'sticky', top: 0 }}>
                {(bulkModifyMode ? ['✓', 'OOS Date', 'Employee', 'Bus #', 'Make/Model', 'Serial #', 'Decom Status', 'Location', 'Out of Inv.', 'Actions'] : ['OOS Date', 'Employee', 'Bus #', 'Make/Model', 'Serial #', 'Decom Status', 'Location', 'Out of Inv.', 'Actions']).map(h => (
                  <th key={h} style={{ padding: '5px 7px', textAlign: h === '✓' ? 'center' : 'left', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, i) => {
                const dup = isAssetDuplicate(asset);
                const missing = isMissingAssetNum(asset);
                return (
                  <tr key={asset.id} style={{ background: missing ? 'hsl(45,90%,93%)' : dup ? 'hsl(0,80%,93%)' : i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)', borderBottom: '1px solid hsl(220,18%,90%)' }}>
                    <td style={{ padding: '4px 7px' }}>{asset.out_of_service_date}</td>
                    <td style={{ padding: '4px 7px' }}>{asset.employee}</td>
                    <td style={{ padding: '4px 7px' }}>{asset.bus_number || '—'}</td>
                    <td style={{ padding: '4px 7px' }}>
                      {missing && <span style={{ background: 'hsl(45,90%,50%)', color: 'hsl(30,80%,15%)', fontSize: '8px', padding: '0 3px', marginRight: 3, fontWeight: '700' }}>MISS</span>}
                      {asset.make} {asset.model}
                    </td>
                    <td style={{ padding: '4px 7px' }}>
                      {dup && <span style={{ background: 'hsl(0,65%,45%)', color: 'white', fontSize: '8px', padding: '0 3px', marginRight: 3, fontWeight: '700' }}>DUP</span>}
                      {asset.serial_number || '—'}
                    </td>
                    <td style={{ padding: '4px 7px' }}>{asset.decom_status}</td>
                    <td style={{ padding: '4px 7px', textAlign: 'center' }}>
                      {asset.out_of_inventory ? <span style={{ color: 'hsl(0,65%,40%)', fontWeight: '700' }}>✓ OUT</span> : <span style={{ color: 'hsl(220,10%,55%)' }}>—</span>}
                    </td>
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