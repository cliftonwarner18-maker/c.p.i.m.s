import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { buildStats, printReport, exportCsv } from './reportUtils';
import { TextField } from './Field';

const Stat = ({ label, value }) => (
  <div className="border border-slate-400 bg-white px-3 py-2">
    <div className="text-[10px] font-bold uppercase text-slate-600">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
);

const RankTable = ({ title, data }) => (
  <div className="border border-slate-400 bg-white">
    <div className="bg-slate-700 text-white text-[11px] font-bold px-2 py-1 uppercase">{title}</div>
    <table className="w-full text-xs font-mono">
      <tbody>
        {data.slice(0, 10).map((d) => (
          <tr key={d.name} className="border-b border-slate-200"><td className="px-2 py-0.5">{d.name}</td><td className="px-2 py-0.5 text-right font-bold">{d.count}</td></tr>
        ))}
        {!data.length && <tr><td className="px-2 py-1 text-slate-500">No data</td></tr>}
      </tbody>
    </table>
  </div>
);

export default function EnforcementReports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['stopArmViolations', 'report', from, to],
    queryFn: async () => {
      const q = {};
      if (from || to) q.violation_date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
      const page = await base44.entities.StopArmViolation.filter(q, { sort: '-violation_date', limit: 2000 });
      return page.items;
    },
  });

  const stats = useMemo(() => buildStats(rows), [rows]);
  const rangeLabel = from || to ? `${from || 'start'} to ${to || 'present'}` : 'All dates';

  return (
    <div className="space-y-3 font-mono">
      <div className="flex flex-wrap items-end gap-2">
        <TextField label="From" type="date" value={from} onChange={setFrom} />
        <TextField label="To" type="date" value={to} onChange={setTo} />
        <button className="win-button" onClick={() => { setFrom(''); setTo(''); }}>ALL DATES</button>
        <button className="win-button" onClick={() => printReport(stats, rangeLabel)} disabled={isLoading}>PRINT / PDF REPORT</button>
        <button className="win-button" onClick={() => exportCsv(rows)} disabled={isLoading}>EXPORT CSV</button>
      </div>

      {isLoading ? <div className="text-xs">LOADING REPORT...</div> : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <Stat label="Total Cases" value={stats.total} />
            <Stat label="Open" value={stats.open} />
            <Stat label="Closed" value={stats.closed} />
            <Stat label="Convicted" value={stats.convicted} />
            <Stat label="Conviction Rate" value={`${stats.convictionRate}%`} />
            <Stat label="Charges / Citations" value={stats.chargesFiled} />
            <Stat label="Avg Days to Close" value={stats.avgDaysToClose} />
          </div>

          <div className="border border-slate-400 bg-white p-2">
            <div className="text-[11px] font-bold uppercase mb-1">Violations by Month</div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byMonth}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e40af" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <RankTable title="By Status" data={stats.byStatus} />
            <RankTable title="By School" data={stats.bySchool} />
            <RankTable title="By Bus" data={stats.byBus} />
            <RankTable title="By Road" data={stats.byRoad} />
            <RankTable title="By County" data={stats.byCounty} />
            <RankTable title="By Evidence Source" data={stats.byEvidence} />
            <RankTable title="By Referred Agency" data={stats.byAgency} />
            <RankTable title="By Assigned Officer" data={stats.byOfficer} />
            <RankTable title="By Time of Day" data={stats.byHour} />
          </div>
        </>
      )}
    </div>
  );
}