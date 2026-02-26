import React from 'react';
import WinWindow from '../components/WinWindow';
import LoadingScreen from '../components/LoadingScreen';

export default function Assets() {
  return (
    <>
      <LoadingScreen isLoading={false} />
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
        <WinWindow title="ASSET MANAGEMENT — INVENTORY DATABASE" icon="📦">
          <div className="win-panel-inset" style={{padding:'16px',textAlign:'center',color:'hsl(220,10%,40%)'}}>
            <div style={{fontSize:'12px',fontWeight:'bold',marginBottom:'8px'}}>ASSET MANAGEMENT SYSTEM</div>
            <div style={{fontSize:'11px',lineHeight:'1.6'}}>This module is currently under development.</div>
            <div style={{fontSize:'11px',lineHeight:'1.6',marginTop:'8px',color:'hsl(220,10%,50%)'}}>Features coming soon...</div>
          </div>
        </WinWindow>
      </div>
    </>
  );
}