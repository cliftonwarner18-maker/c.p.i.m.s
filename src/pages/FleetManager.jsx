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
    <div className="space-y-2">
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
        <div className="flex flex-wrap gap-2 mb-2">
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
                <th className="p-1 text-left">BUS#</th>
                <th className="p-1 text-left">TYPE</th>
                <th className="p-1 text-left">YEAR</th>
                <th className="p-1 text-left">MAKE/MODEL</th>
                <th className="p-1 text-left">LOCATION</th>
                <th className="p-1 text-left">CAMERA</th>
                <th className="p-1 text-left">STATUS</th>
                <th className="p-1 text-left">INSP. DUE</th>
                <th className="p-1 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">NO VEHICLES FOUND</td></tr>
              )}
              {filtered.map((b, i) => {
                const overdue = b.next_inspection_due && new Date(b.next_inspection_due) < new Date();
                return (
                  <tr key={b.id} className={i % 2 === 0 ? 'bg-card' : 'bg-background'}>
                    <td className="p-1 font-bold">{b.bus_number}</td>
                    <td className="p-1">{b.bus_type}</td>
                    <td className="p-1">{b.year}</td>
                    <td className="p-1">{b.make} {b.model}</td>
                    <td className="p-1">{b.camera_system_type || 'None'}</td>
                    <td className="p-1 font-bold">{b.status || 'Active'}</td>
                    <td className={`p-1 font-bold ${overdue ? 'status-cancelled' : ''}`}>
                      {b.next_inspection_due ? new Date(b.next_inspection_due).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-1 flex gap-1">
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
        <div className="text-[10px] text-muted-foreground mt-1">
          TOTAL FLEET: {filtered.length} VEHICLES
        </div>
      </WinWindow>
    </div>
  );
}