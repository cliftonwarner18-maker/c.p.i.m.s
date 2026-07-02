import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone } from 'lucide-react';

const FF = "'Courier Prime', monospace";

export default function BroadcastAcknowledge() {
  const [broadcast, setBroadcast] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [acking, setAcking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const messages = await base44.entities.BroadcastMessage.filter({ is_active: true }, '-created_date', 1);
        const msg = messages[0];
        if (!msg || !user?.email) return;
        const ackedLocally = localStorage.getItem(`broadcast_ack_${msg.id}`) === user.email;
        if (ackedLocally || (msg.acknowledged_by || []).includes(user.email)) return;
        setBroadcast(msg);
        setUserEmail(user.email);
      } catch (e) {
        // not logged in or no access — ignore
      }
    })();
  }, []);

  const handleAcknowledge = async () => {
    if (!broadcast || !userEmail) return;
    setAcking(true);
    const updated = Array.from(new Set([...(broadcast.acknowledged_by || []), userEmail]));
    await base44.entities.BroadcastMessage.update(broadcast.id, { acknowledged_by: updated });
    localStorage.setItem(`broadcast_ack_${broadcast.id}`, userEmail);
    setBroadcast(null);
  };

  if (!broadcast) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.65)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FF, padding: '16px'
    }}>
      <div style={{
        background: 'hsl(220,15%,96%)', border: '1px solid hsl(220,18%,60%)',
        width: '100%', maxWidth: 460, boxShadow: '4px 4px 0 rgba(0,0,0,0.4)', borderRadius: '2px'
      }}>
        <div style={{
          background: 'linear-gradient(to right, hsl(0,55%,35%), hsl(0,50%,45%))',
          color: 'white', fontWeight: 'bold', padding: '6px 12px', fontSize: '12px',
          letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Megaphone style={{ width: 14, height: 14 }} />
          SYSTEM ANNOUNCEMENT
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'hsl(220,20%,15%)' }}>
            {broadcast.message}
          </div>
          <button
            onClick={handleAcknowledge}
            disabled={acking}
            style={{ alignSelf: 'flex-end', padding: '8px 18px', background: 'hsl(140,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontWeight: '700', fontFamily: FF, cursor: acking ? 'default' : 'pointer', letterSpacing: '0.05em' }}
          >
            {acking ? 'SAVING...' : 'ACKNOWLEDGE'}
          </button>
        </div>
      </div>
    </div>
  );
}