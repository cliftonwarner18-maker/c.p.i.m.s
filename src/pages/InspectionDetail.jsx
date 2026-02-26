import React, { useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Printer, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function InspectionDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const stickerRef = useRef();

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
      <WinWindow title="LOADING...">
        <div className="win-panel-inset p-4 text-center terminal-text">LOADING INSPECTION DATA...</div>
      </WinWindow>
    );
  }

  const printStickerOnly = () => {
    const stickerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inspection Sticker - Bus #${inspection.bus_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier Prime', 'Courier New', monospace;
            background: white;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 8px;
          }
          .sticker {
            border: 3px solid #000;
            padding: 10px;
            width: 3in;
            text-align: center;
            background: white;
            page-break-inside: avoid;
          }
          .sticker-header {
            font-size: 7pt;
            font-weight: bold;
            letter-spacing: 0.15em;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
            margin-bottom: 4px;
            text-transform: uppercase;
          }
          .sticker-title {
            font-size: 9pt;
            font-weight: bold;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .sticker-bus {
            font-size: 20pt;
            font-weight: bold;
            margin: 4px 0;
            letter-spacing: 0.05em;
          }
          .sticker-result {
            font-size: 16pt;
            font-weight: bold;
            padding: 4px 0;
            border: 2px solid #000;
            margin: 4px 0;
            letter-spacing: 0.1em;
          }
          .result-pass { color: #166534; background: #f0fdf4; }
          .result-fail { color: #991b1b; background: #fef2f2; }
          .result-conditional { color: #92400e; background: #fffbeb; }
          .sticker-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px;
            margin: 4px 0;
            text-align: left;
          }
          .sticker-field {
            font-size: 7.5pt;
            padding: 2px 0;
            border-bottom: 1px solid #ccc;
          }
          .sticker-field-label { font-weight: bold; font-size: 6.5pt; color: #555; display: block; }
          .sticker-field-value { font-size: 8pt; font-weight: bold; }
          .checklist {
            margin: 4px 0;
            text-align: left;
          }
          .check-item {
            font-size: 7pt;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dotted #ccc;
            padding: 1px 0;
          }
          .check-pass { color: #166534; font-weight: bold; }
          .check-fail { color: #991b1b; font-weight: bold; }
          .next-due {
            font-size: 9pt;
            font-weight: bold;
            border: 2px solid #000;
            padding: 3px;
            margin-top: 4px;
            text-transform: uppercase;
          }
          .sticker-footer {
            font-size: 6pt;
            border-top: 1px solid #000;
            padding-top: 3px;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #555;
          }
          @media print {
            @page { margin: 0.1in; size: 3in auto; }
            body { padding: 4px; }
          }
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

          <div class="sticker-result ${
            inspection.overall_status === 'Pass' ? 'result-pass' :
            inspection.overall_status === 'Fail' ? 'result-fail' : 'result-conditional'
          }">
            ★ ${inspection.overall_status?.toUpperCase()} ★
          </div>

          <div class="sticker-grid">
            <div class="sticker-field">
              <span class="sticker-field-label">INSP. NUMBER</span>
              <span class="sticker-field-value">${inspection.inspection_number}</span>
            </div>
            <div class="sticker-field">
              <span class="sticker-field-label">DATE INSPECTED</span>
              <span class="sticker-field-value">${moment(inspection.inspection_date || inspection.created_date).format('MM/DD/YYYY')}</span>
            </div>
            <div class="sticker-field">
              <span class="sticker-field-label">INSPECTOR</span>
              <span class="sticker-field-value">${inspection.inspector_name}</span>
            </div>
            <div class="sticker-field">
              <span class="sticker-field-label">CAMERA SYSTEM</span>
              <span class="sticker-field-value">${bus?.camera_system_type || 'N/A'}</span>
            </div>
            ${bus?.camera_serial_number ? `
            <div class="sticker-field">
              <span class="sticker-field-label">SERIAL #</span>
              <span class="sticker-field-value">${bus.camera_serial_number}</span>
            </div>` : ''}
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

          ${inspection.next_inspection_due ? `
          <div class="next-due">
            Next Inspection Due:<br>${moment(inspection.next_inspection_due).format('MM/DD/YYYY')}
          </div>` : ''}

          ${inspection.inspection_notes ? `<div style="font-size:6.5pt; margin-top:3px; text-align:left; color:#444; border-top:1px dotted #ccc; padding-top:3px;">NOTE: ${inspection.inspection_notes}</div>` : ''}

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

  const PassFail = ({ label, pass }) => (
    <div className="flex items-center justify-between text-[11px] py-1 border-b border-border">
      <span className="font-bold">{label}</span>
      <span className={`font-bold flex items-center gap-1 ${pass ? 'status-completed' : 'status-cancelled'}`}>
        {pass ? <><CheckCircle className="w-3 h-3" /> PASS</> : <><XCircle className="w-3 h-3" /> FAIL</>}
      </span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-2">
      <div className="flex gap-2 no-print">
        <Link to={createPageUrl('Inspections')} className="win-button flex items-center gap-1 text-[11px] no-underline text-foreground">
          <ArrowLeft className="w-3 h-3" /> BACK TO INSPECTIONS
        </Link>
        <button className="win-button flex items-center gap-1 text-[11px]" onClick={() => window.print()}>
          <Printer className="w-3 h-3" /> PRINT FULL REPORT
        </button>
        <button className="win-button flex items-center gap-1 text-[11px] !bg-primary !text-primary-foreground" onClick={printStickerOnly}>
          <Printer className="w-3 h-3" /> PRINT STICKER ONLY
        </button>
      </div>

      {/* Full Report */}
      <WinWindow title={`INSPECTION REPORT: ${inspection.inspection_number}`} icon="📋">
        <div className="win-panel-inset p-3 text-center mb-2">
          <div className="flex items-center justify-center gap-3 mb-1">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" className="w-10 h-10 object-contain" />
            <div>
              <div className="text-[10px] font-bold tracking-[0.2em]">NEW HANOVER COUNTY SCHOOLS</div>
              <div className="text-[13px] font-bold tracking-wider">MOBILE VEHICLE SURVEILLANCE INSPECTION REPORT</div>
              <div className="text-[11px]">OFFICIAL CAMERA SYSTEM CERTIFICATION</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] win-panel p-2 mb-2">
          <div><span className="font-bold">INSPECTION#:</span> {inspection.inspection_number}</div>
          <div><span className="font-bold">DATE:</span> {moment(inspection.inspection_date || inspection.created_date).format('MM/DD/YYYY HH:mm')}</div>
          <div><span className="font-bold">BUS#:</span> {inspection.bus_number}</div>
          <div><span className="font-bold">INSPECTOR:</span> {inspection.inspector_name}</div>
          {bus && <>
            <div><span className="font-bold">CAMERA:</span> {bus.camera_system_type}</div>
            <div><span className="font-bold">SERIAL#:</span> {bus.camera_serial_number || '—'}</div>
          </>}
        </div>

        <div className="win-panel p-2 mb-2">
          <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">
            ▸ INSPECTION RESULTS
          </div>
          <PassFail label="CAMERA SYSTEM FUNCTIONAL" pass={inspection.camera_system_functional} />
          <PassFail label="MOUNTING SECURE" pass={inspection.mounting_secure} />
          <PassFail label="DVR SYSTEM FUNCTIONAL" pass={inspection.dvr_functional} />
          <PassFail label="DATE/TIME ACCURACY" pass={inspection.date_time_accuracy} />
          <PassFail label="SIGNALS & LIGHTS" pass={inspection.signals_lights_functional} />
          <PassFail label="PROGRAMMING VERIFIED" pass={inspection.programming_verified} />
          <div className="flex items-center justify-between text-[11px] py-1 border-b border-border">
            <span className="font-bold">LENS CONDITION</span>
            <span className={`font-bold ${inspection.lenses_condition === 'Pass' ? 'status-completed' : 'status-cancelled'}`}>
              [{inspection.lenses_condition?.toUpperCase()}]
            </span>
          </div>
        </div>

        {/* Overall */}
        <div className={`p-3 text-center text-[14px] font-bold mb-2 ${
          inspection.overall_status === 'Pass' ? 'bg-primary/10 status-completed' : 
          inspection.overall_status === 'Fail' ? 'bg-destructive/10 status-cancelled' : 
          'bg-accent/20 status-pending'
        }`}>
          OVERALL INSPECTION RESULT: [{inspection.overall_status?.toUpperCase()}]
        </div>

        {inspection.inspection_notes && (
          <div className="win-panel p-2 mb-2">
            <div className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 mb-1">▸ NOTES</div>
            <div className="win-panel-inset p-2 text-[11px]">{inspection.inspection_notes}</div>
          </div>
        )}

        {inspection.next_inspection_due && (
          <div className="text-[11px] font-bold text-center">
            NEXT INSPECTION DUE: {moment(inspection.next_inspection_due).format('MM/DD/YYYY')}
          </div>
        )}
      </WinWindow>

      {/* Printable Inspection Sticker */}
      <WinWindow title="INSPECTION STICKER PREVIEW — MOBILE PRINTER OUTPUT" icon="🏷️">
        <div className="no-print text-[10px] text-muted-foreground mb-1 flex items-center gap-2">
          <Printer className="w-3 h-3" />
          STICKER PREVIEW — Click "PRINT STICKER ONLY" to send directly to mobile printer
        </div>
        {/* Sticker Preview */}
        <div className="flex justify-center py-2">
          <div className="border-4 border-foreground bg-white text-black font-mono" style={{ width: '3in', padding: '10px', fontSize: '10px' }}>
            <div className="flex items-center justify-center gap-2 border-b-2 border-black pb-1 mb-1 font-bold tracking-widest" style={{ fontSize: '7pt' }}>
              <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/3e93469f9_state.jpg" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              <div>STATE OF NORTH CAROLINA<br />DEPT. OF PUBLIC INSTRUCTION</div>
            </div>
            <div className="text-center font-bold tracking-wider mb-1" style={{ fontSize: '9pt' }}>
              CAMERA SURVEILLANCE INSPECTION
            </div>
            <div className="text-center font-bold my-1" style={{ fontSize: '20pt', letterSpacing: '0.05em' }}>
              BUS #{inspection.bus_number}
            </div>
            <div className={`text-center font-bold border-2 border-black py-1 my-1 tracking-widest ${
              inspection.overall_status === 'Pass' ? 'text-green-800 bg-green-50' :
              inspection.overall_status === 'Fail' ? 'text-red-800 bg-red-50' : 'text-yellow-800 bg-yellow-50'
            }`} style={{ fontSize: '14pt' }}>
              ★ {inspection.overall_status?.toUpperCase()} ★
            </div>
            <div className="grid grid-cols-2 gap-x-2 mb-1" style={{ fontSize: '7pt' }}>
              <div className="border-b border-gray-300 py-0.5">
                <div className="text-gray-500 font-bold" style={{ fontSize: '6pt' }}>INSP. NUMBER</div>
                <div className="font-bold">{inspection.inspection_number}</div>
              </div>
              <div className="border-b border-gray-300 py-0.5">
                <div className="text-gray-500 font-bold" style={{ fontSize: '6pt' }}>DATE INSPECTED</div>
                <div className="font-bold">{moment(inspection.inspection_date || inspection.created_date).format('MM/DD/YYYY')}</div>
              </div>
              <div className="border-b border-gray-300 py-0.5">
                <div className="text-gray-500 font-bold" style={{ fontSize: '6pt' }}>INSPECTOR</div>
                <div className="font-bold">{inspection.inspector_name}</div>
              </div>
              <div className="border-b border-gray-300 py-0.5">
                <div className="text-gray-500 font-bold" style={{ fontSize: '6pt' }}>CAMERA SYSTEM</div>
                <div className="font-bold">{bus?.camera_system_type || 'N/A'}</div>
              </div>
            </div>
            <div className="space-y-0" style={{ fontSize: '7pt' }}>
              {[
                ['Camera System', inspection.camera_system_functional],
                ['DVR Functional', inspection.dvr_functional],
                ['Mounting Secure', inspection.mounting_secure],
                ['Date/Time Accuracy', inspection.date_time_accuracy],
                ['Signals & Lights', inspection.signals_lights_functional],
                ['Programming', inspection.programming_verified],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b border-dotted border-gray-300 py-0.5">
                  <span>{label}</span>
                  <span className={val ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{val ? '✓ PASS' : '✗ FAIL'}</span>
                </div>
              ))}
              <div className="flex justify-between border-b border-dotted border-gray-300 py-0.5">
                <span>Lenses</span>
                <span className={inspection.lenses_condition === 'Pass' ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                  {inspection.lenses_condition?.toUpperCase()}
                </span>
              </div>
            </div>
            {inspection.next_inspection_due && (
              <div className="text-center font-bold border-2 border-black p-1 mt-1" style={{ fontSize: '9pt' }}>
                NEXT INSPECTION DUE:<br />{moment(inspection.next_inspection_due).format('MM/DD/YYYY')}
              </div>
            )}
            <div className="text-center border-t border-gray-400 mt-1 pt-1 text-gray-500" style={{ fontSize: '6pt', letterSpacing: '0.1em' }}>
              NC DPI — MOBILE VEHICLE SURVEILLANCE SYSTEM
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-2">
          <button className="win-button flex items-center gap-1 text-[12px] !bg-primary !text-primary-foreground" onClick={printStickerOnly}>
            <Printer className="w-4 h-4" /> PRINT STICKER — MOBILE PRINTER
          </button>
        </div>
      </WinWindow>
    </div>
  );
}