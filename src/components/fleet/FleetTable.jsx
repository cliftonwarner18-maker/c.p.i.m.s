import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Eye, Pencil, Trash2, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_STYLES = {
  'Active': { background: 'hsl(140,55%,92%)', color: 'hsl(140,55%,28%)', border: 'hsl(140,55%,72%)' },
  'Out of Service': { background: 'hsl(0,65%,93%)', color: 'hsl(0,65%,35%)', border: 'hsl(0,65%,75%)' },
  'Retired': { background: 'hsl(220,10%,88%)', color: 'hsl(220,10%,35%)', border: 'hsl(220,10%,70%)' },
};

const CAMERA_STYLES = {
  'Seon': { background: 'hsl(220,70%,92%)', color: 'hsl(220,70%,30%)' },
  'Safety Vision': { background: 'hsl(200,70%,90%)', color: 'hsl(200,70%,28%)' },
  'None': { background: 'hsl(220,10%,90%)', color: 'hsl(220,10%,45%)' },
};

const Badge = ({ label, style }) => (
  <span style={{
    display: 'inline-block', padding: '1px 6px', fontSize: '9px', fontWeight: '700',
    letterSpacing: '0.05em', borderRadius: '2px', border: `1px solid ${style?.border || 'transparent'}`,
    background: style?.background, color: style?.color, whiteSpace: 'nowrap',
  }}>
    {label}
  </span>
);

export default function FleetTable({ buses, busNumCounts, onEdit, onDelete }) {
  if (buses.length === 0) {
    return (
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '40px', textAlign: 'center', color: 'hsl(220,10%,50%)', fontSize: '12px', letterSpacing: '0.06em' }}>
        NO VEHICLES MATCH THE SELECTED FILTERS
      </div>
    );
  }

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace", borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'hsl(220,45%,28%)', color: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
              {['BUS #', 'TYPE', 'YR', 'MAKE / MODEL', 'LOCATION', 'VIN', 'CAMERA SYSTEM', 'ASSET #', 'STATUS', 'INSP. DUE', ''].map((h, i) => (
                <th key={i} style={{ padding: '7px 8px', textAlign: 'left', fontWeight: '700', fontSize: '10px', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderRight: i < 10 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {buses.map((b, i) => {
              const overdue = b.next_inspection_due && new Date(b.next_inspection_due) < new Date();
              const isDup = busNumCounts[b.bus_number?.trim().toLowerCase()] > 1;
              const rowBg = isDup ? 'hsl(0,80%,96%)' : i % 2 === 0 ? 'white' : 'hsl(220,20%,97%)';
              const camStyle = CAMERA_STYLES[b.camera_system_type] || CAMERA_STYLES['None'];
              const statusStyle = STATUS_STYLES[b.status] || STATUS_STYLES['Active'];

              return (
                <tr key={b.id} style={{ background: rowBg, borderBottom: '1px solid hsl(220,18%,90%)', outline: isDup ? '2px solid hsl(0,65%,60%)' : 'none' }}>
                  {/* Bus # */}
                  <td style={{ padding: '5px 8px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    {isDup && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'hsl(0,65%,48%)', color: 'white', fontSize: '8px', padding: '1px 4px', borderRadius: '2px', marginRight: '4px' }}>
                        <AlertTriangle style={{ width: 8, height: 8 }} /> DUP
                      </span>
                    )}
                    <span style={{ color: 'hsl(220,60%,35%)' }}>{b.bus_number}</span>
                  </td>
                  {/* Type */}
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', fontSize: '10px' }}>
                    {b.bus_type === 'School Bus' ? (
                      <span style={{ color: 'hsl(220,50%,40%)', fontWeight: '600' }}>SCH</span>
                    ) : (
                      <span style={{ color: 'hsl(280,45%,40%)', fontWeight: '600' }}>ACT</span>
                    )}
                  </td>
                  {/* Year */}
                  <td style={{ padding: '5px 8px', color: 'hsl(220,10%,40%)' }}>{b.year || '—'}</td>
                  {/* Make/Model */}
                  <td style={{ padding: '5px 8px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {b.make || '—'}{b.model ? <span style={{ fontWeight: '400', color: 'hsl(220,10%,45%)' }}> / {b.model}</span> : ''}
                  </td>
                  {/* Location */}
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                    {b.base_location ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '10px', fontWeight: '600', color: 'hsl(220,45%,35%)' }}>
                        {b.base_location}
                      </span>
                    ) : <span style={{ color: 'hsl(220,10%,60%)' }}>—</span>}
                  </td>
                  {/* VIN */}
                  <td style={{ padding: '5px 8px', color: 'hsl(220,10%,40%)', fontSize: '10px', fontFamily: 'monospace' }}>
                    {b.vin || <span style={{ color: 'hsl(220,10%,65%)' }}>—</span>}
                  </td>
                  {/* Camera */}
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                    {b.camera_system_type && b.camera_system_type !== 'None' ? (
                      <div>
                        <Badge label={b.camera_system_type} style={camStyle} />
                        {b.camera_serial_number && (
                          <div style={{ fontSize: '9px', color: 'hsl(220,10%,50%)', marginTop: '2px' }}>{b.camera_serial_number}</div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'hsl(220,10%,65%)', fontSize: '10px' }}>—</span>
                    )}
                  </td>
                  {/* Asset # */}
                  <td style={{ padding: '5px 8px', fontSize: '10px', color: 'hsl(220,10%,40%)', fontFamily: 'monospace' }}>
                    {b.asset_number || <span style={{ color: 'hsl(220,10%,65%)' }}>—</span>}
                  </td>
                  {/* Status */}
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                    <Badge label={b.status || 'Active'} style={statusStyle} />
                  </td>
                  {/* Inspection */}
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                    {b.next_inspection_due ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '10px', fontWeight: overdue ? '700' : '400', color: overdue ? 'hsl(0,65%,40%)' : 'hsl(140,50%,32%)' }}>
                        {overdue ? <XCircle style={{ width: 10, height: 10 }} /> : <CheckCircle style={{ width: 10, height: 10 }} />}
                        {new Date(b.next_inspection_due).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: 'hsl(220,10%,65%)', fontSize: '10px' }}>—</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      <Link
                        to={createPageUrl('BusProfile') + `?bus=${b.bus_number}`}
                        title="View Profile"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: 'hsl(220,55%,38%)', color: 'white', borderRadius: '2px', textDecoration: 'none', border: '1px solid hsl(220,55%,30%)' }}
                      >
                        <Eye style={{ width: 11, height: 11 }} />
                      </Link>
                      <button
                        title="Edit"
                        onClick={() => onEdit(b)}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: 'hsl(30,70%,48%)', color: 'white', borderRadius: '2px', border: '1px solid hsl(30,70%,38%)', cursor: 'pointer' }}
                      >
                        <Pencil style={{ width: 11, height: 11 }} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => onDelete(b)}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, background: 'hsl(0,65%,48%)', color: 'white', borderRadius: '2px', border: '1px solid hsl(0,65%,38%)', cursor: 'pointer' }}
                      >
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '6px 10px', background: 'hsl(220,18%,96%)', borderTop: '1px solid hsl(220,18%,82%)', fontSize: '10px', color: 'hsl(220,10%,45%)', letterSpacing: '0.05em' }}>
        DISPLAYING {buses.length} VEHICLE{buses.length !== 1 ? 'S' : ''}
      </div>
    </div>
  );
}