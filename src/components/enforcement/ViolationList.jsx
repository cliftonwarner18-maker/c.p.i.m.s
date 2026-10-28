import React from 'react';
import { format } from 'date-fns';
import { STATUS_COLORS } from './enforcementConstants';
import { printHP311 } from './printHP311';
import { printInternalRecord } from './printInternalRecord';

const fmt = (d) => (d ? format(new Date(d + 'T12:00:00'), 'MM/dd/yyyy') : '—');

export default function ViolationList({ rows, onOpen, onDelete }) {
  if (!rows.length) return <div className="p-6 text-center text-xs font-mono text-slate-600">NO CASES FOUND</div>;
  return (
    <div className="overflow-auto border border-slate-400 bg-white">
      <table className="w-full text-xs font-mono">
        <thead className="bg-slate-200 text-left">
          <tr>
            {['Case #', 'Date', 'Bus', 'School', 'Location', 'Plate', 'Assigned To', 'Court Date', 'Status', ''].map((h) => (
              <th key={h} className="px-2 py-1 border-b border-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-200 hover:bg-blue-50 cursor-pointer" onClick={() => onOpen(r)}>
              <td className="px-2 py-1 font-bold">{r.case_number}</td>
              <td className="px-2 py-1">{fmt(r.violation_date)}</td>
              <td className="px-2 py-1">{r.school_bus_number}</td>
              <td className="px-2 py-1">{r.school_name || '—'}</td>
              <td className="px-2 py-1">{[r.highway, r.county].filter(Boolean).join(', ') || '—'}</td>
              <td className="px-2 py-1">{r.license_plate ? `${r.license_plate} ${r.plate_state || ''}` : '—'}</td>
              <td className="px-2 py-1">{r.assigned_to || '—'}</td>
              <td className="px-2 py-1">{fmt(r.court_date)}</td>
              <td className="px-2 py-1">
                <span className="px-1.5 py-0.5 text-white font-bold whitespace-nowrap" style={{ background: STATUS_COLORS[r.status] || '#64748b' }}>{r.status}</span>
              </td>
              <td className="px-2 py-1">
                <button className="text-blue-800 font-bold mr-3" onClick={(e) => { e.stopPropagation(); printHP311(r); }}>PRINT HP-311</button>
                <button className="text-emerald-800 font-bold mr-3" onClick={(e) => { e.stopPropagation(); printInternalRecord(r); }}>INTERNAL RECORD</button>
                <button className="text-red-700 font-bold" onClick={(e) => { e.stopPropagation(); onDelete(r); }}>DELETE</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}