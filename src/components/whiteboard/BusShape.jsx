import React from 'react';

/**
 * Renders a conventional-style school bus silhouette for the White Board.
 * Body color reflects board status. The hood/engine compartment protrudes
 * at the front (right side), with a windshield above it and round wheels below.
 */
export default function BusShape({ busNumber, statusLabel, bg, border, text, isSub, make, glow }) {
  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {isSub && (
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', fontSize: '7px', fontWeight: '700', letterSpacing: '0.08em', background: 'white', color: 'hsl(330,80%,45%)', padding: '1px 4px', borderRadius: '2px', zIndex: 5, border: '1px solid hsl(330,80%,45%)' }}>SUB</div>
      )}

      {/* Bus assembly */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
        {/* Main body (passenger compartment) */}
        <div style={{
          position: 'relative',
          flex: 1,
          background: bg,
          border: `2px solid ${border}`,
          borderRadius: '6px 2px 2px 4px',
          padding: '5px 5px 11px',
          minHeight: '52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.12)${glow ? ', ' + glow : ''}`,
          zIndex: 2,
        }}>
          {/* Roof stripe */}
          <div style={{ position: 'absolute', top: '2px', left: '4px', right: '4px', height: '2px', background: 'rgba(255,255,255,0.35)', borderRadius: '1px' }} />

          {/* Passenger windows row */}
          <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', width: '100%', padding: '0 2px', marginTop: '2px' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1,
                height: '7px',
                maxWidth: '13px',
                background: 'rgba(255,255,255,0.6)',
                borderRadius: '1px',
                border: '1px solid rgba(0,0,0,0.18)',
              }} />
            ))}
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

          {/* Rear wheel */}
          <div style={{ position: 'absolute', bottom: '-6px', left: '7px', width: '13px', height: '13px', background: '#1a1a1a', border: '2px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '5px', height: '5px', background: '#555', borderRadius: '50%' }} />
          </div>
        </div>

        {/* Hood / engine compartment (front, protrudes right) */}
        <div style={{
          position: 'relative',
          width: '20px',
          alignSelf: 'flex-end',
          background: bg,
          border: `2px solid ${border}`,
          borderLeft: 'none',
          borderRadius: '2px 7px 3px 0',
          height: '30px',
          marginLeft: '-1px',
          boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.12)${glow ? ', ' + glow : ''}`,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '3px',
          gap: '2px',
        }}>
          {/* Windshield (sits above the hood, tinted) */}
          <div style={{
            width: '14px', height: '7px',
            background: 'rgba(180,220,255,0.7)',
            borderRadius: '1px 3px 1px 1px',
            border: '1px solid rgba(0,0,0,0.2)',
          }} />
          {/* Grille slits */}
          <div style={{ width: '12px', height: '2px', background: 'rgba(0,0,0,0.25)', borderRadius: '1px' }} />
          <div style={{ width: '12px', height: '2px', background: 'rgba(0,0,0,0.25)', borderRadius: '1px' }} />
          {/* Headlight */}
          <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '4px', height: '4px', background: 'rgba(255,240,180,0.9)', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.3)' }} />
          {/* Front wheel (under hood) */}
          <div style={{ position: 'absolute', bottom: '-6px', right: '2px', width: '13px', height: '13px', background: '#1a1a1a', border: '2px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '5px', height: '5px', background: '#555', borderRadius: '50%' }} />
          </div>
        </div>
      </div>

      {make && (
        <div style={{ fontSize: '7px', color: 'hsl(220,10%,45%)', textAlign: 'center', marginTop: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
          {make}
        </div>
      )}
    </div>
  );
}