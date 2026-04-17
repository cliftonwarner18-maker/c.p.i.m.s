import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DeleteConfirmModal from '../DeleteConfirmModal';
import { Plus, Edit2, Trash2, FileDown, AlertTriangle } from 'lucide-react';
import { exportNonSerializedPDF } from '../../utils/exports/exportNonSerializedLocal';

const FF = "'Courier Prime', monospace";
const inputStyle = { width: '100%', padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', display: 'block', marginBottom: '3px' };
const btnBase = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: '10px', fontFamily: FF, fontWeight: '700', border: '1px solid', borderRadius: '2px', cursor: 'pointer' };
const sectionHdr = { background: 'linear-gradient(to right, hsl(30,65%,35%), hsl(30,60%,45%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: 0 };

export default function NonSerializedAssetsSection() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: assets = [] } = useQuery({ queryKey: ['nonSerializedAssets'], queryFn: () => base44.entities.NonSerializedAsset.list() });

  const createMutation = useMutation({ mutationFn: (data) => base44.entities.NonSerializedAsset.create(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['nonSerializedAssets'] }); resetForm(); } });
  const updateMutation = useMutation({ mutationFn: (data) => base44.entities.NonSerializedAsset.update(editingAsset.id, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['nonSerializedAssets'] }); resetForm(); } });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.NonSerializedAsset.delete(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['nonSerializedAssets'] }) });

  const adjustQuantity = (asset, amount) => updateMutation.mutate({ ...asset, quantity_on_hand: Math.max(0, (asset.quantity_on_hand || 0) + amount) });
  const resetForm = () => { setFormData({}); setEditingAsset(null); setShowForm(false); };
  const handleEdit = (asset) => { setEditingAsset(asset); setFormData(asset); setShowForm(true); };
  const handleSubmit = (e) => { e.preventDefault(); editingAsset ? updateMutation.mutate(formData) : createMutation.mutate(formData); };

  const handleExportPDF = () => {
    exportNonSerializedPDF({ assets });
  };

  return (
    <div style={{ border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden', fontFamily: FF }}>
      {deleteTarget && (
        <DeleteConfirmModal
          title={`DELETE SPARE PART`}
          message={`This will permanently delete ${deleteTarget.part_name}. This action cannot be undone.`}
          onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}

      <div style={sectionHdr}>🔧 NON-SERIALIZED ASSETS — SPARE PARTS INVENTORY</div>

      <div style={{ padding: '10px', background: 'hsl(220,10%,98%)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => { setEditingAsset(null); setFormData({}); setShowForm(true); }} style={{ ...btnBase, background: 'hsl(30,65%,38%)', color: 'white', borderColor: 'hsl(30,65%,30%)' }}><Plus style={{ width: 12, height: 12 }} /> Add Part</button>
          <button onClick={handleExportPDF} style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}><FileDown style={{ width: 12, height: 12 }} /> Export PDF</button>
        </div>

        {showForm && (
          <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', padding: '12px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[['Part Name', 'part_name'], ['Brand', 'brand'], ['Model #', 'model_number'], ['Use/Purpose', 'use']].map(([label, field]) => (
                <div key={field}>
                  <label style={labelStyle}>{label}:</label>
                  <input style={inputStyle} value={formData[field] || ''} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Quantity:</label>
                  <input type="number" min="0" style={inputStyle} value={formData.quantity_on_hand || 0} onChange={e => setFormData({ ...formData, quantity_on_hand: parseInt(e.target.value) || 0 })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Low Level Threshold:</label>
                  <input type="number" min="0" style={inputStyle} placeholder="e.g. 5" value={formData.low_level_threshold || ''} onChange={e => setFormData({ ...formData, low_level_threshold: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Current Location:</label>
                <input style={inputStyle} placeholder="e.g., Parts Room, Shelf B" value={formData.current_location || ''} onChange={e => setFormData({ ...formData, current_location: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={resetForm} style={{ ...btnBase, background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', borderColor: 'hsl(220,18%,70%)' }}>Cancel</button>
                <button type="submit" style={{ ...btnBase, background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>Save</button>
              </div>
            </form>
          </div>
        )}

        {/* Low stock banner */}
        {assets.some(a => a.low_level_threshold > 0 && (a.quantity_on_hand || 0) <= a.low_level_threshold) && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '2px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#991b1b', fontWeight: '700' }}>
            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
            LOW STOCK ALERT — {assets.filter(a => a.low_level_threshold > 0 && (a.quantity_on_hand || 0) <= a.low_level_threshold).length} item(s) at or below threshold
          </div>
        )}

        <div style={{ overflowX: 'auto', maxHeight: 400, border: '1px solid hsl(220,18%,82%)', borderRadius: '2px' }}>
          <table style={{ width: '100%', fontSize: '10px', fontFamily: FF, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'hsl(30,60%,32%)', color: 'white', position: 'sticky', top: 0 }}>
                {['Part Name', 'Brand', 'Model #', 'Use', 'Qty', 'Threshold', 'Location', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '5px 7px', textAlign: 'left', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, i) => {
                const isLow = asset.low_level_threshold > 0 && (asset.quantity_on_hand || 0) <= asset.low_level_threshold;
                return (
                  <tr key={asset.id} style={{ background: isLow ? '#fef2f2' : (i % 2 === 0 ? 'white' : 'hsl(220,18%,97%)'), borderBottom: '1px solid hsl(220,18%,90%)', outline: isLow ? '1px solid #fca5a5' : 'none' }}>
                  <td style={{ padding: '4px 7px', fontWeight: isLow ? '700' : 'normal', color: isLow ? '#991b1b' : 'inherit' }}>
                    {isLow && <AlertTriangle style={{ width: 11, height: 11, color: '#dc2626', flexShrink: 0, marginRight: 3, verticalAlign: 'middle' }} />}
                    {asset.part_name}
                  </td>
                  <td style={{ padding: '4px 7px' }}>{asset.brand}</td>
                  <td style={{ padding: '4px 7px' }}>{asset.model_number}</td>
                  <td style={{ padding: '4px 7px' }}>{asset.use}</td>
                  <td style={{ padding: '4px 7px', fontWeight: '700', textAlign: 'center', color: isLow ? '#dc2626' : 'inherit' }}>{asset.quantity_on_hand || 0}</td>
                  <td style={{ padding: '4px 7px', textAlign: 'center', color: asset.low_level_threshold > 0 ? 'hsl(220,10%,40%)' : 'hsl(220,10%,65%)', fontSize: '10px' }}>{asset.low_level_threshold > 0 ? asset.low_level_threshold : '—'}</td>
                  <td style={{ padding: '4px 7px' }}>{asset.current_location || '—'}</td>
                  <td style={{ padding: '4px 7px' }}>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      <button onClick={() => adjustQuantity(asset, -1)} style={{ ...btnBase, padding: '1px 7px', background: 'hsl(0,65%,45%)', color: 'white', borderColor: 'hsl(0,65%,38%)' }}>−</button>
                      <button onClick={() => adjustQuantity(asset, 1)} style={{ ...btnBase, padding: '1px 7px', background: 'hsl(140,55%,38%)', color: 'white', borderColor: 'hsl(140,55%,30%)' }}>+</button>
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