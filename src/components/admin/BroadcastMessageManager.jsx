import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Send, XCircle } from 'lucide-react';
import moment from 'moment';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };

export default function BroadcastMessageManager() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data: activeMessages = [] } = useQuery({
    queryKey: ['broadcastMessages'],
    queryFn: () => base44.entities.BroadcastMessage.filter({ is_active: true }, '-created_date'),
  });

  const current = activeMessages[0];

  const sendMutation = useMutation({
    mutationFn: async (message) => {
      await Promise.all(activeMessages.map(m => base44.entities.BroadcastMessage.update(m.id, { is_active: false })));
      return base44.entities.BroadcastMessage.create({ message, is_active: true, acknowledged_by: [] });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['broadcastMessages'] }); setText(''); },
  });

  const clearMutation = useMutation({
    mutationFn: (id) => base44.entities.BroadcastMessage.update(id, { is_active: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['broadcastMessages'] }),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMutation.mutate(text.trim());
  };

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(to right, hsl(0,55%,35%), hsl(0,50%,45%))', color: 'white', padding: '8px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Megaphone style={{ width: 14, height: 14 }} /> BROADCAST MESSAGE
      </div>
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {current && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '2px', padding: '10px', fontSize: '11px' }}>
            <div style={{ fontWeight: '700', color: '#92400e', marginBottom: 4 }}>CURRENT ACTIVE BROADCAST — sent {moment(current.created_date).format('MM/DD/YYYY HH:mm')}</div>
            <div style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>{current.message}</div>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,10%,45%)', marginBottom: 4 }}>ACKNOWLEDGED BY {current.acknowledged_by?.length || 0} USER(S):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 8 }}>
              {(current.acknowledged_by || []).length === 0 && (
                <span style={{ fontSize: '10px', color: 'hsl(220,10%,55%)', fontStyle: 'italic' }}>No one has acknowledged yet.</span>
              )}
              {(current.acknowledged_by || []).map(email => (
                <span key={email} style={{ fontSize: '10px', padding: '2px 7px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '2px' }}>{email}</span>
              ))}
            </div>
            <button onClick={() => clearMutation.mutate(current.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '2px', fontSize: '10px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
              <XCircle style={{ width: 12, height: 12 }} /> DEACTIVATE
            </button>
          </div>
        )}
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message to broadcast to all users on their next login..."
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <button type="submit" disabled={!text.trim() || sendMutation.isPending} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer' }}>
            <Send style={{ width: 12, height: 12 }} /> {sendMutation.isPending ? 'SENDING...' : 'SEND BROADCAST'}
          </button>
        </form>
      </div>
    </div>
  );
}