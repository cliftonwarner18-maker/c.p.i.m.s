import React from 'react';
import { X, Minus, Square } from 'lucide-react';

export default function WinWindow({ title, children, className = "", icon = null, noPadding = false }) {
  return (
    <div className={`win-panel ${className}`}>
      <div className="win-titlebar flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {icon && <span className="text-xs">{icon}</span>}
          <span className="text-xs tracking-wider uppercase">{title}</span>
        </div>
        <div className="flex gap-[2px]">
          <button className="win-button !p-0 w-5 h-4 flex items-center justify-center !text-[10px]">
            <Minus className="w-3 h-3" />
          </button>
          <button className="win-button !p-0 w-5 h-4 flex items-center justify-center !text-[10px]">
            <Square className="w-2.5 h-2.5" />
          </button>
          <button className="win-button !p-0 w-5 h-4 flex items-center justify-center !text-[10px]">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className={noPadding ? '' : 'p-2'}>
        {children}
      </div>
    </div>
  );
}