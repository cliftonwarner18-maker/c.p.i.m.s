import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { Save, X } from 'lucide-react';

export default function BusForm({ bus, onClose, onSaved }) {
  const [form, setForm] = useState({
    bus_number: '', bus_type: 'School Bus', base_location: 'Main', year: '', make: '', model: '',
    vin: '', engine: '', passenger_capacity: '', wheelchair_accessible: false,
    asset_number: '', camera_system_type: 'None', camera_serial_number: '',
    camera_model_number: '', samsara_enabled: false, samsara_av_enabled: false,
    samsara_inputs_enabled: false, dash_cam_sid: '', gateway_sid: '',
    next_inspection_due: '', status: 'Active', notes: '',
  });

  useEffect(() => {
    if (bus) {
      setForm({
        bus_number: bus.bus_number || '',
        bus_type: bus.bus_type || 'School Bus',
        base_location: bus.base_location || 'Main',
        year: bus.year || '',
        make: bus.make || '',
        model: bus.model || '',
        vin: bus.vin || '',
        engine: bus.engine || '',
        passenger_capacity: bus.passenger_capacity || '',
        wheelchair_accessible: bus.wheelchair_accessible || false,
        asset_number: bus.asset_number || '',
        camera_system_type: bus.camera_system_type || 'None',
        camera_serial_number: bus.camera_serial_number || '',
        camera_model_number: bus.camera_model_number || '',
        samsara_enabled: bus.samsara_enabled || false,
        samsara_av_enabled: bus.samsara_av_enabled || false,
        samsara_inputs_enabled: bus.samsara_inputs_enabled || false,
        dash_cam_sid: bus.dash_cam_sid || '',
        gateway_sid: bus.gateway_sid || '',
        next_inspection_due: bus.next_inspection_due || '',
        status: bus.status || 'Active',
        notes: bus.notes || '',
      });
    }
  }, [bus]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Bus.create(data),
    onSuccess: onSaved,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Bus.update(bus.id, data),
    onSuccess: onSaved,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, passenger_capacity: form.passenger_capacity ? Number(form.passenger_capacity) : null };
    if (bus) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleFieldChange = useCallback((field, value) => {
    setForm(prev => ({...prev, [field]: value}));
  }, []);

  const Field = ({ label, children }) => (
    <div style={{display:'flex',flexDirection:'column',width:'100%',marginBottom:'12px'}}>
      <label style={{fontSize:'10px',fontWeight:'bold',display:'block',marginBottom:'4px',width:'100%'}}>{label}</label>
      {children}
    </div>
  );

  const Check = React.memo(({ label, checked, onChange }) => (
    <label style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',cursor:'pointer'}}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{accentColor:'hsl(220,70%,35%)'}} />
      {label}
    </label>
  ));

  return (
    <WinWindow title={bus ? `EDIT VEHICLE — BUS #${bus.bus_number}` : 'ADD NEW VEHICLE'} icon="🚌">
      <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',width:'100%',padding:'16px'}}>
        {/* Vehicle Info */}
         <div style={{display:'flex',flexDirection:'column',width:'100%',marginBottom:'12px'}}>
           <div style={{width:'100%',display:'block',backgroundColor:'hsl(220,70%,35%)',color:'white',padding:'8px 12px',fontFamily:'monospace',fontSize:'11px',fontWeight:'bold',boxSizing:'border-box',marginBottom:'12px'}}>▸ VEHICLE INFORMATION</div>
           <div style={{display:'flex',flexDirection:'column',gap:'0',width:'100%'}}>
            <Field label="BUS # *">
               <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.bus_number} onChange={e => handleFieldChange('bus_number', e.target.value)} required />
             </Field>
            <Field label="BUS TYPE *">
              <select className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.bus_type} onChange={e => handleFieldChange('bus_type', e.target.value)} required>
                <option value="School Bus">School Bus</option>
                <option value="Activity Bus">Activity Bus</option>
              </select>
            </Field>
            <Field label="YEAR">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.year} onChange={e => handleFieldChange('year', e.target.value)} />
            </Field>
            <Field label="MAKE">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.make} onChange={e => handleFieldChange('make', e.target.value)} />
            </Field>
            <Field label="MODEL">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.model} onChange={e => handleFieldChange('model', e.target.value)} />
            </Field>
            <Field label="VIN">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.vin} onChange={e => handleFieldChange('vin', e.target.value)} />
            </Field>
            <Field label="ENGINE">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.engine} onChange={e => handleFieldChange('engine', e.target.value)} />
            </Field>
            <Field label="CAPACITY">
              <input type="number" className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.passenger_capacity} onChange={e => handleFieldChange('passenger_capacity', e.target.value)} />
            </Field>
            <Field label="BASE LOCATION">
              <select className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.base_location} onChange={e => setForm({...form, base_location: e.target.value})}>
                <option value="Main">Main</option>
                <option value="North">North</option>
                <option value="Central">Central</option>
                <option value="Sold">Sold</option>
              </select>
            </Field>
            <Field label="STATUS">
              <select className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Active">Active</option>
                <option value="Out of Service">Out of Service</option>
                <option value="Retired">Retired</option>
              </select>
            </Field>
            <Field label="INSP. DUE">
              <input type="date" className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.next_inspection_due} onChange={e => handleFieldChange('next_inspection_due', e.target.value)} />
            </Field>
            <div style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',cursor:'pointer',marginBottom:'12px'}}>
             <input type="checkbox" checked={form.wheelchair_accessible} onChange={e => handleFieldChange('wheelchair_accessible', e.target.checked)} style={{accentColor:'hsl(220,70%,35%)'}} />
             WHEELCHAIR
            </div>
          </div>
        </div>

        {/* Camera System */}
         <div style={{display:'flex',flexDirection:'column',width:'100%',marginBottom:'12px'}}>
           <div style={{width:'100%',display:'block',backgroundColor:'hsl(220,70%,35%)',color:'white',padding:'8px 12px',fontFamily:'monospace',fontSize:'11px',fontWeight:'bold',boxSizing:'border-box',marginBottom:'12px'}}>▸ CAMERA SYSTEM</div>
          <div style={{display:'flex',flexDirection:'column',gap:'0',width:'100%'}}>
            <Field label="CAMERA SYSTEM">
              <select className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.camera_system_type} onChange={e => setForm({...form, camera_system_type: e.target.value})}>
                <option value="Seon">Seon</option>
                <option value="Safety Vision">Safety Vision</option>
                <option value="None">None</option>
              </select>
            </Field>
            <Field label="SERIAL #">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.camera_serial_number} onChange={e => handleFieldChange('camera_serial_number', e.target.value)} />
            </Field>
            <Field label="MODEL #">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.camera_model_number} onChange={e => handleFieldChange('camera_model_number', e.target.value)} />
            </Field>
            <Field label="DVR ASSET #">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.asset_number} onChange={e => handleFieldChange('asset_number', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* AI Camera / Samsara */}
         <div style={{display:'flex',flexDirection:'column',width:'100%',marginBottom:'12px'}}>
           <div style={{width:'100%',display:'block',backgroundColor:'hsl(220,70%,35%)',color:'white',padding:'8px 12px',fontFamily:'monospace',fontSize:'11px',fontWeight:'bold',boxSizing:'border-box',marginBottom:'12px'}}>▸ AI CAMERA SYSTEM (SAMSARA)</div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'12px'}}>
            <Check label="Samsara" checked={form.samsara_enabled} onChange={e => handleFieldChange('samsara_enabled', e.target.checked)} />
            <Check label="Sam AV" checked={form.samsara_av_enabled} onChange={e => handleFieldChange('samsara_av_enabled', e.target.checked)} />
            <Check label="Sam Inputs" checked={form.samsara_inputs_enabled} onChange={e => handleFieldChange('samsara_inputs_enabled', e.target.checked)} />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'0',width:'100%'}}>
            <Field label="DASH CAM SID#">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.dash_cam_sid} onChange={e => handleFieldChange('dash_cam_sid', e.target.value)} />
            </Field>
            <Field label="GATEWAY SID#">
              <input className="win-input" style={{width:'100%',fontSize:'11px'}} value={form.gateway_sid} onChange={e => handleFieldChange('gateway_sid', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Notes */}
         <div style={{display:'flex',flexDirection:'column',width:'100%',marginBottom:'12px'}}>
           <div style={{width:'100%',display:'block',backgroundColor:'hsl(220,70%,35%)',color:'white',padding:'8px 12px',fontFamily:'monospace',fontSize:'11px',fontWeight:'bold',boxSizing:'border-box',marginBottom:'12px'}}>▸ NOTES</div>
           <div style={{display:'flex',flexDirection:'column',width:'100%'}}>

          <textarea className="win-input" style={{width:'100%',fontSize:'11px',height:'60px',resize:'none',display:'block'}} value={form.notes} onChange={e => handleFieldChange('notes', e.target.value)} />
          </div>
          </div>

        {/* Legacy Upload */}
        <div style={{display:'flex',flexDirection:'column',width:'100%',marginBottom:'12px'}}>
          <div style={{width:'100%',display:'block',backgroundColor:'hsl(220,70%,35%)',color:'white',padding:'8px 12px',fontFamily:'monospace',fontSize:'11px',fontWeight:'bold',boxSizing:'border-box',marginBottom:'12px'}}>▸ LEGACY UPLOAD</div>
          <div style={{display:'flex',flexDirection:'column',width:'100%'}}>

          <textarea className="win-input" style={{width:'100%',fontSize:'11px',height:'120px',fontFamily:'monospace',resize:'none',display:'block'}} placeholder="Paste audit/repair log text here..." value={form.legacy_upload || ''} onChange={e => handleFieldChange('legacy_upload', e.target.value)} />
          <div style={{fontSize:'9px',color:'hsl(220,10%,40%)',marginTop:'2px'}}>Audit/repair log text — will be preserved with vehicle record</div>
          </div>
          </div>

        <div style={{display:'flex',gap:'4px'}}>
          <button type="submit" className="win-button" style={{display:'flex',alignItems:'center',gap:'4px',background:'hsl(220,70%,35%)',color:'white'}} disabled={isPending}>
             <Save className="w-3 h-3" /> {isPending ? 'SAVING...' : 'SAVE VEHICLE'}
           </button>
           <button type="button" className="win-button" style={{display:'flex',alignItems:'center',gap:'4px'}} onClick={onClose}>
             <X className="w-3 h-3" /> CANCEL
           </button>
        </div>
      </form>
    </WinWindow>
  );
}