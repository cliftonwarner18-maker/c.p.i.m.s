import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { Plus, Edit2, Trash2, FileDown } from 'lucide-react';

export default function DecommissionedAssetsSection() {
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOutOfInventory, setFilterOutOfInventory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['decommissionedAssets'],
    queryFn: () => base44.entities.DecommissionedAsset.list()
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DecommissionedAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decommissionedAssets'] });
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.DecommissionedAsset.update(editingAsset.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decommissionedAssets'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DecommissionedAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decommissionedAssets'] });
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
      const response = await base44.functions.invoke('exportDecommissionedAssets', {
        statusFilter,
        startDate,
        endDate
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'decommissioned-assets.pdf';
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

  return (
    <WinWindow title="DECOMMISSIONED ASSETS — SALVAGE & DISPOSAL LOG" icon="🗑️">
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
            <Plus style={{width:12,height:12}} /> Log Decommission
          </button>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="win-input"
            style={{fontSize:'11px',padding:'4px 8px'}}
          >
            <option>All</option>
            <option>In Bad Parts</option>
            <option>Awaiting Auction</option>
            <option>Took to Auction</option>
            <option>Rebuilt</option>
            <option>Salvaged</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="win-input"
            style={{fontSize:'11px',padding:'4px 8px'}}
            placeholder="Start Date"
          />
          
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="win-input"
            style={{fontSize:'11px',padding:'4px 8px'}}
            placeholder="End Date"
          />

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
          <div className="win-panel-inset" style={{padding:'12px',border:'2px solid hsl(220,15%,50%)',maxHeight:'500px',overflowY:'auto'}}>
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'8px',fontSize:'11px'}}>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Out of Service Date:</label>
                <input
                  type="date"
                  className="win-input"
                  value={formData.out_of_service_date || ''}
                  onChange={(e) => setFormData({...formData, out_of_service_date: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Employee:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.employee || ''}
                  onChange={(e) => setFormData({...formData, employee: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Bus # (if applicable):</label>
                <select
                  className="win-input"
                  value={formData.bus_number || ''}
                  onChange={(e) => setFormData({...formData, bus_number: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                >
                  <option value="">None</option>
                  {buses.map(bus => (
                    <option key={bus.id} value={bus.bus_number}>{bus.bus_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Purpose for OOS:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.purpose_for_oos || ''}
                  onChange={(e) => setFormData({...formData, purpose_for_oos: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Make:</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.make || ''}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
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
                <label style={{display:'block',marginBottom:'2px'}}>Asset # (if applicable):</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.asset_number || ''}
                  onChange={(e) => setFormData({...formData, asset_number: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Serial # (if applicable):</label>
                <input
                  type="text"
                  className="win-input"
                  value={formData.serial_number || ''}
                  onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Describe OOS Reason:</label>
                <textarea
                  className="win-input"
                  value={formData.oos_reason || ''}
                  onChange={(e) => setFormData({...formData, oos_reason: e.target.value})}
                  style={{width:'100%',fontSize:'11px',minHeight:'60px',fontFamily:'inherit'}}
                />
              </div>
              <div>
                <label style={{display:'block',marginBottom:'2px'}}>Decom Status:</label>
                <select
                  className="win-input"
                  value={formData.decom_status || 'Awaiting Auction'}
                  onChange={(e) => setFormData({...formData, decom_status: e.target.value})}
                  style={{width:'100%',fontSize:'11px'}}
                >
                  <option>In Bad Parts</option>
                  <option>Awaiting Auction</option>
                  <option>Took to Auction</option>
                  <option>Rebuilt</option>
                  <option>Salvaged</option>
                </select>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px',background:'hsl(45,90%,95%)',border:'1px solid hsl(45,90%,60%)'}}>
                <input
                  type="checkbox"
                  id="out_of_inventory_check"
                  checked={!!formData.out_of_inventory}
                  onChange={(e) => setFormData({...formData, out_of_inventory: e.target.checked})}
                  style={{width:'14px',height:'14px',cursor:'pointer'}}
                />
                <label htmlFor="out_of_inventory_check" style={{cursor:'pointer',fontWeight:'bold',color:'hsl(30,80%,30%)'}}>
                  ✓ Device Out of Inventory — Sold/Auctioned, No Longer a Bus Garage Asset
                </label>
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
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>OOS Date</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Employee</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Bus #</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Make/Model</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Serial #</th>
                <th style={{textAlign:'left',padding:'4px',fontWeight:'bold'}}>Decom Status</th>
                <th style={{textAlign:'center',padding:'4px',fontWeight:'bold'}}>Out of Inv.</th>
                <th style={{textAlign:'center',padding:'4px',fontWeight:'bold'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => (
                <tr key={asset.id} style={{borderBottom:'1px solid hsl(220,15%,85%)'}}>
                  <td style={{padding:'4px'}}>{asset.out_of_service_date}</td>
                  <td style={{padding:'4px'}}>{asset.employee}</td>
                  <td style={{padding:'4px'}}>{asset.bus_number || '-'}</td>
                  <td style={{padding:'4px'}}>{asset.make} {asset.model}</td>
                  <td style={{padding:'4px'}}>{asset.serial_number || '-'}</td>
                  <td style={{padding:'4px'}}>{asset.decom_status}</td>
                  <td style={{padding:'4px',textAlign:'center'}}>
                    {asset.out_of_inventory ? (
                      <span style={{color:'hsl(0,72%,45%)',fontWeight:'bold',fontSize:'10px'}}>✓ OUT</span>
                    ) : (
                      <span style={{color:'hsl(220,15%,60%)',fontSize:'10px'}}>—</span>
                    )}
                  </td>
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