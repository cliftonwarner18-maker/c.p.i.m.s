import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import {
  LayoutDashboard, Bus, FileText, ClipboardCheck,
  PlusCircle, Database, Package2, HardDrive, ShieldAlert, Download } from
'lucide-react';

const navItems = [
{ name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
{ name: 'Fleet', icon: Bus, page: 'FleetManager' },
{ name: 'New W/O', icon: PlusCircle, page: 'NewWorkOrder' },
{ name: 'Work Orders', icon: FileText, page: 'WorkOrders' },
{ name: 'Inspections', icon: ClipboardCheck, page: 'Inspections' },
{ name: 'Wash Bay', icon: HardDrive, page: 'WashBay', teal: true },
{ name: 'Assets', icon: Package2, page: 'Assets' },
{ name: 'H-Drive', icon: HardDrive, page: 'HdriveManagement' },
{ name: 'Master Backup', icon: Download, page: 'MasterBackup', yellow: true },
{ name: 'Admin', icon: ShieldAlert, page: 'AdminPanel', red: true }];


export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [adminModal, setAdminModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminClick = (e) => {
    e.preventDefault();
    setAdminModal(true);
    setAdminCode('');
    setAdminError('');
  };

  const handleAdminSubmit = () => {
    if (adminCode === '246877421') {
      setAdminModal(false);
      setAdminCode('');
      navigate(createPageUrl('AdminPanel'));
    } else {
      setAdminError('INVALID CODE');
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col font-mono" style={{ fontFamily: "'Courier Prime', monospace" }}>
      {/* Top Header Bar */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,32%), hsl(220,45%,38%))', color: 'white', padding: '6px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', minHeight: 0, fontFamily: "'Courier Prime',monospace", boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} alt="NHCS Logo" />
          <div style={{ lineHeight: '1.2', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 10 }}>
            <div style={{ fontSize: 11, fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>New Hanover County Schools</div>
            <div style={{ fontSize: 9, letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.85, whiteSpace: 'nowrap' }}>Transportation — Vehicle Surveillance System</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, opacity: 0.8, flexShrink: 0 }}>
          <Database style={{ width: 14, height: 14 }} />
          <span style={{ whiteSpace: 'nowrap' }}>v2.1.04</span>
        </div>
      </div>

      {/* Menu Bar — horizontal, single line */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', padding: '4px 6px', gap: '2px', overflowX: 'auto', width: '100%', flexWrap: 'nowrap', fontFamily: "'Courier Prime',monospace", background: 'hsl(220,20%,94%)', borderBottom: '1px solid hsl(220,18%,75%)' }}>
        {navItems.map((item) => {
          if (item.page === 'AdminPanel') {
            return (
              <button
                key={item.page}
                onClick={handleAdminClick}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', fontSize: 11, textDecoration: 'none', border: '1px solid',
                  background: currentPageName === item.page ? 'hsl(0,65%,38%)' : 'hsl(0,65%,48%)',
                  color: 'white',
                  borderColor: 'rgba(0,0,0,0.2)',
                  fontFamily: "'Courier Prime',monospace", fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0, borderRadius: '2px', transition: 'all 0.15s', cursor: 'pointer'
                }} className="bg-red-600 text-white hover:opacity-90"
              >
                <item.icon style={{ width: 13, height: 13, flexShrink: 0 }} />
                {item.name}
              </button>
            );
          }
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', fontSize: 11, textDecoration: 'none',
                background: item.red ? currentPageName === item.page ? 'hsl(0,65%,38%)' : 'hsl(0,65%,48%)' : item.yellow ? currentPageName === item.page ? 'hsl(45,90%,42%)' : 'hsl(45,90%,52%)' : item.teal ? currentPageName === item.page ? 'hsl(180,65%,35%)' : 'hsl(180,65%,45%)' : item.page === 'NewWorkOrder' ? 'hsl(140,60%,42%)' : currentPageName === item.page ? 'hsl(220,50%,38%)' : 'hsl(220,18%,88%)',
                color: item.red || item.yellow || item.teal || item.page === 'NewWorkOrder' || currentPageName === item.page ? 'white' : 'hsl(220,20%,20%)',
                border: '1px solid',
                borderColor: item.red || item.yellow || item.teal || item.page === 'NewWorkOrder' || currentPageName === item.page ? 'rgba(0,0,0,0.2)' : 'hsl(220,18%,70%)',
                fontFamily: "'Courier Prime',monospace", fontWeight: '500', whiteSpace: 'nowrap', flexShrink: 0, borderRadius: '2px', transition: 'all 0.15s', cursor: 'pointer'
              }} className="bg-cyan-600 text-slate-950">

              <item.icon style={{ width: 13, height: 13, flexShrink: 0 }} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" style={{ fontFamily: "'Courier Prime',monospace", padding: '12px', width: '100%', boxSizing: 'border-box', display: 'block' }}>
        {children}
      </div>

      {/* Bottom Status Bar */}
      <div style={{ background: 'hsl(220,18%,92%)', borderTop: '1px solid hsl(220,18%,75%)', display: 'flex', alignItems: 'center', fontSize: '10px', fontFamily: "'Courier Prime',monospace", padding: '4px 8px', gap: '8px', height: 'auto', minHeight: '28px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, paddingLeft: '4px', color: 'hsl(220,20%,25%)' }}>
          NHCS Vehicle Surveillance System
        </div>
        <div style={{ fontSize: '9px', color: 'hsl(220,10%,50%)', letterSpacing: '0.04em' }}>
          Powered by Base44 &nbsp;|&nbsp; Developed by: Clifton M. Warner
        </div>
        <div style={{ borderLeft: '1px solid hsl(220,18%,70%)', paddingLeft: '8px', color: 'hsl(220,10%,45%)', whiteSpace: 'nowrap' }}>
          {format(new Date(), 'MM/dd/yyyy - HH:mm')}
        </div>
      </div>
    </div>);

}