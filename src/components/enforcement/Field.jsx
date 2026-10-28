import React from 'react';

export const inputCls = 'w-full border border-slate-400 bg-white px-2 py-1 text-xs font-mono';

export function Field({ label, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function TextField({ label, value, onChange, type = 'text', className = '' }) {
  return (
    <Field label={label} className={className}>
      <input type={type} className={inputCls} value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options, className = '' }) {
  return (
    <Field label={label} className={className}>
      <select className={inputCls} value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">--</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}

export function CheckField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-mono">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Section({ title, children }) {
  return (
    <div className="border border-slate-400 bg-slate-50">
      <div className="bg-slate-700 text-white text-[11px] font-bold px-2 py-1 uppercase tracking-wide">{title}</div>
      <div className="p-2 grid grid-cols-2 md:grid-cols-4 gap-2">{children}</div>
    </div>
  );
}