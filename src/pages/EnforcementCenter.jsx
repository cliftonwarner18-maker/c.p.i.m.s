import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import FormModal from '@/components/FormModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ViolationForm from '@/components/enforcement/ViolationForm';
import ViolationList from '@/components/enforcement/ViolationList';
import EnforcementReports from '@/components/enforcement/EnforcementReports';
import { TextField, SelectField } from '@/components/enforcement/Field';
import { STATUSES } from '@/components/enforcement/enforcementConstants';

export default function EnforcementCenter() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('cases');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | record
  const [deleting, setDeleting] = useState(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['stopArmViolations', 'list', status],
    queryFn: async () => {
      const page = await base44.entities.StopArmViolation.filter(status ? { status } : {}, { sort: '-violation_date', limit: 500 });
      return page.items;
    },
  });

  const term = search.trim().toLowerCase();
  const shown = term
    ? rows.filter((r) => [r.case_number, r.school_bus_number, r.school_name, r.license_plate, r.violator_name, r.assigned_to, r.citation_number, r.highway]
        .some((v) => (v || '').toLowerCase().includes(term)))
    : rows;

  const confirmDelete = async () => {
    await base44.entities.StopArmViolation.delete(deleting.id);
    setDeleting(null);
    qc.invalidateQueries({ queryKey: ['stopArmViolations'] });
  };

  const tabCls = (t) => `win-button ${tab === t ? '!bg-slate-700 !text-white' : ''}`;

  return (
    <div className="space-y-3 font-mono">
      <div className="bg-slate-800 text-white px-3 py-2 text-sm font-bold uppercase tracking-wide">
        Enforcement Center — School Bus Stop Arm Violations
      </div>

      <div className="flex gap-1">
        <button className={tabCls('cases')} onClick={() => setTab('cases')}>CASES</button>
        <button className={tabCls('reports')} onClick={() => setTab('reports')}>REPORTS</button>
      </div>

      {tab === 'cases' ? (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <TextField label="Search" value={search} onChange={setSearch} />
            <SelectField label="Status" value={status} onChange={setStatus} options={STATUSES} />
            <button className="win-button" onClick={() => setEditing('new')}>+ NEW CASE</button>
            <span className="text-xs text-slate-600">{shown.length} case(s)</span>
          </div>
          {isLoading ? <div className="text-xs">LOADING...</div> : (
            <ViolationList rows={shown} onOpen={setEditing} onDelete={setDeleting} />
          )}
        </>
      ) : (
        <EnforcementReports />
      )}

      <FormModal open={!!editing} onClose={() => setEditing(null)} maxWidth="1000px">
        {editing && <ViolationForm record={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      </FormModal>

      {deleting && (
        <DeleteConfirmModal
          open
          title={`Delete case ${deleting.case_number}`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}