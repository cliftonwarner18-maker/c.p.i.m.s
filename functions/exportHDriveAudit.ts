import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { search, userFilter, locationFilter, seizedOnly } = body;

    let drives = await base44.entities.HDrive.list('-created_date');

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      drives = drives.filter(d =>
        d.serial_number?.toLowerCase().includes(s) ||
        d.make?.toLowerCase().includes(s) ||
        d.model?.toLowerCase().includes(s) ||
        d.current_user?.toLowerCase().includes(s) ||
        d.current_location?.toLowerCase().includes(s)
      );
    }

    if (userFilter && userFilter.trim()) {
      drives = drives.filter(d => d.current_user === userFilter.trim());
    }

    if (locationFilter && locationFilter.trim()) {
      const lf = locationFilter.trim().toLowerCase();
      drives = drives.filter(d => d.current_location?.toLowerCase().includes(lf));
    }

    if (seizedOnly) {
      drives = drives.filter(d => d.seized === true);
    }

    const allCustody = await base44.entities.CustodyLog.list('-transfer_date');

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;

    const addHeader = (pg) => {
      // Agency header
      doc.setFillColor(30, 60, 120);
      doc.rect(margin, 6, pageWidth - margin * 2, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.text('NEW HANOVER COUNTY SCHOOLS - TRANSPORTATION DEPT.', pageWidth / 2, 12, { align: 'center' });
      doc.setFontSize(8);
      doc.text('MOBILE VEHICLE SURVEILLANCE SYSTEM - H-DRIVE CHAIN OF CUSTODY AUDIT REPORT', pageWidth / 2, 17, { align: 'center' });
      doc.setTextColor(0, 0, 0);

      // Report meta line
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      const filterParts = [];
      if (userFilter) filterParts.push(`User: ${userFilter}`);
      if (locationFilter) filterParts.push(`Location: ${locationFilter}`);
      if (seizedOnly) filterParts.push('SEIZED ONLY');
      if (search) filterParts.push(`Search: "${search}"`);
      const meta = `Generated: ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')}   |   Records: ${drives.length}${filterParts.length ? '   |   Filters: ' + filterParts.join(', ') : ''}   |   Page ${pg}`;
      doc.text(meta, pageWidth / 2, 23, { align: 'center' });
    };

    let pageNum = 1;
    addHeader(pageNum);

    // Section title
    let y = 29;
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('INVENTORY AUDIT - CHAIN OF CUSTODY VERIFICATION', margin, y);
    y += 5;

    // Column layout for inventory table
    // Columns: #, Serial, Make/Model, Current User, Location, Custody Count, | Date line | Check | Initials
    const cols = {
      num:    { x: margin,      w: 8 },
      serial: { x: margin + 8,  w: 28 },
      make:   { x: margin + 36, w: 28 },
      user:   { x: margin + 64, w: 32 },
      loc:    { x: margin + 96, w: 50 },
      hist:   { x: margin + 146, w: 10 },
      // audit columns
      date:   { x: margin + 156, w: 38 },
      chk:    { x: margin + 194, w: 12 },
      init:   { x: margin + 206, w: pageWidth - margin - 206 - margin },
    };

    // Header row
    doc.setFillColor(50, 80, 150);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.text('#',              cols.num.x + 1,    y + 4);
    doc.text('SERIAL NUMBER',  cols.serial.x + 1, y + 4);
    doc.text('MAKE / MODEL',   cols.make.x + 1,   y + 4);
    doc.text('CURRENT USER',   cols.user.x + 1,   y + 4);
    doc.text('CURRENT LOCATION', cols.loc.x + 1,  y + 4);
    doc.text('LOG#', cols.hist.x + 1, y + 4);
    doc.text('DATE  (MM/DD/YYYY)',  cols.date.x + 1, y + 4);
      doc.text('[CHK]', cols.chk.x + 1, y + 4);
    doc.text('INITIALS', cols.init.x + 1, y + 4);
    doc.setTextColor(0, 0, 0);
    y += 7;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);

    drives.forEach((drive, idx) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        pageNum++;
        addHeader(pageNum);
        y = 30;
        // re-draw column headers
        doc.setFillColor(50, 80, 150);
        doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.text('#',              cols.num.x + 1,    y + 4);
        doc.text('SERIAL NUMBER',  cols.serial.x + 1, y + 4);
        doc.text('MAKE / MODEL',   cols.make.x + 1,   y + 4);
        doc.text('CURRENT USER',   cols.user.x + 1,   y + 4);
        doc.text('CURRENT LOCATION', cols.loc.x + 1,  y + 4);
        doc.text('LOG#', cols.hist.x + 1, y + 4);
        doc.text('DATE  (MM/DD/YYYY)',  cols.date.x + 1, y + 4);
        doc.text('[CHK]', cols.chk.x + 1, y + 4);
        doc.text('INITIALS', cols.init.x + 1, y + 4);
        doc.setTextColor(0, 0, 0);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7.5);
        y += 7;
      }

      const rowH = 8;
      const bg = idx % 2 === 0 ? [240, 244, 252] : [255, 255, 255];
      doc.setFillColor(...bg);
      doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');

      // border lines
      doc.setDrawColor(180, 180, 200);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, pageWidth - margin * 2, rowH);

      // vertical dividers
      [cols.serial.x, cols.make.x, cols.user.x, cols.loc.x, cols.hist.x, cols.date.x, cols.chk.x, cols.init.x].forEach(xd => {
        doc.line(xd, y, xd, y + rowH);
      });

      const custodyCount = allCustody.filter(c => c.hdrive_serial === drive.serial_number).length;

      // Highlight seized rows
      if (drive.seized) {
        doc.setFillColor(255, 230, 180);
        doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');
        doc.setDrawColor(200, 100, 0);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, pageWidth - margin * 2, rowH);
        doc.setDrawColor(180, 180, 200);
        doc.setLineWidth(0.2);
      }

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      const textY = y + 5.5;
      doc.text(String(idx + 1), cols.num.x + 1, textY);
      doc.setFont('courier', 'bold');
      const serialLabel = (drive.seized ? '[SEIZED] ' : '') + (drive.serial_number || '-');
      doc.text(serialLabel.substring(0, 20), cols.serial.x + 1, textY);
      doc.setFont('courier', 'normal');
      doc.text((`${drive.make || ''} ${drive.model || ''}`).trim().substring(0, 18) || '-', cols.make.x + 1, textY);
      doc.text((drive.current_user || '-').substring(0, 20), cols.user.x + 1, textY);
      doc.text((drive.current_location || '-').substring(0, 32), cols.loc.x + 1, textY);
      doc.text(String(custodyCount), cols.hist.x + 1, textY);

      // Audit fill-in fields
      // Date: ___/___/______
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text('___/___/______', cols.date.x + 1, textY);

      // Checkbox: [ ]
      doc.setFontSize(8);
      doc.rect(cols.chk.x + 3, y + 1.5, 5, 5);

      // Initials line
      doc.setFontSize(7);
      doc.text(':________________', cols.init.x + 1, textY);

      y += rowH;
    });

    // ---- Seized Drives Section ----
    const seizedDrives = drives.filter(d => d.seized);
    if (seizedDrives.length > 0) {
      y += 8;
      if (y > pageHeight - 40) { doc.addPage(); pageNum++; addHeader(pageNum); y = 30; }
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(180, 60, 0);
      doc.text('⚠ SEIZED / LEGAL HOLD DRIVES', margin, y);
      doc.setTextColor(0, 0, 0);
      y += 5;

      doc.setFillColor(200, 80, 0);
      doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.text('SERIAL #', margin + 1, y + 4);
      doc.text('SEIZING AGENCY', margin + 35, y + 4);
      doc.text('CASE #', margin + 80, y + 4);
      doc.text('DATE/TIME OF SEIZURE', margin + 115, y + 4);
      doc.text('REASON', margin + 175, y + 4);
      doc.setTextColor(0, 0, 0);
      y += 7;

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      seizedDrives.forEach((d, idx) => {
        if (y > pageHeight - 15) { doc.addPage(); pageNum++; addHeader(pageNum); y = 30; }
        const rowH = 8;
        doc.setFillColor(255, 235, 200);
        doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');
        doc.setDrawColor(200, 100, 0);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, pageWidth - margin * 2, rowH);
        const textY = y + 5.5;
        doc.setFont('courier', 'bold');
        doc.text((d.serial_number || '-').substring(0, 20), margin + 1, textY);
        doc.setFont('courier', 'normal');
        doc.text((d.seizing_agency || '-').substring(0, 20), margin + 35, textY);
        doc.text((d.seizing_person || '-').substring(0, 20), margin + 72, textY);
        doc.text((d.seizure_case_number || '-').substring(0, 14), margin + 110, textY);
        const sd = d.seizure_date ? new Date(d.seizure_date) : null;
        doc.text(sd ? `${sd.toLocaleDateString()} ${sd.toLocaleTimeString()}` : '-', margin + 138, textY);
        doc.text((d.seizure_reason || '-').substring(0, 20), margin + 178, textY);
        y += rowH;
      });
    }

    // ---- Custody Log section ----
    y += 8;
    if (y > pageHeight - 40) {
      doc.addPage();
      pageNum++;
      addHeader(pageNum);
      y = 30;
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text('CHAIN OF CUSTODY TRANSFER LOG', margin, y);
    y += 5;

    // Custody table headers
    doc.setFillColor(50, 80, 150);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    const cCols = {
      serial: { x: margin,       w: 30 },
      from:   { x: margin + 30,  w: 35 },
      to:     { x: margin + 65,  w: 35 },
      prevLoc:{ x: margin + 100, w: 50 },
      newLoc: { x: margin + 150, w: 50 },
      reason: { x: margin + 200, w: 40 },
      date:   { x: margin + 240, w: pageWidth - margin - 240 - margin },
    };
    doc.text('SERIAL #',     cCols.serial.x + 1, y + 4);
    doc.text('FROM',         cCols.from.x + 1,   y + 4);
    doc.text('TO',           cCols.to.x + 1,     y + 4);
    doc.text('PREV. LOCATION', cCols.prevLoc.x + 1, y + 4);
    doc.text('NEW LOCATION', cCols.newLoc.x + 1, y + 4);
    doc.text('REASON',       cCols.reason.x + 1, y + 4);
    doc.text('DATE/TIME',    cCols.date.x + 1,   y + 4);
    doc.setTextColor(0, 0, 0);
    y += 7;

    // Filter custody log to only drives in current export
    const driveSerials = new Set(drives.map(d => d.serial_number));
    const filteredCustody = allCustody.filter(c => driveSerials.has(c.hdrive_serial));

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);

    filteredCustody.forEach((c, idx) => {
      if (y > pageHeight - 15) {
        doc.addPage();
        pageNum++;
        addHeader(pageNum);
        y = 30;
        doc.setFillColor(50, 80, 150);
        doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('courier', 'bold');
        doc.setFontSize(7);
        doc.text('SERIAL #',     cCols.serial.x + 1, y + 4);
        doc.text('FROM',         cCols.from.x + 1,   y + 4);
        doc.text('TO',           cCols.to.x + 1,     y + 4);
        doc.text('PREV. LOCATION', cCols.prevLoc.x + 1, y + 4);
        doc.text('NEW LOCATION', cCols.newLoc.x + 1, y + 4);
        doc.text('REASON',       cCols.reason.x + 1, y + 4);
        doc.text('DATE/TIME',    cCols.date.x + 1,   y + 4);
        doc.setTextColor(0, 0, 0);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        y += 7;
      }
      const rowH = 7;
      const bg = idx % 2 === 0 ? [240, 244, 252] : [255, 255, 255];
      doc.setFillColor(...bg);
      doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');
      doc.setDrawColor(180, 180, 200);
      doc.setLineWidth(0.2);
      doc.rect(margin, y, pageWidth - margin * 2, rowH);
      [cCols.from.x, cCols.to.x, cCols.prevLoc.x, cCols.newLoc.x, cCols.reason.x, cCols.date.x].forEach(xd => {
        doc.line(xd, y, xd, y + rowH);
      });

      const textY2 = y + 5;
      doc.setFont('courier', 'bold');
      doc.text((c.hdrive_serial || '').substring(0, 18), cCols.serial.x + 1, textY2);
      doc.setFont('courier', 'normal');
      doc.text((c.transferred_from || '-').substring(0, 22), cCols.from.x + 1, textY2);
      doc.text((c.transferred_to || '-').substring(0, 22), cCols.to.x + 1, textY2);
      doc.text((c.previous_location || '-').substring(0, 32), cCols.prevLoc.x + 1, textY2);
      doc.text((c.new_location || '-').substring(0, 32), cCols.newLoc.x + 1, textY2);
      doc.text((c.reason || '-').substring(0, 26), cCols.reason.x + 1, textY2);
      const dt = c.transfer_date ? new Date(c.transfer_date) : null;
      doc.text(dt ? `${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}` : '—', cCols.date.x + 1, textY2);
      y += rowH;
    });

    // Footer signature block
    y += 10;
    if (y > pageHeight - 50) {
      doc.addPage();
      pageNum++;
      addHeader(pageNum);
      y = 30;
    }

    // Liability disclosure box
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(margin, y, pageWidth - margin * 2, 22);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text('CHAIN OF CUSTODY ACCOUNTABILITY AND LIABILITY DISCLOSURE', pageWidth / 2, y + 4.2, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(6.5);
    const disclaimer1 = 'By signing below, the undersigned acknowledges receipt and current custody of the H-Drive unit(s) listed above. The signing party accepts full personal responsibility';
    const disclaimer2 = 'for the security, safekeeping, and proper handling of all assigned drives. The signing party is fully liable for any loss, theft, or intentional damage to assigned';
    const disclaimer3 = 'H-Drive units. By signing, the undersigned agrees to immediately report any loss or suspected theft to their direct supervisor and the Transportation Department.';
    doc.text(disclaimer1, margin + 2, y + 10);
    doc.text(disclaimer2, margin + 2, y + 14.5);
    doc.text(disclaimer3, margin + 2, y + 19);
    y += 26;

    // Signature lines
    doc.setLineWidth(0.4);
    const sig1end = margin + 70;
    const sig2start = margin + 80;
    const sig2end = margin + 160;
    const sig3start = margin + 170;
    const sig3end = pageWidth - margin;

    doc.line(margin, y, sig1end, y);
    doc.line(sig2start, y, sig2end, y);
    doc.line(sig3start, y, sig3end, y);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text('RESPONSIBLE PARTY SIGNATURE', margin, y + 4);
    doc.text('PRINTED NAME / TITLE', sig2start, y + 4);
    doc.text('DATE', sig3start, y + 4);

    const pdf = doc.output('arraybuffer');
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="hdrive-audit-report.pdf"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});