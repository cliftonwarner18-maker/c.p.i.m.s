import React from 'react';

/**
 * Flat-silhouette conventional school bus for the White Board.
 * Body color reflects board status. Geometry mirrors the reference icon:
 * tall passenger body (rounded top-rear corner) + lower protruding hood,
 * a row of windows with a door section, two trim lines, front/rear bumpers,
 * a side mirror, and two round wheels with hubcaps.
 */
export default function BusShape({ busNumber, statusLabel, bg, border, text, isSub, make, glow }) {
  const win = 'rgba(255,255,255,0.62)';
  const lineCol = 'rgba(0,0,0,0.22)';

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {isSub && (
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', fontSize: '7px', fontWeight: '700', letterSpacing: '0.08em', background: 'white', color: 'hsl(330,80%,45%)', padding: '1px 4px', borderRadius: '2px', zIndex: 6, border: '1px solid hsl(330,80%,45%)' }}>SUB</div>
      )}

      {/* Side mirror */}
      <div style={{ position: 'absolute', top: '3px', right: '14px', width: '2px', height: '7px', background: border, borderRadius: '1px', zIndex: 4 }} />

      {/* Bus assembly */}
      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'flex-end', gap: 0 }}>
        {/* Rear bumper */}
        <div style={{ width: '5px', height: '5px', background: border, borderRadius: '1px', marginRight: '-1px', marginBottom: '-2px', zIndex: 3 }} />

        {/* Main passenger body */}
        <div style={{
          position: 'relative',
          flex: 1,
          background: bg,
          border: `2px solid ${border}`,
          borderRadius: '7px 2px 2px 2px',
          padding: '4px 4px 11px',
          minHeight: '50px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.12)${glow ? ', ' + glow : ''}`,
          zIndex: 2,
        }}>
          {/* Windows row + door */}
          <div style={{ display: 'flex', gap: '1.5px', width: '100%', padding: '0 1px', marginTop: '1px', alignItems: 'flex-end' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                flex: 1, height: '7px', maxWidth: '11px',
                background: win, borderRadius: '1.5px',
                border: '1px solid rgba(0,0,0,0.18)',
              }} />
            ))}
            {/* Door section (taller, split) */}
            <div style={{
              flex: '0.9', height: '11px', maxWidth: '10px',
              background: win, borderRadius: '1.5px',
              border: '1px solid rgba(0,0,0,0.18)',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <div style={{ width: '1px', height: '100%', background: 'rgba(0,0,0,0.25)' }} />
            </div>
          </div>

          {/* Trim lines */}
          <div style={{ width: '86%', height: '1px', background: lineCol, marginTop: '1px' }} />
          <div style={{ width: '86%', height: '1px', background: lineCol }} />

          {/* Bus number */}
          <div style={{
            fontSize: '14px', fontWeight: '700', color: text, letterSpacing: '0.04em',
            lineHeight: 1, textShadow: '0 1px 2px rgba(0,0,0,0.3)', marginTop: '1px',
          }}>
            {busNumber}
          </div>

          {/* Status label */}
          <div style={{
            fontSize: '6.5px', fontWeight: '700', letterSpacing: '0.06em', color: text,
            background: 'rgba(0,0,0,0.2)', padding: '1px 4px', borderRadius: '2px',
          }}>
            {statusLabel}
          </div>

          {/* Rear wheel */}
          <div style={{ position: 'absolute', bottom: '-6px', left: '6px', width: '13px', height: '13px', background: '#1a1a1a', border: '2px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '5px', height: '5px', background: '#555', borderRadius: '50%' }} />
          </div>
        </div>

        {/* Hood / engine compartment (protrudes front-right) */}
        <div style={{
          position: 'relative',
          width: '19px',
          alignSelf: 'flex-end',
          background: bg,
          border: `2px solid ${border}`,
          borderLeft: 'none',
          borderRadius: '2px 7px 2px 0',
          height: '28px',
          marginLeft: '-1px',
          boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.12)${glow ? ', ' + glow : ''}`,
          zIndex: 1,
        }}>
          {/* Headlight */}
          <div style={{ position: 'absolute', bottom: '3px', right: '1px', width: '4px', height: '4px', background: 'rgba(255,240,180,0.92)', borderRadius: '1px', border: '1px solid rgba(0,0,0,0.3)' }} />
          {/* Front wheel */}
          <div style={{ position: 'absolute', bottom: '-6px', right: '1px', width: '13px', height: '13px', background: '#1a1a1a', border: '2px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '5px', height: '5px', background: '#555', borderRadius: '50%' }} />
          </div>
        </div>

        {/* Front bumper */}
        <div style={{ width: '5px', height: '5px', background: border, borderRadius: '1px', marginLeft: '-1px', marginBottom: '-2px', zIndex: 3 }} />
      </div>

      {make && (
        <div style={{ fontSize: '7px', color: 'hsl(220,10%,45%)', textAlign: 'center', marginTop: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
          {make}
        </div>
      )}
    </div>
  );
}