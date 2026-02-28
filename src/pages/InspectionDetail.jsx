import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { Printer, ArrowLeft, CheckCircle, XCircle, FileText } from 'lucide-react';

export default function InspectionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list(),
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: () => base44.entities.Bus.list(),
  });

  const inspection = inspections.find(i => i.id === id);
  const bus = inspection ? buses.find(b => b.bus_number === inspection.bus_number) : null;

  if (!inspection) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Courier Prime', monospace", fontSize: '13px', color: 'hsl(220,20%,40%)' }}>
        LOADING INSPECTION DATA...
      </div>
    );
  }

  const STATUS_MAP = {
    Pass: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
    Fail: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
    Conditional: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  };
  const sc = STATUS_MAP[inspection.overall_status] || { bg: '#f5f5f5', color: '#444', border: '#ddd' };

  // ── Sticker print (unchanged look) ──
  const printStickerOnly = () => {
    const stickerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inspection Sticker - Bus #${inspection.bus_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier Prime', 'Courier New', monospace; background: white; display: flex; justify-content: center; align-items: flex-start; padding: 8px; }
          .sticker { border: 3px solid #000; padding: 10px; width: 3in; text-align: center; background: white; page-break-inside: avoid; }
          .sticker-header { font-size: 7pt; font-weight: bold; letter-spacing: 0.15em; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 4px; text-transform: uppercase; }
          .sticker-title { font-size: 9pt; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 2px; }
          .sticker-bus { font-size: 20pt; font-weight: bold; margin: 4px 0; letter-spacing: 0.05em; }
          .sticker-result { font-size: 16pt; font-weight: bold; padding: 4px 0; border: 2px solid #000; margin: 4px 0; letter-spacing: 0.1em; }
          .result-pass { color: #166534; background: #f0fdf4; }
          .result-fail { color: #991b1b; background: #fef2f2; }
          .result-conditional { color: #92400e; background: #fffbeb; }
          .sticker-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin: 4px 0; text-align: left; }
          .sticker-field { font-size: 7.5pt; padding: 2px 0; border-bottom: 1px solid #ccc; }
          .sticker-field-label { font-weight: bold; font-size: 6.5pt; color: #555; display: block; }
          .sticker-field-value { font-size: 8pt; font-weight: bold; }
          .checklist { margin: 4px 0; text-align: left; }
          .check-item { font-size: 7pt; display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 1px 0; }
          .check-pass { color: #166534; font-weight: bold; }
          .check-fail { color: #991b1b; font-weight: bold; }
          .next-due { font-size: 9pt; font-weight: bold; border: 2px solid #000; padding: 3px; margin-top: 4px; text-transform: uppercase; }
          .sticker-footer { font-size: 6pt; border-top: 1px solid #000; padding-top: 3px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.1em; color: #555; }
          @media print { @page { margin: 0.1in; size: 3in auto; } body { padding: 4px; } }
        </style>
      </head>
      <body>
        <div class="sticker">
          <div class="sticker-header" style="display:flex;align-items:center;gap:6px;justify-content:center;">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style="width:28px;height:28px;object-fit:contain;" />
            <div>New Hanover County Schools</div>
          </div>
          <div class="sticker-title">Camera Surveillance Inspection</div>
          <div class="sticker-bus">BUS #${inspection.bus_number}</div>
          <div class="sticker-result ${inspection.overall_status === 'Pass' ? 'result-pass' : inspection.overall_status === 'Fail' ? 'result-fail' : 'result-conditional'}">
            ★ ${inspection.overall_status?.toUpperCase()} ★
          </div>
          <div class="sticker-grid">
            <div class="sticker-field"><span class="sticker-field-label">INSP. NUMBER</span><span class="sticker-field-value">${inspection.inspection_number}</span></div>
            <div class="sticker-field"><span class="sticker-field-label">DATE INSPECTED</span><span class="sticker-field-value">${moment(inspection.inspection_date || inspection.created_date).format('MM/DD/YYYY')}</span></div>
            <div class="sticker-field"><span class="sticker-field-label">INSPECTOR</span><span class="sticker-field-value">${inspection.inspector_name}</span></div>
            <div class="sticker-field"><span class="sticker-field-label">CAMERA SYSTEM</span><span class="sticker-field-value">${bus?.camera_system_type || 'N/A'}</span></div>
            ${bus?.camera_serial_number ? `<div class="sticker-field"><span class="sticker-field-label">SERIAL #</span><span class="sticker-field-value">${bus.camera_serial_number}</span></div>` : ''}
          </div>
          <div class="checklist">
            <div class="check-item"><span>Camera System</span><span class="${inspection.camera_system_functional ? 'check-pass' : 'check-fail'}">${inspection.camera_system_functional ? '✓ PASS' : '✗ FAIL'}</span></div>
            <div class="check-item"><span>DVR Functional</span><span class="${inspection.dvr_functional ? 'check-pass' : 'check-fail'}">${inspection.dvr_functional ? '✓ PASS' : '✗ FAIL'}</span></div>
            <div class="check-item"><span>Lenses</span><span class="${inspection.lenses_condition === 'Pass' ? 'check-pass' : 'check-fail'}">${inspection.lenses_condition?.toUpperCase()}</span></div>
            <div class="check-item"><span>Mounting Secure</span><span class="${inspection.mounting_secure ? 'check-pass' : 'check-fail'}">${inspection.mounting_secure ? '✓ PASS' : '✗ FAIL'}</span></div>
            <div class="check-item"><span>Date/Time Accuracy</span><span class="${inspection.date_time_accuracy ? 'check-pass' : 'check-fail'}">${inspection.date_time_accuracy ? '✓ PASS' : '✗ FAIL'}</span></div>
            <div class="check-item"><span>Signals & Lights</span><span class="${inspection.signals_lights_functional ? 'check-pass' : 'check-fail'}">${inspection.signals_lights_functional ? '✓ PASS' : '✗ FAIL'}</span></div>
            <div class="check-item"><span>Programming</span><span class="${inspection.programming_verified ? 'check-pass' : 'check-fail'}">${inspection.programming_verified ? '✓ PASS' : '✗ FAIL'}</span></div>
          </div>
          ${inspection.next_inspection_due ? `<div class="next-due">Next Inspection Due:<br>${moment(inspection.next_inspection_due).format('MM/DD/YYYY')}</div>` : ''}
          ${inspection.inspection_notes ? `<div style="font-size:6.5pt;margin-top:3px;text-align:left;color:#444;border-top:1px dotted #ccc;padding-top:3px;">NOTE: ${inspection.inspection_notes}</div>` : ''}
          <div class="sticker-footer">NHCS — Mobile Vehicle Surveillance System</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(stickerHTML);
    win.document.close();
  };

  const exportFullReport = async () => {
    const { data } = await base44.functions.invoke('exportInspectionReport', { inspectionId: inspection.id });
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspection-bus-${inspection.bus_number}-${moment().format('YYYYMMDD')}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const btnStyle = (primary) => ({
    display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
    background: primary ? 'hsl(220,55%,38%)' : 'hsl(220,18%,88%)',
    color: primary ? 'white' : 'hsl(220,20%,20%)',
    border: `1px solid ${primary ? 'hsl(220,55%,30%)' : 'hsl(220,18%,70%)'}`,
    borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace",
    fontWeight: '600', cursor: 'pointer', textDecoration: 'none', letterSpacing: '0.05em'
  });

  const PassFail = ({ label, pass }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid hsl(220,18%,88%)', fontSize: '11px', fontFamily: "'Courier Prime', monospace", background: pass ? '#fafffe' : '#fffafa' }}>
      <span style={{ fontWeight: '700' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: pass ? '#166534' : '#991b1b' }}>
        {pass ? <><CheckCircle style={{ width: 13, height: 13 }} /> PASS</> : <><XCircle style={{ width: 13, height: 13 }} /> FAIL</>}
      </span>
    </div>
  );

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', fontFamily: "'Courier Prime', monospace", display: 'flex', flexDirection: 'column', gap: '8px' }}>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} className="no-print">
        <Link to="/Inspections" style={btnStyle(false)}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> BACK TO INSPECTIONS
        </Link>
        <button style={btnStyle(false)} onClick={() => window.print()}>
          <Printer style={{ width: 13, height: 13 }} /> PRINT FULL REPORT
        </button>
        <button style={btnStyle(true)} onClick={printStickerOnly}>
          <Printer style={{ width: 13, height: 13 }} /> PRINT STICKER ONLY
        </button>
      </div>

      {/* Full Report */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
        {/* Report Header */}
        <div style={{ background: 'linear-gradient(to right, hsl(220,50%,28%), hsl(220,45%,38%))', padding: '14px', textAlign: 'center', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{ width: 40, height: 40, objectFit: 'contain' }} alt="NHCS" />
            <div>
              <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.2em', opacity: 0.9 }}>NEW HANOVER COUNTY SCHOOLS</div>
              <div style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.1em' }}>MOBILE VEHICLE SURVEILLANCE INSPECTION REPORT</div>
              <div style={{ fontSize: '11px', opacity: 0.85 }}>OFFICIAL CAMERA SYSTEM CERTIFICATION</div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0', borderBottom: '1px solid hsl(220,18%,82%)' }}>
          {[
            ['INSPECTION #', inspection.inspection_number],
            ['DATE', moment(inspection.inspection_date || inspection.created_date).format('MM/DD/YYYY HH:mm')],
            ['BUS #', inspection.bus_number],
            ['INSPECTOR', inspection.inspector_name],
            ['CAMERA SYSTEM', bus?.camera_system_type || '—'],
            ['SERIAL #', bus?.camera_serial_number || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '8px 12px', borderRight: '1px solid hsl(220,18%,88%)', background: 'hsl(220,18%,97%)' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: 'hsl(220,20%,50%)', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(220,20%,15%)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Checklist */}
        <div style={{ padding: '10px 12px' }}>
          <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '5px 8px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '6px' }}>▸ INSPECTION RESULTS</div>
          <div style={{ border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', overflow: 'hidden' }}>
            <PassFail label="CAMERA SYSTEM FUNCTIONAL" pass={inspection.camera_system_functional} />
            <PassFail label="MOUNTING SECURE" pass={inspection.mounting_secure} />
            <PassFail label="DVR SYSTEM FUNCTIONAL" pass={inspection.dvr_functional} />
            <PassFail label="DATE/TIME ACCURACY" pass={inspection.date_time_accuracy} />
            <PassFail label="SIGNALS & LIGHTS FUNCTIONAL" pass={inspection.signals_lights_functional} />
            <PassFail label="PROGRAMMING VERIFIED" pass={inspection.programming_verified} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
              <span style={{ fontWeight: '700' }}>LENS CONDITION</span>
              <span style={{ fontWeight: '700', color: inspection.lenses_condition === 'Pass' ? '#166534' : '#991b1b' }}>[{inspection.lenses_condition?.toUpperCase()}]</span>
            </div>
          </div>
        </div>

        {/* Overall Result */}
        <div style={{ margin: '0 12px 10px', padding: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '700', background: sc.bg, color: sc.color, border: `2px solid ${sc.border}`, borderRadius: '2px', letterSpacing: '0.08em' }}>
          OVERALL INSPECTION RESULT: [{inspection.overall_status?.toUpperCase()}]
        </div>

        {/* Notes */}
        {inspection.inspection_notes && (
          <div style={{ margin: '0 12px 10px' }}>
            <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '5px 8px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '4px' }}>▸ NOTES</div>
            <div style={{ background: 'hsl(220,15%,97%)', border: '1px solid hsl(220,18%,82%)', borderRadius: '2px', padding: '8px', fontSize: '11px' }}>{inspection.inspection_notes}</div>
          </div>
        )}

        {/* Next Due */}
        {inspection.next_inspection_due && (
          <div style={{ margin: '0 12px 12px', padding: '8px', textAlign: 'center', fontWeight: '700', fontSize: '12px', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', background: 'hsl(220,18%,96%)' }}>
            NEXT INSPECTION DUE: {moment(inspection.next_inspection_due).format('MM/DD/YYYY')}
          </div>
        )}
      </div>

      {/* Sticker Preview */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Printer style={{ width: 13, height: 13 }} />
          INSPECTION STICKER PREVIEW — MOBILE PRINTER OUTPUT
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'hsl(220,15%,95%)' }}>
          {/* The sticker itself — pure inline styles */}
          <div style={{ border: '4px solid #000', padding: '10px', width: '3in', background: 'white', fontFamily: "'Courier Prime', 'Courier New', monospace", color: '#000', fontSize: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '4px', fontWeight: 'bold', letterSpacing: '0.15em', fontSize: '7pt', textTransform: 'uppercase' }}>
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{ width: 28, height: 28, objectFit: 'contain' }} alt="NHCS" />
              <div>NEW HANOVER COUNTY SCHOOLS</div>
            </div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.1em', fontSize: '9pt', textTransform: 'uppercase', marginBottom: '2px' }}>CAMERA SURVEILLANCE INSPECTION</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20pt', letterSpacing: '0.05em', margin: '4px 0' }}>BUS #{inspection.bus_number}</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', padding: '4px 0', border: '2px solid #000', margin: '4px 0', letterSpacing: '0.1em', background: sc.bg, color: sc.color }}>
              ★ {inspection.overall_status?.toUpperCase()} ★
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', margin: '4px 0', textAlign: 'left' }}>
              {[
                ['INSP. NUMBER', inspection.inspection_number],
                ['DATE INSPECTED', moment(inspection.inspection_date || inspection.created_date).format('MM/DD/YYYY')],
                ['INSPECTOR', inspection.inspector_name],
                ['CAMERA SYSTEM', bus?.camera_system_type || 'N/A'],
              ].map(([label, val]) => (
                <div key={label} style={{ fontSize: '7.5pt', padding: '2px 0', borderBottom: '1px solid #ccc' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '6.5pt', color: '#555' }}>{label}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ margin: '4px 0', textAlign: 'left' }}>
              {[
                ['Camera System', inspection.camera_system_functional],
                ['DVR Functional', inspection.dvr_functional],
                ['Mounting Secure', inspection.mounting_secure],
                ['Date/Time Accuracy', inspection.date_time_accuracy],
                ['Signals & Lights', inspection.signals_lights_functional],
                ['Programming', inspection.programming_verified],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #ccc', padding: '1px 0', fontSize: '7pt' }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 'bold', color: val ? '#166534' : '#991b1b' }}>{val ? '✓ PASS' : '✗ FAIL'}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #ccc', padding: '1px 0', fontSize: '7pt' }}>
                <span>Lenses</span>
                <span style={{ fontWeight: 'bold', color: inspection.lenses_condition === 'Pass' ? '#166534' : '#991b1b' }}>{inspection.lenses_condition?.toUpperCase()}</span>
              </div>
            </div>
            {inspection.next_inspection_due && (
              <div style={{ textAlign: 'center', fontWeight: 'bold', border: '2px solid #000', padding: '3px', marginTop: '4px', fontSize: '9pt', textTransform: 'uppercase' }}>
                Next Inspection Due:<br />{moment(inspection.next_inspection_due).format('MM/DD/YYYY')}
              </div>
            )}
            <div style={{ textAlign: 'center', borderTop: '1px solid #aaa', marginTop: '4px', paddingTop: '3px', fontSize: '6pt', letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase' }}>
              NHCS — MOBILE VEHICLE SURVEILLANCE SYSTEM
            </div>
          </div>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'hsl(220,55%,38%)', color: 'white', border: '1px solid hsl(220,55%,30%)', borderRadius: '2px', fontSize: '12px', fontFamily: "'Courier Prime', monospace", fontWeight: '700', cursor: 'pointer', letterSpacing: '0.05em' }} onClick={printStickerOnly}>
            <Printer style={{ width: 15, height: 15 }} /> PRINT STICKER — MOBILE PRINTER
          </button>
        </div>
      </div>
    </div>
  );
}