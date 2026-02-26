import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Bus, FileText, ClipboardCheck, 
  PlusCircle, Database
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Fleet', icon: Bus, page: 'FleetManager' },
  { name: 'New W/O', icon: PlusCircle, page: 'NewWorkOrder' },
  { name: 'Work Orders', icon: FileText, page: 'WorkOrders' },
  { name: 'Inspections', icon: ClipboardCheck, page: 'Inspections' },
];

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-primary text-primary-foreground px-3 py-1 flex items-center justify-between" style={{minHeight: 0}}>
        <div className="flex items-center gap-2">
          <div style={{width:28,height:28,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.4)',borderRadius:2,fontSize:16}}>🚌</div>
          <div className="leading-none">
            <div className="text-[10px] font-bold tracking-widest uppercase">NEW HANOVER COUNTY SCHOOLS</div>
            <div className="text-[8px] tracking-wider uppercase opacity-80">TRANSPORTATION DEPT. — MOBILE VEHICLE SURVEILLANCE SYSTEM</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9px] opacity-70">
          <Database className="w-3 h-3" />
          <span>NCDPI-MVSS v2.1.04</span>
        </div>
      </div>

      {/* Menu Bar — horizontal, single line */}
      <div className="win-panel flex items-center gap-0 px-1 py-0.5 no-print overflow-x-auto" style={{whiteSpace:'nowrap'}}>
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={`win-button !py-0.5 !px-3 text-[11px] inline-flex items-center gap-1 no-underline
              ${currentPageName === item.page ? '!bg-primary !text-primary-foreground' : 'text-foreground'}`}
          >
            <item.icon className="w-3 h-3" />
            {item.name}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-2 overflow-auto">
        {children}
      </div>

      {/* Bottom Status Bar */}
      <div className="win-border-inset bg-secondary flex items-center text-[10px] font-mono px-1 h-5 no-print">
        <div className="win-border-inset px-2 bg-card flex-1">
          NHCS — SCHOOL BUS SURVEILLANCE MANAGEMENT SYSTEM
        </div>
        <div className="win-border-inset px-2 bg-card">
          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}