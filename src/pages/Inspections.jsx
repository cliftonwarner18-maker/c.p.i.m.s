import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import LoadingScreen from '../components/LoadingScreen';
import EditInspectionForm from '../components/inspections/EditInspectionForm';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export default function Inspections() {
  const [search, setSearch] = useState('');
  const [editingInsp, setEditingInsp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
    if (!search) return true;
    const q = search.toLowerCase();
    return i.inspection_number?.toLowerCase().includes(q) ||
      i.bus_number?.toLowerCase().includes(q) ||
      i.inspector_name?.toLowerCase().includes(q);
  });

  return (
    <>
      <LoadingScreen isLoading={isLoading} message="LOADING INSPECTIONS..." />
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        label={deleteTarget ? `Inspection ${deleteTarget.inspection_number} (Bus #${deleteTarget.bus_number})` : ''}
        onConfirm={() => { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
       {editingInsp && (
         <EditInspectionForm
           inspection={editingInsp}
           onClose={() => setEditingInsp(null)}
           onSaved={() => setEditingInsp(null)}
         />
       )}

       <WinWindow title="CAMERA SYSTEM INSPECTIONS — LOG" icon="📋">
         <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'4px',alignItems:'center'}}>
           <Link
             to={createPageUrl('NewInspection')}
             className="win-button"
             style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',background:'hsl(220,70%,35%)',color:'white',textDecoration:'none'}}
           >
             <Plus className="w-3 h-3" /> NEW INSPECTION
           </Link>
           <div style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'auto'}}>
             <Search className="w-3 h-3" />
             <input
               className="win-input"
               style={{fontSize:'11px',width:'192px'}}
               placeholder="Search inspections..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
         </div>

        <div className="win-panel-inset" style={{ maxHeight: '500px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
            <thead>
              <tr style={{background:'hsl(220,70%,35%)',color:'white',position:'sticky',top:0}}>
                <th style={{padding:'4px',textAlign:'left'}}>INSP#</th>
                <th style={{padding:'4px',textAlign:'left'}}>DATE</th>
                <th style={{padding:'4px',textAlign:'left'}}>BUS#</th>
                <th style={{padding:'4px',textAlign:'left'}}>INSPECTOR</th>
                <th style={{padding:'4px',textAlign:'left'}}>CAMERA</th>
                <th style={{padding:'4px',textAlign:'left'}}>DVR</th>
                <th style={{padding:'4px',textAlign:'left'}}>SIGNALS</th>
                <th style={{padding:'4px',textAlign:'left'}}>RESULT</th>
                <th style={{padding:'4px',textAlign:'left'}}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{padding:'16px',textAlign:'center',color:'hsl(220,10%,40%)'}}>NO INSPECTIONS FOUND</td></tr>
              )}
              {filtered.map((insp, i) => (
                <tr key={insp.id} style={{backgroundColor: i % 2 === 0 ? 'hsl(220,15%,96%)' : 'hsl(220,20%,92%)',height:'24px',lineHeight:'24px'}}>
                  <td style={{padding:'0 4px',fontWeight:'bold'}}>{insp.inspection_number}</td>
                  <td style={{padding:'0 4px'}}>{moment(insp.created_date).format('MM/DD/YY HH:mm')}</td>
                  <td style={{padding:'0 4px',fontWeight:'bold'}}>{insp.bus_number}</td>
                  <td style={{padding:'0 4px'}}>{insp.inspector_name}</td>
                  <td style={{padding:'0 4px'}}>{insp.camera_system_functional ? '✓ PASS' : '✗ FAIL'}</td>
                  <td style={{padding:'0 4px'}}>{insp.dvr_functional ? '✓ PASS' : '✗ FAIL'}</td>
                  <td style={{padding:'0 4px'}}>{insp.signals_lights_functional ? '✓ PASS' : '✗ FAIL'}</td>
                  <td style={{padding:'0 4px',fontWeight:'bold'}} className={insp.overall_status === 'Pass' ? 'status-completed' : insp.overall_status === 'Fail' ? 'status-cancelled' : 'status-pending'}>
                    [{insp.overall_status?.toUpperCase() || 'N/A'}]
                  </td>
                  <td style={{padding:'0 4px',display:'flex',gap:'4px',alignItems:'center'}}>
                    <Link
                      to={createPageUrl('InspectionDetail') + `?id=${insp.id}`}
                      className="win-button"
                      style={{padding:'0 2px',fontSize:'10px',display:'inline-flex',alignItems:'center',justifyContent:'center',textDecoration:'none',color:'inherit'}}
                      title="View"
                    >
                      <Eye className="w-3 h-3" />
                    </Link>
                    <button
                      className="win-button"
                      style={{padding:'0 2px',fontSize:'10px',display:'inline-flex',alignItems:'center',justifyContent:'center'}}
                      onClick={() => setEditingInsp(insp)}
                      title="Edit"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      className="win-button"
                      style={{padding:'0 2px',fontSize:'10px',display:'inline-flex',alignItems:'center',justifyContent:'center'}}
                      onClick={() => setDeleteTarget(insp)}
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
        <div style={{fontSize:'10px',color:'hsl(220,10%,40%)',marginTop:'2px'}}>
          TOTAL INSPECTIONS: {filtered.length}
        </div>
        </WinWindow>
        </div>
        </>
        );
        }