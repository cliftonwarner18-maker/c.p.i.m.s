import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import BusForm from '../components/fleet/BusForm';
import FleetTable from '../components/fleet/FleetTable';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Plus, FileDown, Search, Bus, MapPin, Filter } from 'lucide-react';

export default function FleetManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [isExporting, setIsExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const filtered = buses.filter(b => {
    const matchSearch = !search ||
      b.bus_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.vin?.toLowerCase().includes(search.toLowerCase()) ||
      b.make?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || b.bus_type === typeFilter;
    const matchLocation = locationFilter === 'All' || b.base_location === locationFilter;
    return matchSearch && matchType && matchLocation;
  });

  // Stats
  const activeCount = buses.filter(b => b.status === 'Active').length;
  const oosCount = buses.filter(b => b.status === 'Out of Service').length;
  const seonCount = buses.filter(b => b.camera_system_type === 'Seon').length;
  const svCount = buses.filter(b => b.camera_system_type === 'Safety Vision').length;
  const overdueCount = buses.filter(b => b.next_inspection_due && new Date(b.next_inspection_due) < new Date()).length;

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('exportFleet', { locationFilter, busTypeFilter: typeFilter });
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

  const statBoxStyle = (color) => ({
    background: 'white',
    border: `1px solid hsl(220,18%,78%)`,
    borderLeft: `3px solid ${color}`,
    borderRadius: '2px',
    padding: '8px 12px',
    minWidth: '100px',
    flex: '1',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: "'Courier Prime', monospace" }}>
      <LoadingScreen isLoading={isLoading} message="LOADING FLEET..." />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        label={deleteTarget ? `Bus #${deleteTarget.bus_number}` : ''}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      {showForm && (
        <BusForm
          bus={editingBus}
          onClose={() => { setShowForm(false); setEditingBus(null); }}
          onSaved={() => { setShowForm(false); setEditingBus(null); queryClient.invalidateQueries({ queryKey: ['buses'] }); }}
        />
      )}

      {/* Header Bar */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bus style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>FLEET MANAGEMENT</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>VEHICLE DATABASE — {buses.length} TOTAL VEHICLES</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setEditingBus(null); setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: 'pointer', letterSpacing: '0.05em' }}
          >
            <Plus style={{ width: 13, height: 13 }} /> ADD VEHICLE
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: isExporting ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: isExporting ? 'default' : 'pointer', letterSpacing: '0.05em' }}
          >
            <FileDown style={{ width: 13, height: 13 }} /> {isExporting ? 'EXPORTING...' : 'EXPORT PDF'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div style={statBoxStyle('hsl(140,55%,40%)')}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(140,55%,35%)', lineHeight: 1 }}>{activeCount}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>ACTIVE</div>
        </div>
        <div style={statBoxStyle('hsl(0,65%,50%)')}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(0,65%,45%)', lineHeight: 1 }}>{oosCount}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>OUT OF SERVICE</div>
        </div>
        <div style={statBoxStyle('hsl(220,65%,45%)')}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(220,65%,40%)', lineHeight: 1 }}>{seonCount}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>SEON DVR</div>
        </div>
        <div style={statBoxStyle('hsl(200,75%,42%)')}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(200,75%,38%)', lineHeight: 1 }}>{svCount}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>SAFETY VISION</div>
        </div>
        <div style={statBoxStyle('hsl(30,85%,45%)')}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(30,85%,40%)', lineHeight: 1 }}>{overdueCount}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>INSP. OVERDUE</div>
        </div>
        <div style={statBoxStyle('hsl(220,20%,55%)')}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(220,20%,35%)', lineHeight: 1 }}>{filtered.length}</div>
          <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>SHOWING</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Filter style={{ width: 12, height: 12, color: 'hsl(220,30%,45%)' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>TYPE:</span>
          {['All', 'School Bus', 'Activity Bus'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: typeFilter === t ? '700' : '500', background: typeFilter === t ? 'hsl(220,55%,38%)' : 'white', color: typeFilter === t ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${typeFilter === t ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer', letterSpacing: '0.04em' }}>
              {t === 'All' ? 'ALL' : t === 'School Bus' ? 'SCHOOL' : 'ACTIVITY'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <MapPin style={{ width: 12, height: 12, color: 'hsl(220,30%,45%)' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>LOCATION:</span>
          {['All', 'Main', 'North', 'Central', 'Sold'].map(l => (
            <button key={l} onClick={() => setLocationFilter(l)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: locationFilter === l ? '700' : '500', background: locationFilter === l ? 'hsl(220,55%,38%)' : 'white', color: locationFilter === l ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${locationFilter === l ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer', letterSpacing: '0.04em' }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
          <Search style={{ width: 12, height: 12, color: 'hsl(220,20%,45%)' }} />
          <input
            placeholder="Search bus #, make, VIN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', width: '200px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Table */}
      <FleetTable
        buses={filtered}
        busNumCounts={busNumCounts}
        onEdit={(b) => { setEditingBus(b); setShowForm(true); }}
        onDelete={(b) => setDeleteTarget(b)}
      />
    </div>
  );
}