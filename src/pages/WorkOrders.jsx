import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../components/WinWindow';
import LoadingScreen from '../components/LoadingScreen';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import moment from 'moment';
import { Search, Filter, Trash2 } from 'lucide-react';

export default function WorkOrders() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: workOrders = [], isLoading } = useQuery({
    queryKey: ['workOrders'],
    queryFn: () => base44.entities.WorkOrder.list('-created_date'),
  });

  const filtered = workOrders.filter(wo => {
    const matchStatus = statusFilter === 'All' || wo.status === statusFilter;
    const matchSearch = !search || 
      wo.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.bus_number?.toLowerCase().includes(search.toLowerCase()) ||
      wo.reported_by?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkOrder.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workOrders'] }),
  });

  const handleDelete = (wo) => {
    if (window.confirm(`DELETE work order ${wo.order_number} for Bus #${wo.bus_number}? This cannot be undone.`)) {
      deleteMutation.mutate(wo.id);
    }
  };

  const statusClass = (s) => {
    if (s === 'Pending') return 'status-pending';
    if (s === 'In Progress') return 'status-progress';
    if (s === 'Completed') return 'status-completed';
    return 'status-cancelled';
  };

  return (
    <>
      <LoadingScreen isLoading={isLoading} message="LOADING WORK ORDERS..." />
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
       <WinWindow title="ALL WORK ORDERS — SURVEILLANCE REPAIR LOG" icon="📋">
         {/* Filters */}
         <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'4px',alignItems:'center'}}>
           <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
             <Filter className="w-3 h-3" />
             <span style={{fontSize:'11px',fontWeight:'bold'}}>STATUS:</span>
             {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(s => (
               <button
                 key={s}
                 className="win-button"
                 style={{fontSize:'10px',padding:'0 4px',background: statusFilter === s ? 'hsl(220,70%,35%)' : 'hsl(220,15%,90%)',color: statusFilter === s ? 'white' : 'inherit'}}
                 onClick={() => setStatusFilter(s)}
               >
                 {s.toUpperCase()}
               </button>
             ))}
           </div>
           <div style={{display:'flex',alignItems:'center',gap:'4px',marginLeft:'auto'}}>
             <Search className="w-3 h-3" />
             <input
               className="win-input"
               style={{fontSize:'11px',width:'192px'}}
               placeholder="Search orders..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
         </div>

        {/* Table */}
        <div className="win-panel-inset" style={{ maxHeight: '500px', overflow: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <table style={{ width: '100%', fontSize: '11px', fontFamily: "'Courier Prime', monospace" }}>
            <thead>
              <tr style={{background:'hsl(220,70%,35%)',color:'white',position:'sticky',top:0}}>
                <th style={{padding:'4px',textAlign:'left'}}>ORDER#</th>
                <th style={{padding:'4px',textAlign:'left'}}>DATE</th>
                <th style={{padding:'4px',textAlign:'left'}}>BUS#</th>
                <th style={{padding:'4px',textAlign:'left'}}>REPORTED BY</th>
                <th style={{padding:'4px',textAlign:'left'}}>ISSUE</th>
                <th style={{padding:'4px',textAlign:'left'}}>STATUS</th>
                <th style={{padding:'4px',textAlign:'left'}}>TECHNICIAN</th>
                <th style={{padding:'4px',textAlign:'left'}}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{padding:'16px',textAlign:'center',color:'hsl(220,10%,40%)'}}>NO RECORDS FOUND</td></tr>
              )}
              {filtered.map((wo, i) => (
                <tr key={wo.id} style={{backgroundColor: i % 2 === 0 ? 'hsl(220,15%,96%)' : 'hsl(220,20%,92%)',height:'24px',lineHeight:'24px'}}>
                  <td style={{padding:'0 4px',fontWeight:'bold'}}>{wo.order_number}</td>
                  <td style={{padding:'0 4px'}}>{moment(wo.created_date).format('MM/DD/YY HH:mm')}</td>
                  <td style={{padding:'0 4px',fontWeight:'bold'}}>{wo.bus_number}</td>
                  <td style={{padding:'0 4px'}}>{wo.reported_by}</td>
                  <td style={{padding:'0 4px',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{wo.issue_description}</td>
                  <td style={{padding:'0 4px',fontWeight:'bold'}} className={statusClass(wo.status)}>[{wo.status?.toUpperCase()}]</td>
                  <td style={{padding:'0 4px'}}>{wo.technician_name || '—'}</td>
                  <td style={{padding:'0 4px',display:'flex',gap:'4px',alignItems:'center'}}>
                    <Link
                      to={createPageUrl('WorkOrderDetail') + `?id=${wo.id}`}
                      className="win-button"
                      style={{fontSize:'10px',padding:'0 4px',display:'inline-block',textDecoration:'none',color:'inherit'}}
                    >
                      OPEN
                    </Link>
                    <button
                      className="win-button"
                      style={{fontSize:'10px',padding:'0 4px',display:'inline-flex',alignItems:'center',gap:'2px',background:'hsl(0,72%,45%)',color:'white'}}
                      onClick={() => handleDelete(wo)}
                    >
                      <Trash2 className="w-3 h-3" /> DEL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{fontSize:'10px',color:'hsl(220,10%,40%)',marginTop:'2px'}}>
          SHOWING {filtered.length} OF {workOrders.length} RECORDS
        </div>
        </WinWindow>
        </div>
        </>
        );
        }