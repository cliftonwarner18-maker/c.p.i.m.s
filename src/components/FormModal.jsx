import React from 'react';
import { X } from 'lucide-react';

const FF = "'Courier Prime', monospace";

export default function FormModal({ open, onClose, children, maxWidth = '720px' }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9998,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '30px 12px', overflowY: 'auto', fontFamily: FF,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: 'white', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', width: '100%', maxWidth, boxShadow: '0 8px 30px rgba(0,0,0,0.35)', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          title="Close"
          style={{ position: 'absolute', top: '10px', right: '10px', background: 'hsl(220,18%,90%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
        <div style={{ padding: '14px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}