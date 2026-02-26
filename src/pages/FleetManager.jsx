import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import BusForm from '../components/fleet/BusForm';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';

export default function FleetManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Bus.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buses'] }),
  });

  const filtered = buses.filter(b => {
    const matchSearch = !search || 
      b.bus_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.vin?.toLowerCase().includes(search.toLowerCase()) ||
      b.make?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || b.bus_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
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
        <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'4px'}}>
          <button
            className="win-button flex items-center gap-1 text-[11px] !bg-primary !text-primary-foreground"
            onClick={() => { setEditingBus(null); setShowForm(true); }}
          >
            <Plus className="w-3 h-3" /> ADD NEW VEHICLE
          </button>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold">TYPE:</span>
            {['All', 'School Bus', 'Activity Bus'].map(t => (
              <button
                key={t}
                className={`win-button !py-0 !px-2 text-[10px] ${typeFilter === t ? '!bg-primary !text-primary-foreground' : ''}`}
                onClick={() => setTypeFilter(t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Search className="w-3 h-3" />
            <input
              className="win-input text-[11px] w-48"
              placeholder="Search fleet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="win-panel-inset overflow-auto" style={{ maxHeight: '500px' }}>
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="bg-primary text-primary-foreground sticky top-0">
                <th style={{padding:'2px 4px',textAlign:'left'}}>BUS#</th>
                <th style={{padding:'2px 4px',textAlign:'left'}}>TYPE</th>
                <th style={{padding:'2px 4px',textAlign:'left'}}>YEAR</th>
                <th style={{padding:'2px 4px',textAlign:'left'}}>MAKE/MODEL</th>
                <th style={{padding:'2px 4px',textAlign:'left'}}>LOCATION</th>
                <th style={{padding:'2px 4px',textAlign:'left'}}>CAMERA</th>
                <th style={{padding:'2px 4px',textAlign:'left'}}>STATUS</th>
                <th style={{padding:'2px 4px',textAlign:'left'}}>INSP. DUE</th>
                <th style={{padding:'2px 4px',textAlign:'left',minWidth:'80px'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">NO VEHICLES FOUND</td></tr>
              )}
              {filtered.map((b, i) => {
                const overdue = b.next_inspection_due && new Date(b.next_inspection_due) < new Date();
                return (
                  <tr key={b.id} style={{backgroundColor: i % 2 === 0 ? 'hsl(220,15%,96%)' : 'hsl(220,20%,92%)'}}>
                    <td style={{padding:'2px 4px',fontWeight:'bold'}}>{b.bus_number}</td>
                    <td style={{padding:'2px 4px'}}>{b.bus_type}</td>
                    <td style={{padding:'2px 4px'}}>{b.year}</td>
                    <td style={{padding:'2px 4px'}}>{b.make} {b.model}</td>
                    <td style={{padding:'2px 4px'}}>{b.base_location || '—'}</td>
                    <td style={{padding:'2px 4px'}}>{b.camera_system_type || 'None'}</td>
                    <td style={{padding:'2px 4px',fontWeight:'bold'}}>{b.status || 'Active'}</td>
                    <td style={{padding:'2px 4px',fontWeight:'bold',color: overdue ? 'hsl(0,60%,45%)' : 'inherit'}}>
                      {b.next_inspection_due ? new Date(b.next_inspection_due).toLocaleDateString() : '—'}
                    </td>
                    <td style={{padding:'2px 4px',display:'flex',gap:'2px',whiteSpace:'nowrap'}}>
                      <Link
                        to={createPageUrl('BusProfile') + `?bus=${b.bus_number}`}
                        className="win-button !py-0 !px-1 text-[10px] no-underline text-foreground"
                        title="View Profile"
                      >
                        <Eye className="w-3 h-3" />
                      </Link>
                      <button
                        className="win-button !py-0 !px-1 text-[10px]"
                        onClick={() => { setEditingBus(b); setShowForm(true); }}
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        className="win-button !py-0 !px-1 text-[10px]"
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
  );
}