import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const FF = "'Courier Prime', monospace";

export default function TechnicianMultiSelect({ value = [], onChange }) {
  const { data: users = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });
  const activeUsers = users.filter(u => u.active !== false);
  const extraNames = value.filter(v => !activeUsers.find(u => u.name === v));

  const toggle = (name) => {
    if (value.includes(name)) onChange(value.filter(v => v !== name));
    else onChange([...value, name]);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '6px 8px', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', maxHeight: '110px', overflowY: 'auto' }}>
      {[...activeUsers.map(u => u.name), ...extraNames].map(name => (
        <label key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: FF, background: value.includes(name) ? 'hsl(220,55%,92%)' : 'hsl(220,15%,95%)', border: '1px solid hsl(220,18%,80%)', borderRadius: '2px', padding: '3px 7px', cursor: 'pointer' }}>
          <input type="checkbox" checked={value.includes(name)} onChange={() => toggle(name)} style={{ margin: 0 }} />
          {name}
        </label>
      ))}
      {activeUsers.length === 0 && extraNames.length === 0 && (
        <span style={{ fontSize: '10px', color: 'hsl(220,10%,55%)' }}>No system users found.</span>
      )}
    </div>
  );
}