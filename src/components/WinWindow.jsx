import React from 'react';
import { X, Minus, Square } from 'lucide-react';

export default function WinWindow({ title, children, className = "", icon = null, noPadding = false }) {
  return (
    <div className={`win-panel ${className}`} style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
      <div className="win-titlebar flex items-center justify-between select-none" style={{padding: '2px 4px', gap: '2px', width: '100%'}}>
        <div className="flex items-center gap-1">
          {icon && <span style={{fontSize: '10px'}}>{icon}</span>}
          <span style={{fontSize: '10px', letterSpacing: '0.05em', fontWeight: 'bold'}}>{title}</span>
        </div>
      </div>
      <div className={noPadding ? 'p-0' : 'p-2'} style={{width: '100%'}}>
        {children}
      </div>
    </div>
  );
}