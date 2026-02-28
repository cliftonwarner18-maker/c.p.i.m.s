import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Plus, Search, Eye, Pencil, Trash2, ClipboardCheck } from 'lucide-react';
import EditInspectionForm from '../components/inspections/EditInspectionForm';

const STATUS_COLORS = {
  Pass: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  Fail: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  Conditional: { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
};

export default function Inspections() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingInsp, setEditingInsp] = useState(null);
  const queryClient = useQueryClient();

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Inspection.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspections'] }),
  });

  const filtered = inspections.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      i.inspection_number?.toLowerCase().includes(q) ||
      i.bus_number?.toLowerCase().includes(q) ||
      i.inspector_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || i.overall_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const passCount = inspections.filter(i => i.overall_status === 'Pass').length;
  const failCount = inspections.filter(i => i.overall_status === 'Fail').length;
  const condCount = inspections.filter(i => i.overall_status === 'Conditional').length;

  const statBox = (label, count, color) => (
    <div style={{ background: 'white', border: `1px solid hsl(220,18%,78%)`, borderLeft: `3px solid ${color}`, borderRadius: '2px', padding: '8px 12px', flex: '1', minWidth: '90px' }}>
      <div style={{ fontSize: '18px', fontWeight: '700', color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '2px', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  );

  const btnBase = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '3px 6px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', cursor: 'pointer', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,15%)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: "'Courier Prime', monospace" }}>
      <LoadingScreen isLoading={isLoading} message="LOADING INSPECTIONS..." />
      {editingInsp && (
        <EditInspectionForm
          inspection={editingInsp}
          onClose={() => setEditingInsp(null)}
          onSaved={() => { setEditingInsp(null); queryClient.invalidateQueries({ queryKey: ['inspections'] }); }}
        />
      )}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        label={deleteTarget ? `Inspection ${deleteTarget.inspection_number} (Bus #${deleteTarget.bus_number})` : ''}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardCheck style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>CAMERA SYSTEM INSPECTIONS</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>INSPECTION LOG — {inspections.length} TOTAL RECORDS</div>
          </div>
        </div>
        <Link
          to="/NewInspection"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'hsl(140,55%,38%)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '2px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", fontWeight: '600', cursor: 'pointer', letterSpacing: '0.05em', textDecoration: 'none' }}
        >
          <Plus style={{ width: 13, height: 13 }} /> NEW INSPECTION
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {statBox('TOTAL', inspections.length, 'hsl(220,50%,40%)')}
        {statBox('PASS', passCount, 'hsl(140,55%,40%)')}
        {statBox('FAIL', failCount, 'hsl(0,65%,50%)')}
        {statBox('CONDITIONAL', condCount, 'hsl(40,80%,45%)')}
        {statBox('SHOWING', filtered.length, 'hsl(220,20%,55%)')}
      </div>

      {/* Filters */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em' }}>RESULT:</span>
          {['All', 'Pass', 'Fail', 'Conditional'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '3px 8px', fontSize: '10px', fontFamily: "'Courier Prime', monospace", fontWeight: statusFilter === s ? '700' : '500', background: statusFilter === s ? 'hsl(220,55%,38%)' : 'white', color: statusFilter === s ? 'white' : 'hsl(220,20%,30%)', border: `1px solid ${statusFilter === s ? 'hsl(220,55%,38%)' : 'hsl(220,18%,72%)'}`, borderRadius: '2px', cursor: 'pointer' }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto' }}>
          <Search style={{ width: 12, height: 12, color: 'hsl(220,20%,45%)' }} />
          <input
            placeholder="Search insp#, bus#, inspector..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '4px 8px', fontSize: '11px', fontFamily: "'Courier Prime', monospace", border: '1px solid hsl(220,18%,72%)', borderRadius: '2px', background: 'white', width: '220px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace", borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white' }}>
                {['INSP #', 'DATE', 'BUS #', 'INSPECTOR', 'CAMERA', 'DVR', 'SIGNALS', 'RESULT', 'NEXT DUE', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: '24px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontSize: '12px' }}>NO INSPECTIONS FOUND</td></tr>
              )}
              {filtered.map((insp, i) => {
                const sc = STATUS_COLORS[insp.overall_status] || { bg: '#f5f5f5', color: '#444', border: '#ddd' };
                return (
                  <tr key={insp.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,15%,97%)', borderBottom: '1px solid hsl(220,18%,88%)' }}>
                    <td style={{ padding: '5px 8px', fontWeight: '700' }}>{insp.inspection_number}</td>
                    <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{moment(insp.inspection_date || insp.created_date).format('MM/DD/YY HH:mm')}</td>
                    <td style={{ padding: '5px 8px', fontWeight: '700' }}>{insp.bus_number}</td>
                    <td style={{ padding: '5px 8px' }}>{insp.inspector_name}</td>
                    <td style={{ padding: '5px 8px', color: insp.camera_system_functional ? '#166534' : '#991b1b', fontWeight: '700' }}>{insp.camera_system_functional ? '✓ PASS' : '✗ FAIL'}</td>
                    <td style={{ padding: '5px 8px', color: insp.dvr_functional ? '#166534' : '#991b1b', fontWeight: '700' }}>{insp.dvr_functional ? '✓ PASS' : '✗ FAIL'}</td>
                    <td style={{ padding: '5px 8px', color: insp.signals_lights_functional ? '#166534' : '#991b1b', fontWeight: '700' }}>{insp.signals_lights_functional ? '✓ PASS' : '✗ FAIL'}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: '2px', padding: '2px 6px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {insp.overall_status?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', color: insp.next_inspection_due && new Date(insp.next_inspection_due) < new Date() ? '#991b1b' : 'inherit', fontWeight: insp.next_inspection_due && new Date(insp.next_inspection_due) < new Date() ? '700' : 'normal' }}>
                      {insp.next_inspection_due ? moment(insp.next_inspection_due).format('MM/DD/YYYY') : '—'}
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <Link to={`/InspectionDetail?id=${insp.id}`} style={{ ...btnBase, textDecoration: 'none', color: 'inherit' }} title="View">
                          <Eye style={{ width: 12, height: 12 }} />
                        </Link>
                        <button style={{ ...btnBase }} onClick={() => setDeleteTarget(insp)} title="Delete">
                          <Trash2 style={{ width: 12, height: 12 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '6px 10px', background: 'hsl(220,18%,96%)', borderTop: '1px solid hsl(220,18%,82%)', fontSize: '10px', color: 'hsl(220,10%,45%)' }}>
          SHOWING {filtered.length} OF {inspections.length} INSPECTIONS
        </div>
      </div>
    </div>
  );
}