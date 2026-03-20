import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { exportFleetPDF, exportFleetMakeSummaryPDF } from '../utils/exports/exportFleet';
import BusForm from '../components/fleet/BusForm';
import FleetTable from '../components/fleet/FleetTable.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Plus, FileDown, Search, Bus, MapPin, Filter, AlertTriangle } from 'lucide-react';

export default function FleetManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [stopArmFilter, setStopArmFilter] = useState(false);
  const [aiCamFilter, setAiCamFilter] = useState(false);
  const [cameraFilter, setCameraFilter] = useState('All');
  const [makeFilter, setMakeFilter] = useState('All');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingFiltered, setIsExportingFiltered] = useState(false);
  const [isExportingMakeSummary, setIsExportingMakeSummary] = useState(false);
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

  const vinCounts = buses.reduce((acc, b) => {
    const key = b.vin?.trim().toUpperCase();
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const duplicateVinCount = Object.values(vinCounts).filter(c => c > 1).length;

  // Derive unique makes from all buses
  const allMakes = ['All', ...Array.from(new Set(buses.map(b => b.make).filter(Boolean))).sort()];

  const filtered = buses.filter(b => {
    const matchSearch = !search ||
      b.bus_number?.toLowerCase().includes(search.toLowerCase()) ||
      b.vin?.toLowerCase().includes(search.toLowerCase()) ||
      b.make?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || b.bus_type === typeFilter;
    const matchLocation = locationFilter === 'All' || b.base_location === locationFilter;
    const matchStopArm = !stopArmFilter || b.stop_arm_cameras === true;
    const matchAiCam = !aiCamFilter || b.ai_cameras_installed === true;
    const matchCamera = cameraFilter === 'All' || b.camera_system_type === cameraFilter;
    const matchMake = makeFilter === 'All' || b.make === makeFilter;
    return matchSearch && matchType && matchLocation && matchStopArm && matchAiCam && matchCamera && matchMake;
  });

  const activeCount = buses.filter(b => b.status === 'Active').length;
  const oosCount = buses.filter(b => b.status === 'Out of Service').length;
  const seonCount = buses.filter(b => b.camera_system_type === 'Seon').length;
  const svCount = buses.filter(b => b.camera_system_type === 'Safety Vision').length;
  const overdueCount = buses.filter(b => b.next_inspection_due && new Date(b.next_inspection_due) < new Date()).length;

  const buildPDF = (busList, filename) => {
    const sanitize = (str) => {
      if (!str) return '-';
      return String(str).replace(/[^\x20-\x7E]/g, '').trim() || '-';
    };
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let y = 10;

    doc.setFontSize(16);
    doc.text('FLEET INVENTORY REPORT', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.text(`Report Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Vehicles in Report: ${busList.length}`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    const headers = ['Bus #', 'Type', 'Location', 'Year', 'Make/Model', 'Status', 'Cam System', 'In', 'Out', 'Total', 'Stop Arm'];
    const colWidths = [14, 18, 16, 12, 30, 18, 20, 8, 8, 10, 18];
    let x = 8;
    headers.forEach((h, i) => { doc.text(h, x, y); x += colWidths[i]; });
    y += 2;
    doc.setDrawColor(100, 100, 100);
    doc.line(8, y, pageWidth - 8, y);
    y += 5;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    busList.forEach(bus => {
      if (y > pageHeight - 15) { doc.addPage(); y = 10; }
      const inside = bus.cameras_inside != null ? String(bus.cameras_inside) : '-';
      const outside = bus.cameras_outside != null ? String(bus.cameras_outside) : '-';
      const total = (bus.cameras_inside != null || bus.cameras_outside != null)
        ? String((bus.cameras_inside || 0) + (bus.cameras_outside || 0)) : '-';
      x = 8;
      doc.text(sanitize(bus.bus_number), x, y); x += colWidths[0];
      doc.text(sanitize(bus.bus_type).substring(0, 12), x, y); x += colWidths[1];
      doc.text(sanitize(bus.base_location), x, y); x += colWidths[2];
      doc.text(sanitize(bus.year), x, y); x += colWidths[3];
      doc.text(`${sanitize(bus.make)} ${sanitize(bus.model) === '-' ? '' : sanitize(bus.model)}`.trim().substring(0, 22), x, y); x += colWidths[4];
      doc.text(sanitize(bus.status), x, y); x += colWidths[5];
      doc.text(sanitize(bus.camera_system_type).substring(0, 14), x, y); x += colWidths[6];
      doc.text(inside, x, y); x += colWidths[7];
      doc.text(outside, x, y); x += colWidths[8];
      doc.text(total, x, y); x += colWidths[9];
      doc.text(bus.stop_arm_cameras ? 'YES' : 'NO', x, y);
      y += 5.5;
    });
    y += 8;
    doc.setFontSize(8);
    doc.text(`Total Vehicles: ${busList.length}`, 8, y);
    doc.save(filename);
  };

  const handleExportMakeSummaryPDF = () => {
    setIsExportingMakeSummary(true);
    try {
      const { jsPDF: JsPDF } = { jsPDF };
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let y = 14;

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('FLEET MAKE / BRAND SUMMARY REPORT', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
      doc.text(`Total Fleet Size: ${buses.length} vehicles`, pageWidth / 2, y, { align: 'center' });
      y += 10;

      // Build make counts grouped
      const makeGroups = {};
      buses.forEach(b => {
        const make = b.make?.trim() || 'Unknown';
        if (!makeGroups[make]) makeGroups[make] = { total: 0, active: 0, oos: 0, retired: 0, school: 0, activity: 0 };
        makeGroups[make].total++;
        if (b.status === 'Active') makeGroups[make].active++;
        else if (b.status === 'Out of Service') makeGroups[make].oos++;
        else if (b.status === 'Retired') makeGroups[make].retired++;
        if (b.bus_type === 'School Bus') makeGroups[make].school++;
        else if (b.bus_type === 'Activity Bus') makeGroups[make].activity++;
      });

      const sorted = Object.entries(makeGroups).sort((a, b) => b[1].total - a[1].total);

      // Table header
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(34, 62, 115);
      doc.setTextColor(255, 255, 255);
      doc.rect(8, y, pageWidth - 16, 7, 'F');
      const cols = [8, 55, 80, 105, 130, 155, 180];
      ['MAKE / BRAND', 'TOTAL', 'ACTIVE', 'OUT OF SVC', 'RETIRED', 'SCHOOL', 'ACTIVITY'].forEach((h, i) => {
        doc.text(h, cols[i] + 2, y + 5);
      });
      y += 9;
      doc.setTextColor(0, 0, 0);

      let rowIndex = 0;
      sorted.forEach(([make, counts]) => {
        if (y > 270) { doc.addPage(); y = 14; }
        if (rowIndex % 2 === 0) {
          doc.setFillColor(240, 243, 250);
          doc.rect(8, y - 1, pageWidth - 16, 7, 'F');
        }
        doc.setFont(undefined, rowIndex === 0 ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.text(make, cols[0] + 2, y + 4);
        doc.text(String(counts.total), cols[1] + 2, y + 4);
        doc.text(String(counts.active), cols[2] + 2, y + 4);
        doc.text(String(counts.oos), cols[3] + 2, y + 4);
        doc.text(String(counts.retired), cols[4] + 2, y + 4);
        doc.text(String(counts.school), cols[5] + 2, y + 4);
        doc.text(String(counts.activity), cols[6] + 2, y + 4);
        y += 8;
        rowIndex++;
      });

      // Totals row
      y += 2;
      doc.setFillColor(34, 62, 115);
      doc.setTextColor(255, 255, 255);
      doc.rect(8, y - 1, pageWidth - 16, 8, 'F');
      doc.setFont(undefined, 'bold');
      doc.text('TOTAL', cols[0] + 2, y + 5);
      doc.text(String(buses.length), cols[1] + 2, y + 5);
      doc.text(String(buses.filter(b => b.status === 'Active').length), cols[2] + 2, y + 5);
      doc.text(String(buses.filter(b => b.status === 'Out of Service').length), cols[3] + 2, y + 5);
      doc.text(String(buses.filter(b => b.status === 'Retired').length), cols[4] + 2, y + 5);
      doc.text(String(buses.filter(b => b.bus_type === 'School Bus').length), cols[5] + 2, y + 5);
      doc.text(String(buses.filter(b => b.bus_type === 'Activity Bus').length), cols[6] + 2, y + 5);

      doc.setTextColor(0, 0, 0);
      doc.save('fleet-make-summary.pdf');
    } finally {
      setIsExportingMakeSummary(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      buildPDF(buses, 'fleet-entire.pdf');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportFilteredPDF = () => {
    setIsExportingFiltered(true);
    try {
      buildPDF(filtered, 'fleet-filtered.pdf');
    } finally {
      setIsExportingFiltered(false);
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
          <button onClick={() => { setEditingBus(null); setShowForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: 'pointer', letterSpacing: '0.05em' }}>
            <Plus style={{ width: 13, height: 13 }} /> ADD VEHICLE
          </button>
          <button onClick={handleExportFilteredPDF} disabled={isExportingFiltered} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'hsl(45,85%,45%)', color: 'hsl(220,20%,10%)', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '700', cursor: isExportingFiltered ? 'default' : 'pointer', letterSpacing: '0.05em' }}>
            <FileDown style={{ width: 13, height: 13 }} /> {isExportingFiltered ? 'EXPORTING...' : `FILTERED PDF (${filtered.length})`}
          </button>
          <button onClick={handleExportMakeSummaryPDF} disabled={isExportingMakeSummary} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'hsl(200,75%,40%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: isExportingMakeSummary ? 'default' : 'pointer', letterSpacing: '0.05em' }}>
            <FileDown style={{ width: 13, height: 13 }} /> {isExportingMakeSummary ? 'EXPORTING...' : 'MAKE SUMMARY PDF'}
          </button>
          <button onClick={handleExportPDF} disabled={isExporting} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: isExporting ? 'default' : 'pointer', letterSpacing: '0.05em' }}>
            <FileDown style={{ width: 13, height: 13 }} /> {isExporting ? 'EXPORTING...' : 'ENTIRE FLEET PDF'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <div style={statBoxStyle('hsl(140,55%,40%)')}><div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(140,55%,35%)', lineHeight: 1 }}>{activeCount}</div><div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>ACTIVE</div></div>
        <div style={statBoxStyle('hsl(0,65%,50%)')}><div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(0,65%,45%)', lineHeight: 1 }}>{oosCount}</div><div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>OUT OF SERVICE</div></div>
        <div style={statBoxStyle('hsl(220,65%,45%)')}><div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(220,65%,40%)', lineHeight: 1 }}>{seonCount}</div><div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>SEON DVR</div></div>
        <div style={statBoxStyle('hsl(200,75%,42%)')}><div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(200,75%,38%)', lineHeight: 1 }}>{svCount}</div><div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>SAFETY VISION</div></div>
        <div style={statBoxStyle('hsl(30,85%,45%)')}><div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(30,85%,40%)', lineHeight: 1 }}>{overdueCount}</div><div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>INSP. OVERDUE</div></div>
        <div style={statBoxStyle('hsl(220,20%,55%)')}><div style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(220,20%,35%)', lineHeight: 1 }}>{filtered.length}</div><div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>SHOWING</div></div>
      </div>

      {/* Filters & Search */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Filter style={{ width: 12, height: 12, color: 'hsl(220,30%,45%)' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>TYPE:</span>
          {['All', 'School Bus', 'Activity Bus'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: typeFilter === t ? '700' : '500', background: typeFilter === t ? 'hsl(220,55%,38%)' : 'white', color: typeFilter === t ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${typeFilter === t ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer' }}>
              {t === 'All' ? 'ALL' : t === 'School Bus' ? 'SCHOOL' : 'ACTIVITY'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <MapPin style={{ width: 12, height: 12, color: 'hsl(220,30%,45%)' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>LOCATION:</span>
          {['All', 'Main', 'North', 'Sold'].map(l => (
            <button key={l} onClick={() => setLocationFilter(l)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: locationFilter === l ? '700' : '500', background: locationFilter === l ? 'hsl(220,55%,38%)' : 'white', color: locationFilter === l ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${locationFilter === l ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer' }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>MAKE:</span>
          <select value={makeFilter} onChange={e => setMakeFilter(e.target.value)} style={{ padding: '3px 6px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: '500', background: makeFilter !== 'All' ? 'hsl(220,55%,38%)' : 'white', color: makeFilter !== 'All' ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${makeFilter !== 'All' ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer' }}>
            {allMakes.map(m => <option key={m} value={m}>{m === 'All' ? 'ALL MAKES' : m.toUpperCase()}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>DVR:</span>
          {['All', 'Seon', 'Safety Vision', 'REI', 'Fortress', 'None'].map(c => (
            <button key={c} onClick={() => setCameraFilter(c)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: cameraFilter === c ? '700' : '500', background: cameraFilter === c ? 'hsl(220,55%,38%)' : 'white', color: cameraFilter === c ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${cameraFilter === c ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer' }}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', userSelect: 'none', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={stopArmFilter} onChange={e => setStopArmFilter(e.target.checked)} style={{ accentColor: 'hsl(220,70%,35%)', cursor: 'pointer' }} />
            STOP ARM ONLY
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', userSelect: 'none', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={aiCamFilter} onChange={e => setAiCamFilter(e.target.checked)} style={{ accentColor: 'hsl(220,70%,35%)', cursor: 'pointer' }} />
            AI CAMS ONLY
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
          <Search style={{ width: 12, height: 12, color: 'hsl(220,20%,45%)' }} />
          <input placeholder="Search bus #, make, VIN..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '4px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', width: '200px', outline: 'none' }} />
        </div>
      </div>

      {/* Duplicate VIN Banner */}
      {duplicateVinCount > 0 && (
        <div style={{ background: 'hsl(0,80%,95%)', border: '2px solid hsl(0,65%,50%)', borderRadius: '2px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Courier Prime', monospace" }}>
          <AlertTriangle style={{ width: 16, height: 16, color: 'hsl(0,65%,45%)', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(0,65%,35%)', letterSpacing: '0.06em' }}>⚠ DUPLICATE VIN DETECTED — </span>
            <span style={{ fontSize: '11px', color: 'hsl(0,55%,40%)' }}>{duplicateVinCount} VIN number{duplicateVinCount !== 1 ? 's are' : ' is'} shared by multiple vehicles. Rows flagged below.</span>
          </div>
        </div>
      )}

      {/* Table */}
      <FleetTable
        buses={filtered}
        busNumCounts={busNumCounts}
        vinCounts={vinCounts}
        onEdit={(b) => { setEditingBus(b); setShowForm(true); }}
        onDelete={(b) => setDeleteTarget(b)}
      />
    </div>
  );
}