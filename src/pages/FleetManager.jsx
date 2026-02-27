import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import LoadingScreen from '../components/LoadingScreen';
import BusForm from '../components/fleet/BusForm';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Eye, Pencil, Trash2, Search, FileDown } from 'lucide-react';

export default function FleetManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [isExporting, setIsExporting] = useState(false);

  const { data: buses = [], isLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bus.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buses'] }),
  });

  const busNumCounts = buses.reduce((acc, b) => {
    const key = b.bus_number?.trim().toLowerCase();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const isBusDuplicate = (b) => busNumCounts[b.bus_number?.trim().toLowerCase()] > 1;

  const filtered = buses.filter(b => {
    const matchSearch = !search || 
      b.bus_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.vin?.toLowerCase().includes(search.toLowerCase()) ||
      b.make?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || b.bus_type === typeFilter;
    const matchLocation = locationFilter === 'All' || b.base_location === locationFilter;
    return matchSearch && matchType && matchLocation;
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('exportFleet', {
        locationFilter,
        busTypeFilter: typeFilter
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fleet-inventory.pdf';
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
    <>
      <LoadingScreen isLoading={isLoading} message="LOADING FLEET..." />
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
       {showForm && (
        <BusForm
          bus={editingBus}
          onClose={() => { setShowForm(false); setEditingBus(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditingBus(null);
            queryClient.invalidateQueries({ queryKey: ['buses'] });
          }}
        />
      )}

      <WinWindow title="FLEET MANAGEMENT — VEHICLE DATABASE" icon="🚌">
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'4px',alignItems:'center'}}>
           <button
              className="win-button"
              style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',background:'hsl(220,70%,35%)',color:'white'}}
              onClick={() => { setEditingBus(null); setShowForm(true); }}
            >
              <Plus className="w-3 h-3" /> ADD NEW VEHICLE
            </button>
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
              <span style={{fontSize:'11px',fontWeight:'bold'}}>TYPE:</span>
              {['All', 'School Bus', 'Activity Bus'].map(t => (
                <button
                  key={t}
                  className="win-button"
                  style={{fontSize:'10px',padding:'0 4px',background: typeFilter === t ? 'hsl(220,70%,35%)' : 'hsl(220,15%,90%)',color: typeFilter === t ? 'white' : 'inherit'}}
                  onClick={() => setTypeFilter(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
              <span style={{fontSize:'11px',fontWeight:'bold'}}>LOCATION:</span>
              {['All', 'Main', 'North', 'Central', 'Sold'].map(l => (
                <button
                  key={l}
                  className="win-button"
                  style={{fontSize:'10px',padding:'0 4px',background: locationFilter === l ? 'hsl(220,70%,35%)' : 'hsl(220,15%,90%)',color: locationFilter === l ? 'white' : 'inherit'}}
                  onClick={() => setLocationFilter(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="win-button"
              disabled={isExporting}
              style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',background:isExporting ? 'hsl(220,15%,75%)' : 'hsl(220,70%,35%)',color:'white'}}
              onClick={handleExportPDF}
            >
              <FileDown className="w-3 h-3" /> EXPORT PDF
            </button>
            <div style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'auto'}}>
              <Search className="w-3 h-3" />
              <input
                className="win-input"
                style={{fontSize:'11px',width:'192px'}}
                placeholder="Search fleet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

        <div className="win-panel-inset" style={{ maxHeight: '500px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
            <thead>
              <tr style={{background:'hsl(220,70%,35%)',color:'white',position:'sticky',top:0}}>
                <th style={{padding:'4px',textAlign:'left'}}>BUS#</th>
                <th style={{padding:'4px',textAlign:'left'}}>TYPE</th>
                <th style={{padding:'4px',textAlign:'left'}}>YEAR</th>
                <th style={{padding:'4px',textAlign:'left'}}>MAKE/MODEL</th>
                <th style={{padding:'4px',textAlign:'left'}}>LOCATION</th>
                <th style={{padding:'4px',textAlign:'left'}}>CAMERA</th>
                <th style={{padding:'4px',textAlign:'left'}}>STATUS</th>
                <th style={{padding:'4px',textAlign:'left'}}>INSP. DUE</th>
                <th style={{padding:'4px',textAlign:'left',minWidth:'80px'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{padding:'16px',textAlign:'center',color:'hsl(220,10%,40%)'}}>NO VEHICLES FOUND</td></tr>
              )}
              {filtered.map((b, i) => {
                const overdue = b.next_inspection_due && new Date(b.next_inspection_due) < new Date();
                const dup = isBusDuplicate(b);
                return (
                  <tr key={b.id} style={{backgroundColor: dup ? 'hsl(0,80%,92%)' : i % 2 === 0 ? 'hsl(220,15%,96%)' : 'hsl(220,20%,92%)',height:'24px',lineHeight:'24px', outline: dup ? '2px solid hsl(0,72%,45%)' : 'none'}}>
                    <td style={{padding:'0 4px',fontWeight:'bold'}}>
                      {dup && <span style={{background:'hsl(0,72%,45%)',color:'white',fontSize:'8px',padding:'0 3px',marginRight:'4px',fontWeight:'bold'}}>⚠ DUPLICATE</span>}
                      {b.bus_number}
                    </td>
                    <td style={{padding:'0 4px'}}>{b.bus_type}</td>
                    <td style={{padding:'0 4px'}}>{b.year}</td>
                    <td style={{padding:'0 4px'}}>{b.make} {b.model}</td>
                    <td style={{padding:'0 4px'}}>{b.base_location || '—'}</td>
                    <td style={{padding:'0 4px'}}>{b.camera_system_type || 'None'}</td>
                    <td style={{padding:'0 4px',fontWeight:'bold'}}>{b.status || 'Active'}</td>
                    <td style={{padding:'0 4px',fontWeight:'bold',color: overdue ? 'hsl(0,60%,45%)' : 'inherit'}}>
                      {b.next_inspection_due ? new Date(b.next_inspection_due).toLocaleDateString() : '—'}
                    </td>
                    <td style={{padding:'0 4px',display:'flex',gap:'2px',whiteSpace:'nowrap',alignItems:'center'}}>
                      <Link
                        to={createPageUrl('BusProfile') + `?bus=${b.bus_number}`}
                        className="win-button"
                        style={{padding:'0 2px',fontSize:'10px',display:'inline-flex',alignItems:'center',justifyContent:'center',textDecoration:'none',color:'inherit'}}
                        title="View Profile"
                      >
                        <Eye className="w-3 h-3" />
                      </Link>
                      <button
                        className="win-button"
                        style={{padding:'0 2px',fontSize:'10px',display:'inline-flex',alignItems:'center',justifyContent:'center'}}
                        onClick={() => { setEditingBus(b); setShowForm(true); }}
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        className="win-button"
                        style={{padding:'0 2px',fontSize:'10px',display:'inline-flex',alignItems:'center',justifyContent:'center'}}
                        onClick={() => { if (confirm('Delete this vehicle?')) deleteMutation.mutate(b.id); }}
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{fontSize:'10px',color:'hsl(220,10%,40%)',marginTop:'2px'}}>
          TOTAL FLEET: {filtered.length} VEHICLES
        </div>
        </WinWindow>
        </div>
        </>
        );
        }