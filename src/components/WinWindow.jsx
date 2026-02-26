import React from 'react';
import { X, Minus, Square } from 'lucide-react';

export default function WinWindow({ title, children, className = "", icon = null, noPadding = false }) {
  return (
    <div className={`win-panel ${className}`}>
      <div className="win-titlebar flex items-center justify-between select-none" style={{padding: '2px 4px', gap: '2px'}}>
        <div className="flex items-center gap-1">
          {icon && <span style={{fontSize: '10px'}}>{icon}</span>}
          <span style={{fontSize: '10px', letterSpacing: '0.05em', fontWeight: 'bold'}}>{title}</span>
        </div>
        <div className="flex gap-0.5">
          <button style={{background: 'hsl(220,15%,90%)', border: '2px solid', borderColor: 'hsl(220,15%,98%) hsl(220,15%,55%) hsl(220,15%,55%) hsl(220,15%,98%)', padding: 0, width: 16, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', cursor: 'pointer'}}>
            <Minus className="w-2 h-2" />
          </button>
          <button style={{background: 'hsl(220,15%,90%)', border: '2px solid', borderColor: 'hsl(220,15%,98%) hsl(220,15%,55%) hsl(220,15%,55%) hsl(220,15%,98%)', padding: 0, width: 16, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', cursor: 'pointer'}}>
            <Square className="w-1.5 h-1.5" />
          </button>
          <button style={{background: 'hsl(220,15%,90%)', border: '2px solid', borderColor: 'hsl(220,15%,98%) hsl(220,15%,55%) hsl(220,15%,55%) hsl(220,15%,98%)', padding: 0, width: 16, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', cursor: 'pointer'}}>
            <X className="w-2 h-2" />
          </button>
        </div>
      </div>
      <div className={noPadding ? '' : 'p-2'}>
        {children}
      </div>
    </div>
  );
}