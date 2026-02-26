import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Bus, FileText, ClipboardCheck, 
  PlusCircle, Database, Shield 
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
      <div className="bg-primary text-primary-foreground px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/89c560c96_state.jpg" className="w-7 h-7 object-contain" />
          <div>
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase leading-tight">
              STATE OF NORTH CAROLINA
            </div>
            <div className="text-[9px] tracking-[0.15em] uppercase opacity-80 leading-tight">
              DEPT. OF PUBLIC INSTRUCTION — MOBILE VEHICLE SURVEILLANCE SYSTEM
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-1 text-[10px]">
          <Database className="w-3 h-3" />
          <span className="tracking-wider">NCDPI-MVSS v2.1.04</span>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="win-panel flex items-center gap-0 px-1 py-0.5 flex-wrap no-print">
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={`win-button !py-1 !px-3 text-[11px] flex items-center gap-1 no-underline
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
          NC DPI — SCHOOL BUS SURVEILLANCE MANAGEMENT SYSTEM
        </div>
        <div className="win-border-inset px-2 bg-card">
          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}