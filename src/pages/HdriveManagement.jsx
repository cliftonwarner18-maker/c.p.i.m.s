import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, Plus, Search, Edit2, Trash2, ArrowRightLeft, AlertTriangle, FileText } from 'lucide-react';
import moment from 'moment';
import jsPDF from 'jspdf';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const FF = "'Courier Prime', monospace";
const inputStyle = { padding: '5px 8px', fontSize: '11px', fontFamily: FF, border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', background: 'white', outline: 'none', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', marginBottom: '3px', display: 'block' };
const rowStyle = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' };
const fieldStyle = { flex: '1', minWidth: '160px' };

const EMPTY_DRIVE = { make: '', model: '', serial_number: '', current_user: '', current_lot: '', current_sublocation: '', seized: false, seizing_agency: '', seizing_person: '', seizure_case_number: '', seizure_date: '', seizure_reason: '', seizure_notes: '' };
const EMPTY_CUSTODY = { hdrive_serial: '', transferred_from: '', transferred_to: '', previous_location: '', new_lot: '', new_sublocation: '', reason: '', transfer_date: '' };
const LOTS = ['Main', 'North', 'Central', 'Other'];

function SectionHeader({ title }) {
  return (
    <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.08em', marginBottom: '10px', marginTop: '4px', borderRadius: '2px' }}>
      {title}
    </div>
  );
}

function Btn({ onClick, children, color = 'hsl(220,55%,38%)', style = {} }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: color, color: 'white', border: 'none', borderRadius: '2px', fontSize: '11px', fontFamily: FF, fontWeight: '700', cursor: 'pointer', ...style }}>
      {children}
    </button>
  );
}

