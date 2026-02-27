import React from 'react';
import { X, Minus, Square } from 'lucide-react';

export default function WinWindow({ title, children, className = "", icon = null, noPadding = false }) {
  return (
    <div className="flex flex-col w-full win-panel">
      <div className="win-titlebar w-full flex items-center justify-between select-none" style={{padding: '2px 4px', gap: '2px'}}>
        <div className="flex items-center gap-1">
          {icon && <span style={{fontSize: '10px'}}>{icon}</span>}
          <span style={{fontSize: '10px', letterSpacing: '0.05em', fontWeight: 'bold'}}>{title}</span>
        </div>
      </div>
      <div className={`w-full ${noPadding ? 'p-0' : 'p-2'}`}>
        {children}
      </div>
    </div>
  );
}