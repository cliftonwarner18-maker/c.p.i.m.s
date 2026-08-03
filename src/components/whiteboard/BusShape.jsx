import React from 'react';

const FF = "'Courier Prime', monospace";

/**
 * Renders a stylized school-bus silhouette for the White Board.
 * The body color reflects the bus's board status.
 */
export default function BusShape({ busNumber, statusLabel, bg, border, text, isSub, make, glow }) {
  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {isSub && (
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', fontSize: '7px', fontWeight: '700', letterSpacing: '0.08em', background: 'white', color: 'hsl(330,80%,45%)', padding: '1px 4px', borderRadius: '2px', zIndex: 3, border: '1px solid hsl(330,80%,45%)' }}>SUB</div>
      )}

      {/* Bus body */}
      <div style={{
        position: 'relative',
        width: '100%',
        background: bg,
        border: `2px solid ${border}`,
        borderRadius: '8px 8px 4px 4px',
        padding: '5px 5px 10px',
        minHeight: '54px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
        boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.12)${glow ? ', ' + glow : ''}`,
      }}>
        {/* Roof stripe */}
        <div style={{ position: 'absolute', top: '2px', left: '4px', right: '4px', height: '2px', background: 'rgba(255,255,255,0.35)', borderRadius: '1px' }} />

        {/* Windows row */}
        <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', width: '100%', padding: '0 2px', marginTop: '2px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              flex: 1,
              height: '7px',
              maxWidth: '14px',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: '1px',
              border: '1px solid rgba(0,0,0,0.18)',
            }} />
          ))}
          {/* Windshield (front) — slightly wider, tinted */}
          <div style={{
            flex: '1.4',
            maxWidth: '18px',
            height: '7px',
            background: 'rgba(180,220,255,0.7)',
            borderRadius: '1px 3px 3px 1px',
            border: '1px solid rgba(0,0,0,0.2)',
          }} />
        </div>

        {/* Bus number */}
        <div style={{
          fontSize: '15px', fontWeight: '700', color: text, letterSpacing: '0.04em',
          lineHeight: 1, textShadow: '0 1px 2px rgba(0,0,0,0.3)', marginTop: '1px',
        }}>
          {busNumber}
        </div>

        {/* Status label */}
        <div style={{
          fontSize: '7px', fontWeight: '700', letterSpacing: '0.08em', color: text,
          background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: '2px',
        }}>
          {statusLabel}
        </div>

        {/* Wheels */}
        <div style={{ position: 'absolute', bottom: '-6px', left: '8px', width: '13px', height: '13px', background: '#1a1a1a', border: '2px solid #000', borderRadius: '50%', boxShadow: 'inset 0 0 0 2px #444' }} />
        <div style={{ position: 'absolute', bottom: '-6px', right: '8px', width: '13px', height: '13px', background: '#1a1a1a', border: '2px solid #000', borderRadius: '50%', boxShadow: 'inset 0 0 0 2px #444' }} />
      </div>

      {make && (
        <div style={{ fontSize: '7px', color: 'hsl(220,10%,45%)', textAlign: 'center', marginTop: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
          {make}
        </div>
      )}
    </div>
  );
}