export default function HdriveManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [form, setForm] = useState(EMPTY_DRIVE);
  const [showCustody, setShowCustody] = useState(false);
  const [custodyForm, setCustodyForm] = useState(EMPTY_CUSTODY);
  const [custodyDrive, setCustodyDrive] = useState(null);
  const [showLogs, setShowLogs] = useState(null); // serial number to show logs for
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tab, setTab] = useState('drives'); // 'drives' | 'seized'
  const [exportLot, setExportLot] = useState('');
  const [exportUser, setExportUser] = useState('');

  const getExportDrives = () => {
    let result = drives.filter(d => !d.seized);
    if (exportLot) result = result.filter(d => d.current_lot === exportLot);
    if (exportUser) result = result.filter(d => d.current_user === exportUser);
    return result;
  };

  const drawTable = (doc, headers, rows, startY, colWidths, pageH, marginL, marginR) => {
    const rowH = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const tableWidth = pageWidth - marginL - marginR;
    let y = startY;

    const drawHeader = () => {
      doc.setFillColor(30, 58, 120);
      doc.rect(marginL, y, tableWidth, rowH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      let x = marginL;
      headers.forEach((h, i) => { doc.text(h, x + 1.5, y + 5); x += colWidths[i]; });
      y += rowH;
    };

    drawHeader();

    rows.forEach((row, ri) => {
      if (y + rowH > pageH - 15) {
        doc.addPage();
        y = 15;
        drawHeader();
      }
      doc.setFillColor(ri % 2 === 0 ? 255 : 242, ri % 2 === 0 ? 255 : 246, ri % 2 === 0 ? 255 : 255);
      doc.rect(marginL, y, tableWidth, rowH, 'F');
      doc.setDrawColor(210, 218, 235);
      doc.rect(marginL, y, tableWidth, rowH, 'S');
      doc.setTextColor(30, 30, 30);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      let x = marginL;
      row.forEach((cell, i) => {
        const text = String(cell ?? '—');
        const maxW = colWidths[i] - 3;
        const clipped = doc.getTextWidth(text) > maxW ? text.substring(0, Math.floor(maxW / (doc.getTextWidth(text) / text.length))) + '…' : text;
        if (i === 0 || i === 1) { doc.setFont('courier', 'bold'); } else { doc.setFont('courier', 'normal'); }
        doc.text(clipped, x + 1.5, y + 5);
        x += colWidths[i];
      });
      y += rowH;
    });
    return y;
  };

  const exportAuditPDF = () => {
    const allData = getExportDrives();
    const now = moment().format('MMMM D, YYYY');
    const pageW = 279, pageH = 216, mL = 12, mR = 12;
    const contentW = pageW - mL - mR;

    // Group by user
    const userGroups = {};
    allData.forEach(d => {
      const u = d.current_user || '(Unassigned)';
      if (!userGroups[u]) userGroups[u] = [];
      userGroups[u].push(d);
    });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    let firstPage = true;

    Object.entries(userGroups).forEach(([userName, drives]) => {
      if (!firstPage) doc.addPage();
      firstPage = false;

      // --- HEADER ---
      doc.setFillColor(30, 58, 120);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('courier', 'bold');
      doc.setFontSize(13);
      doc.text('NEW HANOVER COUNTY SCHOOLS', mL, 10);
      doc.setFontSize(9.5);
      doc.text('TRANSPORTATION — H-DRIVE VERIFICATION & ACCOUNTABILITY FORM', mL, 17);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Generated: ${now}   |   CONFIDENTIAL — CHAIN OF CUSTODY`, mL, 24);

      // --- ASSIGNED USER BLOCK ---
      let y = 36;
      doc.setTextColor(30, 58, 120);
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.text('ASSIGNED TO:', mL, y);
      doc.setFont('courier', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(10, 10, 10);
      doc.text(userName, mL + 32, y);
      doc.setDrawColor(30, 58, 120);
      doc.setLineWidth(0.4);
      doc.line(mL + 32, y + 1, mL + 32 + 80, y + 1);

      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 120);
      doc.text('LOT:', 148, y);
      doc.setFont('courier', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(10, 10, 10);
      const lotLabel = exportLot || (drives[0]?.current_lot || '—');
      doc.text(lotLabel, 159, y);

      y += 8;
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`TOTAL DRIVES ISSUED TO THIS USER: ${drives.length}`, mL, y);
      doc.text(`VERIFICATION DATE: _____ / _____ / __________`, 110, y);

      // --- INSTRUCTIONS ---
      y += 8;
      const instrLines = [
        'INSTRUCTIONS: Review each drive listed below. Place a checkmark in the [VER] box to confirm physical',
        'possession. Enter the date verified and your initials in each row.',
      ];
      const instrH = instrLines.length * 5.5 + 4;
      doc.setFillColor(240, 244, 252);
      doc.rect(mL, y, contentW, instrH, 'F');
      doc.setDrawColor(180, 195, 225);
      doc.rect(mL, y, contentW, instrH, 'S');
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(40, 60, 110);
      instrLines.forEach((line, li) => {
        doc.text(line, mL + 2, y + 4.5 + li * 5.5);
      });
      y += instrH;

      // --- TABLE HEADER ---
      y += 12;
      const col = { brand: 32, serial: 52, location: 110, ver: 14, date: 28, init: 16 };
      // Header
      doc.setFillColor(30, 58, 120);
      doc.rect(mL, y, contentW, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      let x = mL;
      doc.text('BRAND', x + 1.5, y + 5.5); x += col.brand;
      doc.text('SERIAL NUMBER', x + 1.5, y + 5.5); x += col.serial;
      doc.text('CURRENT LOT / LOCATION', x + 1.5, y + 5.5); x += col.location;
      doc.text('[VER]', x + 1.5, y + 5.5); x += col.ver;
      doc.text('DATE __/__/____', x + 1.5, y + 5.5); x += col.date;
      doc.text('INIT.', x + 1.5, y + 5.5);
      y += 8;

      // --- TABLE ROWS ---
      const rowH = 9;
      drives.forEach((d, ri) => {
        if (y + rowH > pageH - 70) {
          doc.addPage();
          y = 15;
          // Re-draw mini header on continuation
          doc.setFillColor(30, 58, 120);
          doc.rect(mL, y, contentW, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('courier', 'bold');
          doc.setFontSize(8);
          x = mL;
          doc.text('BRAND', x + 1.5, y + 5.5); x += col.brand;
          doc.text('SERIAL NUMBER', x + 1.5, y + 5.5); x += col.serial;
          doc.text('CURRENT LOT / LOCATION', x + 1.5, y + 5.5); x += col.location;
          doc.text('[VER]', x + 1.5, y + 5.5); x += col.ver;
          doc.text('DATE __/__/____', x + 1.5, y + 5.5); x += col.date;
          doc.text('INIT.', x + 1.5, y + 5.5);
          y += 8;
        }

        const bg = ri % 2 === 0 ? [255, 255, 255] : [245, 248, 255];
        doc.setFillColor(...bg);
        doc.rect(mL, y, contentW, rowH, 'F');
        doc.setDrawColor(200, 210, 228);
        doc.rect(mL, y, contentW, rowH, 'S');

        doc.setTextColor(20, 20, 20);
        doc.setFont('courier', 'bold');
        doc.setFontSize(8.5);
        x = mL;
        doc.text(String(d.make || '—'), x + 1.5, y + 6); x += col.brand;

        doc.setFont('courier', 'bold');
        doc.setFontSize(8.5);
        doc.text(String(d.serial_number || '—'), x + 1.5, y + 6); x += col.serial;

        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        const loc = [d.current_lot, d.current_sublocation].filter(Boolean).join(' — ') || d.current_location || '—';
        const maxLocW = col.location - 3;
        const locText = doc.getStringUnitWidth(loc) * 7.5 / doc.internal.scaleFactor > maxLocW
          ? loc.substring(0, 38) + '…' : loc;
        doc.text(locText, x + 1.5, y + 6); x += col.location;

        // Checkbox
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.5);
        doc.rect(x + 2, y + 1.5, 6, 6, 'S');
        x += col.ver;

        // Date line
        doc.setLineWidth(0.3);
        doc.line(x + 1, y + rowH - 1.5, x + col.date - 2, y + rowH - 1.5);
        x += col.date;

        // Initials line
        doc.line(x + 1, y + rowH - 1.5, x + col.init - 2, y + rowH - 1.5);

        y += rowH;
      });

      // --- DISCLOSURE / SIGNATURE BLOCK ---
      y += 6;

      const disclosureLines = [
        'By signing below, I hereby acknowledge and certify the following:',
        '',
        '1. I have physically verified each H-Drive listed above and confirm that all listed drives are in my',
        '   possession and/or secured at the location indicated.',
        '',
        '2. I understand that the H-Drives assigned to me contain recorded surveillance footage and are the',
        '   property of New Hanover County Schools Transportation Department.',
        '',
        '3. I accept full personal responsibility for the safekeeping of each drive. Negligent damage, loss,',
        '   or unauthorized transfer of any H-Drive is my sole responsibility and may result in disciplinary action.',
        '',
        '4. I understand that any discrepancy noted above must be reported immediately to a supervisor.',
      ];
      const lineH = 4.8;
      const disclosureTextH = disclosureLines.length * lineH;
      const sigH = 10;
      const boxH = 9 + disclosureTextH + sigH + 4; // header + text + sig + padding

      if (y + boxH > pageH - 10) { doc.addPage(); y = 20; }

      const boxTop = y;
      doc.setDrawColor(30, 58, 120);
      doc.setLineWidth(0.6);
      doc.rect(mL, boxTop, contentW, boxH, 'S');

      doc.setFillColor(30, 58, 120);
      doc.rect(mL, boxTop, contentW, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.text('ACKNOWLEDGMENT & RESPONSIBILITY DISCLOSURE', mL + 3, boxTop + 5);
      y = boxTop + 10;

      doc.setTextColor(20, 20, 20);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.8);
      disclosureLines.forEach(line => {
        doc.text(line, mL + 3, y);
        y += lineH;
      });

      y += 4;
      doc.setLineWidth(0.4);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 58, 120);
      doc.text('SIGNATURE:', mL + 3, y);
      doc.setDrawColor(40, 40, 40);
      doc.line(mL + 26, y, mL + 110, y);
      doc.text('DATE:', mL + 115, y);
      doc.line(mL + 128, y, mL + 200, y);
    });

    // Page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`NHCS Transportation — H-Drive Verification Form — Page ${i} of ${totalPages}`, mL, pageH - 5);
      doc.text('CONFIDENTIAL', 248, pageH - 5);
    }

    doc.save(`NHCS_HDrive_Verification_${moment().format('YYYYMMDD_HHmm')}.pdf`);
  };

  const exportInventoryPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const data = getExportDrives();
    const now = moment().format('MMMM D, YYYY');
    const filterLabel = [exportLot || 'All Lots', exportUser ? `User: ${exportUser}` : 'All Users'].join(' — ');
    const pageW = 279, pageH = 216, mL = 10, mR = 10;

    doc.setFillColor(45, 80, 140);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.text('NHCS H-DRIVE SIMPLE INVENTORY', mL, 9);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(`${now}   |   ${filterLabel}   |   ${data.length} Drives`, mL, 16);

    const cols = [10, 32, 20, 28, 32, 20, 110]; // total ~252
    drawTable(doc,
      ['#', 'SERIAL NUMBER', 'MAKE', 'MODEL', 'CURRENT USER', 'LOT', 'SUB LOCATION'],
      data.map((d, i) => [i + 1, d.serial_number, d.make, d.model, d.current_user || '—', d.current_lot || '—', d.current_sublocation || '—']),
      24, cols, pageH, mL, mR
    );

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`NHCS VSS — H-Drive Inventory — Page ${i} of ${pages}`, mL, pageH - 5);
    }
    doc.save(`NHCS_HDrive_Inventory_${moment().format('YYYYMMDD_HHmm')}.pdf`);
  };

  const { data: drives = [], isLoading } = useQuery({
    queryKey: ['hdrives'],
    queryFn: () => base44.entities.HDrive.list('serial_number'),
  });

  const { data: systemUsers = [] } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => base44.entities.SystemUser.list('name'),
  });
  const activeUsers = systemUsers.filter(u => u.active !== false);

  const { data: custodyLogs = [] } = useQuery({
    queryKey: ['custodyLogs'],
    queryFn: () => base44.entities.CustodyLog.list('-transfer_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HDrive.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setShowForm(false); setForm(EMPTY_DRIVE); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HDrive.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setShowForm(false); setEditDrive(null); setForm(EMPTY_DRIVE); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HDrive.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hdrives'] }); setDeleteTarget(null); },
  });

  const custodyMutation = useMutation({
    mutationFn: async ({ driveId, logData, driveUpdates }) => {
      await base44.entities.CustodyLog.create({ ...logData, transfer_date: new Date().toISOString() });
      await base44.entities.HDrive.update(driveId, driveUpdates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hdrives'] });
      queryClient.invalidateQueries({ queryKey: ['custodyLogs'] });
      setShowCustody(false);
      setCustodyDrive(null);
      setCustodyForm(EMPTY_CUSTODY);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const combined = [form.current_lot, form.current_sublocation].filter(Boolean).join(' — ');
    const data = { ...form, current_location: combined };
    if (editDrive) updateMutation.mutate({ id: editDrive.id, data });
    else createMutation.mutate(data);
  };

  const openEdit = (drive) => {
    setEditDrive(drive);
    // Try to split stored location back into lot/sublocation
    const parts = (drive.current_location || '').split(' — ');
    const lot = LOTS.includes(parts[0]) ? parts[0] : '';
    const sub = lot ? parts.slice(1).join(' — ') : (drive.current_location || '');
    setForm({ ...drive, current_lot: lot, current_sublocation: sub });
    setShowForm(true);
  };

  const openCustody = (drive) => {
    setCustodyDrive(drive);
    setCustodyForm({ ...EMPTY_CUSTODY, hdrive_serial: drive.serial_number, previous_location: drive.current_location || '', transferred_from: drive.current_user || '', new_lot: '', new_sublocation: '' });
    setShowCustody(true);
  };

  const handleCustodySubmit = (e) => {
    e.preventDefault();
    const newLocation = [custodyForm.new_lot, custodyForm.new_sublocation].filter(Boolean).join(' — ');
    custodyMutation.mutate({
      driveId: custodyDrive.id,
      logData: { ...custodyForm, new_location: newLocation },
      driveUpdates: { current_user: custodyForm.transferred_to, current_location: newLocation },
    });
  };

  const filtered = drives.filter(d => {
    const q = search.toLowerCase();
    return !q || d.serial_number?.toLowerCase().includes(q) || d.make?.toLowerCase().includes(q) || d.model?.toLowerCase().includes(q) || d.current_user?.toLowerCase().includes(q);
  });

  const displayDrives = tab === 'seized' ? filtered.filter(d => d.seized) : filtered.filter(d => !d.seized);
  const seizedCount = drives.filter(d => d.seized).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: FF }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '10px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>H-DRIVE MANAGEMENT</div>
            <div style={{ fontSize: '10px', opacity: 0.8 }}>CHAIN OF CUSTODY &amp; SEIZURE TRACKING — {drives.length} DRIVES ON RECORD</div>
          </div>
        </div>
        <Btn onClick={() => { setEditDrive(null); setForm(EMPTY_DRIVE); setShowForm(true); }} style={{ background: 'hsl(140,55%,38%)' }}>
          <Plus style={{ width: 12, height: 12 }} /> ADD DRIVE
        </Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL DRIVES', value: drives.length, color: 'hsl(220,55%,40%)' },
          { label: 'ACTIVE', value: drives.filter(d => !d.seized).length, color: 'hsl(140,55%,35%)' },
          { label: 'SEIZED', value: seizedCount, color: 'hsl(0,65%,45%)' },
          { label: 'CUSTODY LOGS', value: custodyLogs.length, color: 'hsl(220,30%,45%)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '8px 14px', minWidth: '120px', flex: '1' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: s.color, fontFamily: "'VT323', monospace" }}>{s.value}</div>
            <div style={{ fontSize: '9px', letterSpacing: '0.07em', color: 'hsl(220,10%,50%)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Export Panel */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px' }}>
        <div style={{ fontSize: '10px', fontWeight: '700', color: 'hsl(220,20%,35%)', letterSpacing: '0.06em', alignSelf: 'center', marginRight: '4px' }}>PDF EXPORT:</div>
        <div>
          <div style={labelStyle}>FILTER BY LOT</div>
          <select value={exportLot} onChange={e => setExportLot(e.target.value)} style={{ ...inputStyle, width: '130px' }}>
            <option value="">All Lots</option>
            {LOTS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <div style={labelStyle}>FILTER BY USER</div>
          <select value={exportUser} onChange={e => setExportUser(e.target.value)} style={{ ...inputStyle, width: '160px' }}>
            <option value="">All Users</option>
            {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
        </div>
        <Btn onClick={exportAuditPDF} style={{ background: 'hsl(220,55%,38%)' }}>
          <FileText style={{ width: 12, height: 12 }} /> AUDIT SHEET (PDF)
        </Btn>
        <Btn onClick={exportInventoryPDF} style={{ background: 'hsl(200,60%,38%)' }}>
          <FileText style={{ width: 12, height: 12 }} /> SIMPLE INVENTORY (PDF)
        </Btn>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px' }}>
          <SectionHeader title={editDrive ? `EDIT DRIVE — ${editDrive.serial_number}` : 'ADD NEW H-DRIVE'} />
          <form onSubmit={handleSubmit}>
            <div style={rowStyle}>
              <div style={fieldStyle}><label style={labelStyle}>MAKE *</label><input required value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} style={inputStyle} placeholder="e.g. SEON, Safety Vision" /></div>
              <div style={fieldStyle}><label style={labelStyle}>MODEL *</label><input required value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} style={inputStyle} /></div>
              <div style={fieldStyle}><label style={labelStyle}>SERIAL NUMBER *</label><input required value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>CURRENT USER</label>
                <select value={form.current_user} onChange={e => setForm({ ...form, current_user: e.target.value })} style={inputStyle}>
                  <option value="">— Select User —</option>
                  {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` — ${u.role}` : ''}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>LOT (GENERAL LOCATION)</label>
                <select value={form.current_lot || ''} onChange={e => setForm({ ...form, current_lot: e.target.value })} style={inputStyle}>
                  <option value="">— Select Lot —</option>
                  {LOTS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>SUB LOCATION (PINPOINTED)</label>
                <input value={form.current_sublocation || ''} onChange={e => setForm({ ...form, current_sublocation: e.target.value })} style={inputStyle} placeholder="e.g. Officer drawer left side locked" />
              </div>
            </div>

            {/* Seizure */}
            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="seized" checked={!!form.seized} onChange={e => setForm({ ...form, seized: e.target.checked })} style={{ width: 14, height: 14 }} />
              <label htmlFor="seized" style={{ ...labelStyle, marginBottom: 0, color: 'hsl(0,65%,40%)', cursor: 'pointer' }}>MARK AS SEIZED</label>
            </div>
            {form.seized && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '2px', padding: '10px', marginBottom: '10px' }}>
                <div style={rowStyle}>
                  <div style={fieldStyle}><label style={labelStyle}>SEIZING AGENCY</label><input value={form.seizing_agency} onChange={e => setForm({ ...form, seizing_agency: e.target.value })} style={inputStyle} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>SEIZING PERSON</label><input value={form.seizing_person} onChange={e => setForm({ ...form, seizing_person: e.target.value })} style={inputStyle} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>CASE NUMBER</label><input value={form.seizure_case_number} onChange={e => setForm({ ...form, seizure_case_number: e.target.value })} style={inputStyle} /></div>
                </div>
                <div style={rowStyle}>
                  <div style={fieldStyle}><label style={labelStyle}>SEIZURE DATE</label><input type="datetime-local" value={form.seizure_date ? moment(form.seizure_date).format('YYYY-MM-DDTHH:mm') : ''} onChange={e => setForm({ ...form, seizure_date: e.target.value ? new Date(e.target.value).toISOString() : '' })} style={inputStyle} /></div>
                  <div style={fieldStyle}><label style={labelStyle}>REASON</label><input value={form.seizure_reason} onChange={e => setForm({ ...form, seizure_reason: e.target.value })} style={inputStyle} placeholder="e.g. Title 9, Crash, Investigation" /></div>
                </div>
                <div><label style={labelStyle}>SEIZURE NOTES</label><textarea value={form.seizure_notes} onChange={e => setForm({ ...form, seizure_notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid hsl(220,18%,85%)' }}>
              <button type="button" onClick={() => { setShowForm(false); setEditDrive(null); }} style={{ padding: '7px 14px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>CANCEL</button>
              <Btn onClick={null} style={{ padding: '7px 18px', background: 'hsl(140,55%,38%)' }}>
                {(createMutation.isPending || updateMutation.isPending) ? 'SAVING...' : editDrive ? 'SAVE CHANGES' : 'ADD DRIVE'}
              </Btn>
            </div>
          </form>
        </div>
      )}

      {/* Custody Transfer Form */}
      {showCustody && custodyDrive && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '14px' }}>
          <SectionHeader title={`CUSTODY TRANSFER — ${custodyDrive.serial_number}`} />
          <form onSubmit={handleCustodySubmit}>
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>TRANSFERRED FROM *</label>
                <select required value={custodyForm.transferred_from} onChange={e => setCustodyForm({ ...custodyForm, transferred_from: e.target.value })} style={inputStyle}>
                  <option value="">— Select User —</option>
                  {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` — ${u.role}` : ''}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>TRANSFERRED TO *</label>
                <select required value={custodyForm.transferred_to} onChange={e => setCustodyForm({ ...custodyForm, transferred_to: e.target.value })} style={inputStyle}>
                  <option value="">— Select User —</option>
                  {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}{u.role ? ` — ${u.role}` : ''}</option>)}
                </select>
              </div>
            </div>
            <div style={rowStyle}>
              <div style={fieldStyle}><label style={labelStyle}>PREVIOUS LOCATION</label><input readOnly value={custodyForm.previous_location} style={{ ...inputStyle, background: 'hsl(220,15%,96%)', color: 'hsl(220,10%,50%)' }} /></div>
              <div style={fieldStyle}>
                <label style={labelStyle}>NEW LOT *</label>
                <select required value={custodyForm.new_lot || ''} onChange={e => setCustodyForm({ ...custodyForm, new_lot: e.target.value })} style={inputStyle}>
                  <option value="">— Select Lot —</option>
                  {LOTS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>NEW SUB LOCATION *</label>
                <input required value={custodyForm.new_sublocation || ''} onChange={e => setCustodyForm({ ...custodyForm, new_sublocation: e.target.value })} style={inputStyle} placeholder="e.g. Officer drawer left side locked" />
              </div>
            </div>
            <div><label style={labelStyle}>REASON FOR TRANSFER</label><textarea value={custodyForm.reason} onChange={e => setCustodyForm({ ...custodyForm, reason: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: '10px' }} /></div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid hsl(220,18%,85%)' }}>
              <button type="button" onClick={() => { setShowCustody(false); setCustodyDrive(null); }} style={{ padding: '7px 14px', background: 'hsl(220,18%,88%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,70%)', borderRadius: '2px', fontSize: '11px', fontFamily: FF, cursor: 'pointer' }}>CANCEL</button>
              <Btn style={{ padding: '7px 18px' }}>{custodyMutation.isPending ? 'SAVING...' : 'LOG TRANSFER'}</Btn>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        label={`H-Drive ${deleteTarget?.serial_number}`}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'hsl(220,18%,90%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '4px' }}>
        {[['drives', 'ALL DRIVES'], ['seized', `SEIZED (${seizedCount})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '5px 14px', fontSize: '11px', fontFamily: FF, fontWeight: '700', border: 'none', borderRadius: '2px', cursor: 'pointer', background: tab === key ? 'hsl(220,55%,38%)' : 'transparent', color: tab === key ? 'white' : 'hsl(220,20%,30%)', letterSpacing: '0.05em' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Search style={{ width: 14, height: 14, color: 'hsl(220,10%,50%)', flexShrink: 0 }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by serial, make, model, user..." style={{ ...inputStyle, maxWidth: '360px' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '11px', color: 'hsl(220,10%,50%)', fontFamily: FF }}>LOADING...</div>
        ) : displayDrives.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', fontSize: '11px', color: 'hsl(220,10%,50%)', fontFamily: FF }}>NO DRIVES FOUND</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: FF }}>
            <thead>
              <tr style={{ background: 'hsl(220,18%,94%)', borderBottom: '2px solid hsl(220,18%,75%)' }}>
                {['SERIAL NUMBER', 'MAKE', 'MODEL', 'CURRENT USER', 'CURRENT LOCATION', 'STATUS', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.07em', color: 'hsl(220,20%,30%)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayDrives.map((drive, i) => (
                <tr key={drive.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,12%,98%)', borderBottom: '1px solid hsl(220,18%,88%)' }}>
                  <td style={{ padding: '6px 8px', fontWeight: '700' }}>{drive.serial_number}</td>
                  <td style={{ padding: '6px 8px' }}>{drive.make}</td>
                  <td style={{ padding: '6px 8px' }}>{drive.model}</td>
                  <td style={{ padding: '6px 8px' }}>{drive.current_user || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>{drive.current_location || '—'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{ background: drive.seized ? '#fef2f2' : '#f0fdf4', color: drive.seized ? '#991b1b' : '#166534', border: `1px solid ${drive.seized ? '#fecaca' : '#bbf7d0'}`, borderRadius: '2px', padding: '2px 7px', fontSize: '10px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {drive.seized ? 'SEIZED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 8px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                      <button title="Transfer Custody" onClick={() => openCustody(drive)} style={{ padding: '3px 7px', background: 'hsl(220,55%,38%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontFamily: FF }}>
                        <ArrowRightLeft style={{ width: 11, height: 11 }} />
                      </button>
                      <button title="View Logs" onClick={() => setShowLogs(showLogs === drive.serial_number ? null : drive.serial_number)} style={{ padding: '3px 7px', background: 'hsl(45,70%,45%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontFamily: FF, fontWeight: '700' }}>
                        LOG
                      </button>
                      <button title="Edit" onClick={() => openEdit(drive)} style={{ padding: '3px 7px', background: 'hsl(220,18%,82%)', color: 'hsl(220,20%,20%)', border: '1px solid hsl(220,18%,65%)', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontFamily: FF }}>
                        <Edit2 style={{ width: 11, height: 11 }} />
                      </button>
                      <button title="Delete" onClick={() => setDeleteTarget(drive)} style={{ padding: '3px 7px', background: 'hsl(0,65%,45%)', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px', fontFamily: FF }}>
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Custody Logs inline */}
      {showLogs && (
        <div style={{ background: 'white', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '12px' }}>
          <SectionHeader title={`CUSTODY LOG — ${showLogs}`} />
          {custodyLogs.filter(l => l.hdrive_serial === showLogs).length === 0 ? (
            <div style={{ fontSize: '11px', color: 'hsl(220,10%,50%)', padding: '8px 0' }}>No custody logs found for this drive.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: FF }}>
              <thead>
                <tr style={{ background: 'hsl(220,18%,94%)', borderBottom: '1px solid hsl(220,18%,75%)' }}>
                  {['DATE/TIME', 'FROM', 'TO', 'PREV LOCATION', 'NEW LOCATION', 'REASON'].map(h => (
                    <th key={h} style={{ padding: '5px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em', color: 'hsl(220,20%,30%)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {custodyLogs.filter(l => l.hdrive_serial === showLogs).map((log, i) => (
                  <tr key={log.id} style={{ background: i % 2 === 0 ? 'white' : 'hsl(220,12%,98%)', borderBottom: '1px solid hsl(220,18%,88%)' }}>
                    <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{log.transfer_date ? moment(log.transfer_date).format('MM/DD/YYYY HH:mm') : '—'}</td>
                    <td style={{ padding: '5px 8px' }}>{log.transferred_from}</td>
                    <td style={{ padding: '5px 8px' }}>{log.transferred_to}</td>
                    <td style={{ padding: '5px 8px' }}>{log.previous_location || '—'}</td>
                    <td style={{ padding: '5px 8px' }}>{log.new_location}</td>
                    <td style={{ padding: '5px 8px' }}>{log.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ fontSize: '10px', color: 'hsl(220,10%,55%)', fontFamily: FF, paddingBottom: '4px' }}>
        SHOWING {displayDrives.length} OF {drives.length} DRIVES
      </div>
    </div>
  );
}