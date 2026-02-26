import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function NonSerializedAssetsSection() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['nonSerializedAssets'],
    queryFn: () => base44.entities.NonSerializedAsset.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NonSerializedAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonSerializedAssets'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.NonSerializedAsset.update(editingAsset.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonSerializedAssets'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NonSerializedAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonSerializedAssets'] });
    }
  });

  const adjustQuantity = (asset, amount) => {
    const newQty = Math.max(0, (asset.quantity_on_hand || 0) + amount);
    updateMutation.mutate({ ...asset, quantity_on_hand: newQty });
  };

  const resetForm = () => {
    setFormData({});
    setEditingAsset(null);
    setShowForm(false);
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData(asset);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAsset) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <WinWindow title="NON-SERIALIZED ASSETS — SPARE PARTS INVENTORY" icon="🔧">
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        <button
          onClick={() => {
            setEditingAsset(null);
            setFormData({});
            setShowForm(!showForm);
          }}
          className="win-button"
          style={{width:'fit-content',display:'flex',alignItems:'center',gap:'4px'}}
        >
          <Plus style={{width:12,height:12}} /> Add Part
        </button>

        {showForm && (
          <div className="win-panel-inset" style={{padding:'12px',border:'2px solid hsl(220,15%,50%)'}}>
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'8px',fontSize:'11px'}}>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Part Name:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.part_name || ''}
                  onChange={(e) => setFormData({...formData, part_name: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Brand:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Model #:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.model_number || ''}
                  onChange={(e) => setFormData({...formData, model_number: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Use/Purpose:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.use || ''}
                  onChange={(e) => setFormData({...formData, use: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Quantity:</label>
                <input
                  type="number"
                  className="win-input"
                  min="0"
                  value={formData.quantity_on_hand || 0}
                  onChange={(e) => setFormData({...formData, quantity_on_hand: parseInt(e.target.value) || 0})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Current Location:</label>
                <input
                  type="text"
                  className="win-input"
                  placeholder="e.g., Upstairs Loft, Parts Room"
                  value={formData.current_location || ''}
                  onChange={(e) => setFormData({...formData, current_location: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div style={{display:'flex',gap:'4px',justifyContent:'flex-end'}}>
                <button type="button" className="win-button" onClick={resetForm} style={{fontSize:'11px'}}>Cancel</button>
                <button type="submit" className="win-button" style={{background:'hsl(220,70%,35%)',color:'white',fontSize:'11px'}}>Save</button>
              </div>
            </form>
          </div>
        )}

        <div className="win-panel-inset" style={{padding:'8px',fontSize:'10px',maxHeight:'400px',overflowY:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid hsl(220,15%,70%)'}}>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Part Name</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Brand</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Model #</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Use</th>
                <th style={{textAlign:'center',padding:'4px',fontWeight:'bold'}}>Qty</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Location</th>
                <th style={{textAlign:'center',padding:'4px',fontWeight:'bold'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} style={{borderBottom:'1px solid hsl(220,15%,85%)'}}>
                  <td style={{padding:'4px'}}>{asset.part_name}</td>
                  <td style={{padding:'4px'}}>{asset.brand}</td>
                  <td style={{padding:'4px'}}>{asset.model_number}</td>
                  <td style={{padding:'4px'}}>{asset.use}</td>
                  <td style={{padding:'4px',textAlign:'center'}}>{asset.quantity_on_hand || 0}</td>
                  <td style={{padding:'4px'}}>{asset.current_location || '-'}</td>
                  <td style={{padding:'4px',textAlign:'center',display:'flex',gap:'4px',justifyContent:'center'}}>
                    <button onClick={() => adjustQuantity(asset, -1)} className="win-button" style={{padding:'2px 6px',fontSize:'10px'}}>−</button>
                    <button onClick={() => adjustQuantity(asset, 1)} className="win-button" style={{padding:'2px 6px',fontSize:'10px'}}>+</button>
                    <button onClick={() => handleEdit(asset)} style={{background:'none',border:'none',cursor:'pointer',color:'hsl(220,70%,35%)',fontSize:'10px'}}>
                      <Edit2 style={{width:12,height:12}} />
                    </button>
                    <button onClick={() => deleteMutation.mutate(asset.id)} style={{background:'none',border:'none',cursor:'pointer',color:'hsl(0,72%,45%)',fontSize:'10px'}}>
                      <Trash2 style={{width:12,height:12}} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WinWindow>
  );
}