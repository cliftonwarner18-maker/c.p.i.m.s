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
          <Printer className="w-3 h-3" /> PRINT REPORT
        </button>
      </div>

      {/* Full Report */}
      <WinWindow title={`INSPECTION REPORT: ${inspection.inspection_number}`} icon="📋">
        <div className="win-panel-inset p-3 text-center mb-2">
          <div className="text-[10px] font-bold tracking-[0.2em]">STATE OF NORTH CAROLINA — DEPT. OF PUBLIC INSTRUCTION</div>
          <div className="text-[13px] font-bold tracking-wider">MOBILE VEHICLE SURVEILLANCE INSPECTION REPORT</div>
          <div className="text-[11px]">OFFICIAL CAMERA SYSTEM CERTIFICATION</div>
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
      <WinWindow title="PRINTABLE INSPECTION STICKER (MOBILE PRINTER)" icon="🏷️">
        <div className="no-print text-[10px] text-muted-foreground mb-1">
          Use your browser print function to print this sticker for the bus.
        </div>
        <div ref={stickerRef} className="border-2 border-foreground p-3 max-w-sm mx-auto text-center bg-card">
          <div className="text-[8px] font-bold tracking-[0.15em] border-b border-foreground pb-1 mb-1">
            STATE OF NORTH CAROLINA — DPI
          </div>
          <div className="text-[11px] font-bold tracking-wider">
            SURVEILLANCE INSPECTION
          </div>
          <div className="text-[16px] font-bold terminal-text my-1">
            BUS #{inspection.bus_number}
          </div>
          <div className={`text-[14px] font-bold py-1 ${
            inspection.overall_status === 'Pass' ? 'status-completed' : 'status-cancelled'
          }`}>
            ★ {inspection.overall_status?.toUpperCase()} ★
          </div>
          <div className="text-[9px] space-y-0.5 mt-1">
            <div>INSP#: {inspection.inspection_number}</div>
            <div>DATE: {moment(inspection.inspection_date || inspection.created_date).format('MM/DD/YYYY')}</div>
            <div>INSPECTOR: {inspection.inspector_name}</div>
            {inspection.next_inspection_due && (
              <div className="font-bold border-t border-foreground pt-1 mt-1">
                NEXT DUE: {moment(inspection.next_inspection_due).format('MM/DD/YYYY')}
              </div>
            )}
          </div>
          <div className="text-[7px] mt-1 border-t border-foreground pt-1">
            NC DPI — MOBILE VEHICLE SURVEILLANCE SYSTEM
          </div>
        </div>
      </WinWindow>
    </div>
  );
}