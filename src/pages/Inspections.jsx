import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import EditInspectionForm from '../components/inspections/EditInspectionForm';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';

export default function Inspections() {
  const [search, setSearch] = useState('');
  const [editingInsp, setEditingInsp] = useState(null);
  const queryClient = useQueryClient();

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Inspection.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspections'] }),
  });

  const filtered = inspections.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return i.inspection_number?.toLowerCase().includes(q) ||
      i.bus_number?.toLowerCase().includes(q) ||
      i.inspector_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-2">
      {editingInsp && (
        <EditInspectionForm
          inspection={editingInsp}
          onClose={() => setEditingInsp(null)}
          onSaved={() => setEditingInsp(null)}
        />
      )}

      <WinWindow title="CAMERA SYSTEM INSPECTIONS — LOG" icon="📋">
        <div className="flex flex-wrap gap-2 mb-2">
          <Link
            to={createPageUrl('NewInspection')}
            className="win-button flex items-center gap-1 text-[11px] !bg-primary !text-primary-foreground no-underline"
          >
            <Plus className="w-3 h-3" /> NEW INSPECTION
          </Link>
          <div className="flex items-center gap-1 ml-auto">
            <Search className="w-3 h-3" />
            <input
              className="win-input text-[11px] w-48"
              placeholder="Search inspections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="win-panel-inset overflow-auto" style={{ maxHeight: '500px' }}>
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="bg-primary text-primary-foreground sticky top-0">
                <th className="p-1 text-left">INSP#</th>
                <th className="p-1 text-left">DATE</th>
                <th className="p-1 text-left">BUS#</th>
                <th className="p-1 text-left">INSPECTOR</th>
                <th className="p-1 text-left">CAMERA</th>
                <th className="p-1 text-left">DVR</th>
                <th className="p-1 text-left">SIGNALS</th>
                <th className="p-1 text-left">RESULT</th>
                <th className="p-1 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="p-4 text-center text-muted-foreground">NO INSPECTIONS FOUND</td></tr>
              )}
              {filtered.map((insp, i) => (
                <tr key={insp.id} className={i % 2 === 0 ? 'bg-card' : 'bg-background'}>
                  <td className="p-1 font-bold">{insp.inspection_number}</td>
                  <td className="p-1">{moment(insp.created_date).format('MM/DD/YY HH:mm')}</td>
                  <td className="p-1 font-bold">{insp.bus_number}</td>
                  <td className="p-1">{insp.inspector_name}</td>
                  <td className="p-1">{insp.camera_system_functional ? '✓ PASS' : '✗ FAIL'}</td>
                  <td className="p-1">{insp.dvr_functional ? '✓ PASS' : '✗ FAIL'}</td>
                  <td className="p-1">{insp.signals_lights_functional ? '✓ PASS' : '✗ FAIL'}</td>
                  <td className={`p-1 font-bold ${insp.overall_status === 'Pass' ? 'status-completed' : insp.overall_status === 'Fail' ? 'status-cancelled' : 'status-pending'}`}>
                    [{insp.overall_status?.toUpperCase() || 'N/A'}]
                  </td>
                  <td className="p-1 flex gap-1">
                    <Link
                      to={createPageUrl('InspectionDetail') + `?id=${insp.id}`}
                      className="win-button !py-0 !px-1 text-[10px] no-underline text-foreground"
                      title="View"
                    >
                      <Eye className="w-3 h-3" />
                    </Link>
                    <button
                      className="win-button !py-0 !px-1 text-[10px]"
                      onClick={() => setEditingInsp(insp)}
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      className="win-button !py-0 !px-1 text-[10px]"
                      onClick={() => { if (confirm('Delete this inspection?')) deleteMutation.mutate(insp.id); }}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          TOTAL INSPECTIONS: {filtered.length}
        </div>
      </WinWindow>
    </div>
  );
}