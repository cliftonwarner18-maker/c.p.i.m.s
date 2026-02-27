import React from 'react';
import { X, Minus, Square } from 'lucide-react';

export default function WinWindow({ title, children, className = "", icon = null, noPadding = false }) {
  return (
    <div style={{display:'flex',flexDirection:'column',width:'100%',maxWidth:'100%',margin:'0',padding:'0',boxSizing:'border-box'}} className="win-panel">
      <div className="win-titlebar" style={{display:'block',width:'100%',padding:'2px 4px',gap:'2px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
          {icon && <span style={{fontSize:'10px'}}>{icon}</span>}
          <span style={{fontSize:'10px',letterSpacing:'0.05em',fontWeight:'bold'}}>{title}</span>
        </div>
      </div>
      <div style={{display:'block',width:'100%',boxSizing:'border-box',padding:noPadding ? '0' : '8px'}}>
        {children}
      </div>
    </div>
  );
}