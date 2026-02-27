import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Bus, FileText, ClipboardCheck, 
  PlusCircle, Database, Package2, HardDrive, ShieldAlert
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Fleet', icon: Bus, page: 'FleetManager' },
  { name: 'New W/O', icon: PlusCircle, page: 'NewWorkOrder' },
  { name: 'Work Orders', icon: FileText, page: 'WorkOrders' },
  { name: 'Inspections', icon: ClipboardCheck, page: 'Inspections' },
  { name: 'Assets', icon: Package2, page: 'Assets' },
  { name: 'H-Drive', icon: HardDrive, page: 'HdriveManagement' },
  { name: 'Admin', icon: ShieldAlert, page: 'AdminPanel', red: true },
];

export default function Layout({ children, currentPageName }) {
  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col font-mono" style={{fontFamily: "'Courier Prime', monospace"}}>
      {/* Top Header Bar */}
      <div style={{background:'linear-gradient(to right, hsl(220,50%,32%), hsl(220,45%,38%))',color:'white',padding:'6px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'nowrap',minHeight:0,fontFamily:"'Courier Prime',monospace",boxShadow:'0 2px 6px rgba(0,0,0,0.12)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699faac8c5894219ce08210b/736f6667e_nhcs.png" style={{width:28,height:28,objectFit:'contain',flexShrink:0}} alt="NHCS Logo" />
          <div style={{lineHeight:'1.2',borderLeft:'1px solid rgba(255,255,255,0.3)',paddingLeft:10}}>
            <div style={{fontSize:11,fontWeight:'600',letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}}>New Hanover County Schools</div>
            <div style={{fontSize:9,letterSpacing:'0.05em',textTransform:'uppercase',opacity:0.85,whiteSpace:'nowrap'}}>Transportation — Vehicle Surveillance System</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:10,opacity:0.8,flexShrink:0}}>
          <Database style={{width:14,height:14}} />
          <span style={{whiteSpace:'nowrap'}}>v2.1.04</span>
        </div>
      </div>

      {/* Menu Bar — horizontal, single line */}
      <div className="win-panel no-print" style={{display:'flex !important',alignItems:'center !important',padding:'2px 4px !important',gap:'2px !important',overflowX:'auto !important',width:'100% !important',flexWrap:'nowrap !important',fontFamily:"'Courier Prime',monospace"}}>
        {navItems.map((item) => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            style={{
              display:'inline-flex',alignItems:'center',gap:4,
              padding:'2px 12px',fontSize:11,textDecoration:'none',
              background: item.red ? (currentPageName === item.page ? 'hsl(0,65%,28%)' : 'hsl(0,65%,40%)') : item.page === 'NewWorkOrder' ? 'hsl(140,70%,40%)' : currentPageName === item.page ? 'hsl(220,70%,35%)' : 'hsl(220,15%,90%)',
              color: item.red || item.page === 'NewWorkOrder' || currentPageName === item.page ? 'white' : 'inherit',
              border:'2px solid',
              borderColor: item.red || item.page === 'NewWorkOrder' || currentPageName === item.page
                ? 'hsl(220,15%,55%) hsl(220,15%,98%) hsl(220,15%,98%) hsl(220,15%,55%)'
                : 'hsl(220,15%,98%) hsl(220,15%,55%) hsl(220,15%,55%) hsl(220,15%,98%)',
              fontFamily:"'Courier Prime',monospace",fontWeight:'bold',whiteSpace:'nowrap',flexShrink:0
            }}
          >
            <item.icon style={{width:12,height:12,flexShrink:0}} />
            {item.name}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" style={{fontFamily:"'Courier Prime',monospace", padding: '12px', width: '100%', boxSizing: 'border-box', display: 'block'}}>
        {children}
      </div>

      {/* Bottom Status Bar */}
      <div className="win-border-inset bg-secondary flex items-center text-[10px] font-mono px-1 h-5 no-print" style={{fontFamily:"'Courier Prime',monospace"}}>
        <div className="win-border-inset px-2 bg-card flex-1">
          NHCS — SCHOOL BUS SURVEILLANCE MANAGEMENT SYSTEM
        </div>
        <div className="win-border-inset px-2 bg-card" style={{fontStyle:'italic',color:'hsl(220,10%,45%)',fontSize:'8px',letterSpacing:'0.03em'}}>
          Powered by Base44 · Developed by Clifton Warner M.
        </div>
        <div className="win-border-inset px-2 bg-card">
          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}