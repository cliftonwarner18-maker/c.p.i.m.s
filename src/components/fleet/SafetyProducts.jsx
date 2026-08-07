import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, FileDown, Search, Lock, Unlock } from 'lucide-react';

const num = (v) => Number(v) || 0;

export default function SafetyProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [locked, setLocked] = useState(true);
  const [lotFilter, setLotFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const { data: buses = [], isLoading } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list('bus_number'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bus.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['buses'] }),
  });

  const toggle = (bus, field) => {
    if (locked) return;
    updateMutation.mutate({ id: bus.id, data: { [field]: !bus[field] } });
  };

  // Only active fleet (exclude Sold/Retired) for the report, with lot/type filters applied
  const reportBuses = useMemo(
    () => buses.filter(b => b.base_location !== 'Sold' && b.status !== 'Retired'
      && (lotFilter === 'All' || b.base_location === lotFilter)
      && (typeFilter === 'All' || b.bus_type === typeFilter)),
    [buses, lotFilter, typeFilter]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reportBuses.filter(b => !q || b.bus_number?.toLowerCase().includes(q) || b.make?.toLowerCase().includes(q) || b.model?.toLowerCase().includes(q));
  }, [reportBuses, search]);

  // --- Report calculations ---
  const illuminatedStopArms = reportBuses.filter(b => b.illuminated_stop_arms).length;
  const illuminatedSignage = reportBuses.filter(b => b.illuminated_school_bus_signage).length;

  const interiorCamBuses = reportBuses.filter(b => b.camera_system_type && b.camera_system_type !== 'None');
  const interiorCamCount = interiorCamBuses.length;
  const recordToCloud = interiorCamBuses.filter(b => b.dvr_records_to_cloud).length;
  const recordToHardDrive = interiorCamCount - recordToCloud; // DVRs not marked as cloud record to H-Drive

  const oneCam = interiorCamBuses.filter(b => num(b.cameras_inside) === 1).length;
  const twoCam = interiorCamBuses.filter(b => num(b.cameras_inside) === 2).length;
  const threeOrFewerCam = interiorCamBuses.filter(b => num(b.cameras_inside) >= 1 && num(b.cameras_inside) <= 3).length;
  const fourPlusCam = interiorCamBuses.filter(b => num(b.cameras_inside) >= 4).length;

  const vendorCounts = {};
  interiorCamBuses.forEach(b => {
    const v = b.camera_system_type;
    if (v && v !== 'None') vendorCounts[v] = (vendorCounts[v] || 0) + 1;
  });
  const rankedVendors = Object.entries(vendorCounts).sort((a, b) => b[1] - a[1]);
  const primaryVendor = rankedVendors[0]?.[0] || '—';
  const secondaryVendor = rankedVendors[1]?.[0] || '—';

  const stopArmCamBuses = reportBuses.filter(b => b.stop_arm_cameras);
  const stopArmCamCount = stopArmCamBuses.length;
  const stopVendorCounts = {};
  stopArmCamBuses.forEach(b => {
    const v = b.camera_system_type;
    if (v && v !== 'None') stopVendorCounts[v] = (stopVendorCounts[v] || 0) + 1;
  });
  const rankedStopVendors = Object.entries(stopVendorCounts).sort((a, b) => b[1] - a[1]);
  const primaryStopVendor = rankedStopVendors[0]?.[0] || '—';
  const secondaryStopVendor = rankedStopVendors[1]?.[0] || '—';

  const aiCamCount = reportBuses.filter(b => b.ai_cameras_installed).length;

  const handleExport = () => {
    const w = window.open('', '_blank');
    const rows = [
      ['2. How many illuminated stop arms?', illuminatedStopArms],
      ['2b. How many illuminated school bus signs?', illuminatedSignage],
      ['3. How many interior digital camera systems?', interiorCamCount],
      ['3a. How many record to hard drive?', recordToHardDrive],
      ['3b. How many record to cloud?', recordToCloud],
      ['4a. How many have one camera?', oneCam],
      ['4b. How many have two cameras?', twoCam],
      ['4c. How many have three or fewer inside cameras?', threeOrFewerCam],
      ['4d. How many have four or more cameras?', fourPlusCam],
      ['4e. Primary camera vendor', primaryVendor],
      ['4f. Secondary camera vendor', secondaryVendor],
      ['5. How many buses have exterior stop arm cameras?', stopArmCamCount],
      ['5a. Primary stop arm camera vendor', primaryStopVendor],
      ['5b. Secondary stop arm camera vendor', secondaryStopVendor],
      ['AI Dash cam installed "Samsara" (buses)', aiCamCount],
    ];
    w.document.write(`<html><head><title>Safety Products Report</title><style>body{font-family:Arial;padding:24px}h1{font-size:16px}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #999;padding:6px 10px;font-size:12px;text-align:left}th{background:#e8e8e8}.num{text-align:center;font-weight:bold}</style></head><body><h1>NHCS Transportation — Safety Products Report</h1><div style="font-size:11px;color:#555">Generated ${new Date().toLocaleString()} — Active fleet: ${reportBuses.length} buses</div><table><tr><th>Question</th><th>Value</th></tr>${rows.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td></tr>`).join('')}</table></body></html>`);
    w.document.close();
    w.print();
  };

  const labelStyle = { fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,25%)', letterSpacing: '0.04em' };
  const qStyle = { fontSize: '11px', color: 'hsl(220,15%,30%)', padding: '5px 0', borderBottom: '1px solid hsl(220,18%,88%)' };
  const valStyle = { fontSize: '13px', fontWeight: '700', color: 'hsl(220,70%,35%)', textAlign: 'right', padding: '5px 0', borderBottom: '1px solid hsl(220,18%,88%)' };
  const subStyle = { fontSize: '10px', color: 'hsl(220,10%,45%)', padding: '3px 0 3px 16px', borderBottom: '1px solid hsl(220,18%,92%)' };
  const subValStyle = { fontSize: '11px', fontWeight: '600', color: 'hsl(220,30%,40%)', textAlign: 'right', padding: '3px 0', borderBottom: '1px solid hsl(220,18%,92%)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: "'Courier Prime', monospace" }}>
      {isLoading && <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px' }}>LOADING SAFETY DATA...</div>}

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(282,55%,32%), hsl(282,50%,42%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>SAFETY PRODUCTS</div>
            <div style={{ fontSize: '10px', opacity: 0.85, letterSpacing: '0.05em' }}>FLEET SAFETY EQUIPMENT REPORTING — {reportBuses.length} ACTIVE VEHICLES</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button onClick={() => setLocked(l => !l)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: locked ? 'hsl(45,85%,45%)' : 'hsl(140,55%,38%)', color: locked ? 'hsl(220,20%,10%)' : 'white', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '2px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.05em' }}>
            {locked ? <Lock style={{ width: 13, height: 13 }} /> : <Unlock style={{ width: 13, height: 13 }} />}
            {locked ? 'UNLOCK TO EDIT' : 'EDITING ENABLED'}
          </button>
          <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '2px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.05em' }}>
            <FileDown style={{ width: 13, height: 13 }} /> EXPORT REPORT
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>LOT:</span>
          {['All', 'Main', 'North'].map(l => (
            <button key={l} onClick={() => setLotFilter(l)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: lotFilter === l ? '700' : '500', background: lotFilter === l ? 'hsl(282,55%,40%)' : 'white', color: lotFilter === l ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${lotFilter === l ? 'hsl(282,55%,40%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer' }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>TYPE:</span>
          {['All', 'School Bus', 'Activity Bus'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: typeFilter === t ? '700' : '500', background: typeFilter === t ? 'hsl(282,55%,40%)' : 'white', color: typeFilter === t ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${typeFilter === t ? 'hsl(282,55%,40%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer' }}>
              {t === 'All' ? 'ALL' : t === 'School Bus' ? 'SCHOOL' : 'ACTIVITY'}
            </button>
          ))}
        </div>
        {(lotFilter !== 'All' || typeFilter !== 'All') && (
          <button onClick={() => { setLotFilter('All'); setTypeFilter('All'); }} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', background: 'white', color: 'hsl(0,60%,40%)', border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', cursor: 'pointer' }}>
            ✕ CLEAR
          </button>
        )}
      </div>

      {/* Auto-generated report */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px' }}>
        <div style={{ background: 'hsl(220,70%,35%)', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em' }}>▸ FLEET SAFETY REPORT (AUTO-GENERATED)</div>
        <div style={{ padding: '10px 14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={qStyle}>2. How many illuminated stop arms?</td><td style={valStyle}>{illuminatedStopArms}</td></tr>
              <tr><td style={qStyle}>2b. How many illuminated school bus signs?</td><td style={valStyle}>{illuminatedSignage}</td></tr>
              <tr><td style={qStyle}>3. How many interior digital camera systems?</td><td style={valStyle}>{interiorCamCount}</td></tr>
              <tr><td style={subStyle}>a. How many record to hard drive?</td><td style={subValStyle}>{recordToHardDrive}</td></tr>
              <tr><td style={subStyle}>b. How many record to cloud?</td><td style={subValStyle}>{recordToCloud}</td></tr>
              <tr><td style={qStyle}>4. For the interior camera systems detailed above:</td><td style={valStyle}></td></tr>
              <tr><td style={subStyle}>a. How many have one camera?</td><td style={subValStyle}>{oneCam}</td></tr>
              <tr><td style={subStyle}>b. How many have two cameras?</td><td style={subValStyle}>{twoCam}</td></tr>
              <tr><td style={subStyle}>c. How many have three or fewer inside cameras?</td><td style={subValStyle}>{threeOrFewerCam}</td></tr>
              <tr><td style={subStyle}>d. How many have four or more cameras?</td><td style={subValStyle}>{fourPlusCam}</td></tr>
              <tr><td style={subStyle}>e. Primary camera vendor?</td><td style={subValStyle}>{primaryVendor}</td></tr>
              <tr><td style={subStyle}>f. Secondary camera vendor?</td><td style={subValStyle}>{secondaryVendor}</td></tr>
              <tr><td style={qStyle}>5. How many buses have exterior stop arm cameras?</td><td style={valStyle}>{stopArmCamCount}</td></tr>
              <tr><td style={subStyle}>a. Primary stop arm camera vendor?</td><td style={subValStyle}>{primaryStopVendor}</td></tr>
              <tr><td style={subStyle}>b. Secondary stop arm camera vendor?</td><td style={subValStyle}>{secondaryStopVendor}</td></tr>
              <tr><td style={qStyle}>AI Dash cam installed "Samsara" (buses)</td><td style={valStyle}>{aiCamCount}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-bus safety editor */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px' }}>
        <div style={{ background: 'hsl(220,70%,35%)', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>▸ PER-VEHICLE SAFETY EQUIPMENT</span>
          <span style={{ fontSize: '9px', opacity: 0.85 }}>{locked ? '🔒 LOCKED — click UNLOCK to edit' : '✏️ EDITING — toggles save automatically'}</span>
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Search style={{ width: 13, height: 13, color: 'hsl(220,20%,45%)' }} />
          <input placeholder="Search bus #, make, model..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '4px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', width: '260px', outline: 'none' }} />
          <span style={{ fontSize: '10px', color: 'hsl(220,10%,45%)' }}>Showing {filtered.length} of {reportBuses.length}</span>
        </div>
        <div style={{ maxHeight: '440px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'hsl(220,18%,94%)', zIndex: 2 }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>BUS #</th>
                <th style={{ textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>MAKE/MODEL</th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>ILLUM. STOP ARM</th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>ILLUM. SIGN</th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>STOP ARM CAM</th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>AI DASH CAM</th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>DVR CLOUD</th>
                <th style={{ textAlign: 'center', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>INT. CAMS</th>
                <th style={{ textAlign: 'left', padding: '5px 8px', borderBottom: '1px solid hsl(220,18%,78%)' }}>CAMERA SYSTEM</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid hsl(220,18%,92%)', opacity: locked ? 1 : 1, cursor: locked ? 'default' : 'pointer' }}>
                  <td style={{ padding: '4px 8px', fontWeight: '700' }}>{b.bus_number}</td>
                  <td style={{ padding: '4px 8px', color: 'hsl(220,10%,40%)' }}>{[b.make, b.model].filter(Boolean).join(' ') || '—'}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!b.illuminated_stop_arms} onChange={() => toggle(b, 'illuminated_stop_arms')} disabled={locked} style={{ accentColor: 'hsl(282,55%,40%)', cursor: locked ? 'not-allowed' : 'pointer' }} />
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!b.illuminated_school_bus_signage} onChange={() => toggle(b, 'illuminated_school_bus_signage')} disabled={locked} style={{ accentColor: 'hsl(282,55%,40%)', cursor: locked ? 'not-allowed' : 'pointer' }} />
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!b.stop_arm_cameras} onChange={() => toggle(b, 'stop_arm_cameras')} disabled={locked} style={{ accentColor: 'hsl(282,55%,40%)', cursor: locked ? 'not-allowed' : 'pointer' }} />
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!b.ai_cameras_installed} onChange={() => toggle(b, 'ai_cameras_installed')} disabled={locked} style={{ accentColor: 'hsl(282,55%,40%)', cursor: locked ? 'not-allowed' : 'pointer' }} />
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!b.dvr_records_to_cloud} onChange={() => toggle(b, 'dvr_records_to_cloud')} disabled={locked} style={{ accentColor: 'hsl(200,70%,45%)', cursor: locked ? 'not-allowed' : 'pointer' }} />
                  </td>
                  <td style={{ padding: '4px 8px', textAlign: 'center', color: 'hsl(220,30%,40%)' }}>{num(b.cameras_inside)}</td>
                  <td style={{ padding: '4px 8px', color: 'hsl(220,10%,40%)', fontSize: '10px' }}>{b.camera_system_type || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}