import React, { useState } from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';

// Secret delete code — change this to whatever you want
const DELETE_CODE = '877421';

export default function DeleteConfirmModal({ title, message, onConfirm, onCancel, isLoading }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!title) return null;

  const handleConfirm = () => {
    if (code.trim() === DELETE_CODE) {
      setCode('');
      setError('');
      onConfirm();
    } else {
      setError('INCORRECT CODE — ACCESS DENIED');
    }
  };

  const handleCancel = () => {
    setCode('');
    setError('');
    onCancel();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.55)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Courier Prime', monospace"
    }}>
      <div style={{
        border: '2px solid', borderColor: 'hsl(220,15%,96%) hsl(220,15%,50%) hsl(220,15%,50%) hsl(220,15%,96%)',
        background: 'hsl(220,15%,90%)', width: '360px',
        boxShadow: '4px 4px 0 rgba(0,0,0,0.4)'
      }}>
        {/* Title bar */}
        <div style={{
          background: 'linear-gradient(to right, hsl(0,65%,28%), hsl(0,65%,45%))',
          color: 'white', fontWeight: 'bold', padding: '3px 8px', fontSize: '11px',
          letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <ShieldAlert style={{ width: 12, height: 12 }} />
          DELETE AUTHORIZATION REQUIRED
        </div>

        {/* Body */}
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            border: '2px solid', borderColor: 'hsl(0,65%,40%)', background: 'hsl(0,80%,97%)',
            padding: '8px', fontSize: '11px', color: 'hsl(0,65%,30%)', fontWeight: 'bold'
          }}>
            ⚠️ You are about to permanently delete {label}.<br />
            <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'hsl(0,40%,40%)' }}>This action cannot be undone.</span>
          </div>

          <div>
            <label style={{ fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Enter Delete Authorization Code:
            </label>
            <input
              className="win-input"
              type="password"
              autoFocus
              style={{ width: '100%', fontSize: '13px', letterSpacing: '0.15em', fontFamily: "'Courier Prime', monospace" }}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') handleCancel(); }}
              placeholder="••••••••"
            />
            {error && (
              <div style={{ fontSize: '10px', color: 'hsl(0,72%,45%)', fontWeight: 'bold', marginTop: '4px' }}>
                🚫 {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="win-button"
              style={{ flex: 1, background: 'hsl(0,65%,35%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}
              onClick={handleConfirm}
            >
              <Trash2 style={{ width: 12, height: 12 }} /> CONFIRM DELETE
            </button>
            <button
              className="win-button"
              style={{ flex: 1, fontSize: '11px' }}
              onClick={handleCancel}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}