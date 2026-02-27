import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { Plus, Edit2, Trash2, FileDown } from 'lucide-react';

export default function SerializedAssetsSection() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['serializedAssets'],
    queryFn: () => base44.entities.SerializedAsset.list()
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SerializedAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serializedAssets'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.SerializedAsset.update(editingAsset.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serializedAssets'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SerializedAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serializedAssets'] });
    }
  });

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

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('exportSerializedAssets', {
        statusFilter,
        startDate: '',
        endDate: ''
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'serialized-assets.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('Error exporting PDF: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const serialCounts = assets.reduce((acc, a) => {
    const key = a.serial_number?.trim().toLowerCase();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const assetNumCounts = assets.reduce((acc, a) => {
    const key = a.asset_number?.trim().toLowerCase();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const isAssetDuplicate = (a) =>
    (a.serial_number && serialCounts[a.serial_number.trim().toLowerCase()] > 1) ||
    (a.asset_number && assetNumCounts[a.asset_number.trim().toLowerCase()] > 1);

  return (
    <WinWindow title="SERIALIZED ASSETS — DVR RECORDERS & HIGH VALUE EQUIPMENT" icon="🎥">
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
          <button
            onClick={() => {
              setEditingAsset(null);
              setFormData({});
              setShowForm(!showForm);
            }}
            className="win-button"
            style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px'}}
          >
            <Plus style={{width:12,height:12}} /> Add Asset
          </button>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="win-input"
            style={{fontSize:'11px',padding:'4px 8px'}}
          >
            <option>All</option>
            <option>In-Service</option>
            <option>Decommissioned</option>
            <option>Awaiting Auction</option>
            <option>Sold</option>
            <option>In Repair</option>
          </select>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="win-button"
            style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',background:isExporting ? 'hsl(220,15%,75%)' : 'hsl(220,70%,35%)',color:'white'}}
          >
            <FileDown style={{width:12,height:12}} /> Export PDF
          </button>
        </div>

        {showForm && (
          <div className="win-panel-inset" style={{padding:'12px',border:'2px solid hsl(220,15%,50%)'}}>
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'8px',fontSize:'11px'}}>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Asset #:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.asset_number || ''}
                  onChange={(e) => setFormData({...formData, asset_number: e.target.value})}
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
                <label style={{display:'block',marginBottom:'2px'}}>Model:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Serial #:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.serial_number || ''}
                  onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Status:</label>
                <select
                  className="win-input"
                  value={formData.status || 'In-Service'}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                >
                  <option>In-Service</option>
                  <option>Decommissioned</option>
                  <option>Awaiting Auction</option>
                  <option>Sold</option>
                  <option>In Repair</option>
                </select>
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Assigned Bus #:</label>
                <select
                  className="win-input"
                  value={formData.assigned_bus_number || ''}
                  onChange={(e) => setFormData({...formData, assigned_bus_number: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                >
                  <option value="">None</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.bus_number}>{bus.bus_number}</option>
                  ))}
                </select>
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
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Asset #</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Brand</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Model</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Serial #</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Status</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Bus #</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Location</th>
                <th style={{textAlign:'center',padding:'4px',fontWeight:'bold'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} style={{borderBottom:'1px solid hsl(220,15%,85%)'}}>
                  <td style={{padding:'4px'}}>{asset.asset_number}</td>
                  <td style={{padding:'4px'}}>{asset.brand}</td>
                  <td style={{padding:'4px'}}>{asset.model}</td>
                  <td style={{padding:'4px'}}>{asset.serial_number}</td>
                  <td style={{padding:'4px'}}>{asset.status}</td>
                  <td style={{padding:'4px'}}>{asset.assigned_bus_number || '-'}</td>
                  <td style={{padding:'4px'}}>{asset.current_location || '-'}</td>
                  <td style={{padding:'4px',textAlign:'center',display:'flex',gap:'4px',justifyContent:'center'}}>
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