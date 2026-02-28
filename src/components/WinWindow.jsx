import React from 'react';

const FF = "'Courier Prime', monospace";

export default function WinWindow({ title, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', fontFamily: FF, border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '7px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', fontFamily: FF }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{title}
      </div>
      <div style={{ background: 'hsl(220,10%,98%)', padding: '10px', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  );
}