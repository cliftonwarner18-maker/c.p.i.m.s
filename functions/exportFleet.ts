import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { locationFilter, busTypeFilter, stopArmOnly, cameraFilter } = body;

    let buses = await base44.entities.Bus.list();
    
    if (locationFilter && locationFilter !== 'All') {
      buses = buses.filter(b => b.base_location === locationFilter);
    }

    if (busTypeFilter && busTypeFilter !== 'All') {
      buses = buses.filter(b => b.bus_type === busTypeFilter);
    }

    if (stopArmOnly) {
      buses = buses.filter(b => b.stop_arm_cameras === true);
    }

    if (cameraFilter && cameraFilter !== 'All') {
      buses = buses.filter(b => b.camera_system_type === cameraFilter);
    }

    // Sanitize function
    const sanitize = (str) => {
      if (!str || str === null || str === undefined) return null;
      let cleaned = String(str)
        .replace(/[\uFFFD]/g, '')
        .replace(/[ï¿½]/g, '')
        .replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, '')
        .replace(/[«»„""‟‚''‹›]/g, '"')
        .replace(/[−–—]/g, '-')
        .replace(/[…]/g, '...')
        .replace(/[©®™]/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
      return cleaned === '' ? null : cleaned;
    };

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let y = 10;

    // Title
    doc.setFontSize(16);
    doc.text('FLEET INVENTORY REPORT', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Date
    doc.setFontSize(10);
    const dateStr = `Report Generated: ${moment().tz('America/New_York').format('MM/DD/YYYY HH:mm')}`;
    doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
    y += 6;

    if (locationFilter && locationFilter !== 'All') {
      doc.text(`Location: ${locationFilter}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    if (busTypeFilter && busTypeFilter !== 'All') {
      doc.text(`Type: ${busTypeFilter}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    if (stopArmOnly) {
      doc.text('Filter: Stop Arm Cameras Only', pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    if (cameraFilter && cameraFilter !== 'All') {
      doc.text(`DVR System: ${cameraFilter}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    y += 4;

    // Headers
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    const headers = ['Bus #', 'Type', 'Location', 'Year', 'Make/Model', 'Status', 'Cam System', 'In', 'Out', 'Total', 'Stop Arm'];
    const colWidths = [14, 18, 16, 12, 30, 18, 20, 8, 8, 10, 18];
    let x = 8;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += 2;
    doc.setDrawColor(100, 100, 100);
    doc.line(8, y, pageWidth - 8, y);
    y += 5;

    // Data rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7.5);
    buses.forEach(bus => {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = 10;
      }
      
      const inside = bus.cameras_inside != null ? String(bus.cameras_inside) : '-';
      const outside = bus.cameras_outside != null ? String(bus.cameras_outside) : '-';
      const total = (bus.cameras_inside != null || bus.cameras_outside != null)
        ? String((bus.cameras_inside || 0) + (bus.cameras_outside || 0))
        : '-';
      const stopArm = bus.stop_arm_cameras ? 'YES' : 'NO';

      x = 8;
      doc.text(sanitize(bus.bus_number) || '-', x, y); x += colWidths[0];
      doc.text((sanitize(bus.bus_type) || '-').substring(0, 12), x, y); x += colWidths[1];
      doc.text(sanitize(bus.base_location) || '-', x, y); x += colWidths[2];
      doc.text(sanitize(bus.year) || '-', x, y); x += colWidths[3];
      doc.text(`${(sanitize(bus.make)||'-')} ${(sanitize(bus.model)||'')}`.trim().substring(0, 22), x, y); x += colWidths[4];
      doc.text(sanitize(bus.status) || '-', x, y); x += colWidths[5];
      doc.text((sanitize(bus.camera_system_type) || '-').substring(0, 14), x, y); x += colWidths[6];
      doc.text(inside, x, y); x += colWidths[7];
      doc.text(outside, x, y); x += colWidths[8];
      doc.text(total, x, y); x += colWidths[9];
      doc.text(stopArm, x, y);
      y += 5.5;
    });

    // Footer
    y += 8;
    doc.setFontSize(8);
    doc.text(`Total Vehicles: ${buses.length}`, 8, y);

    const pdf = doc.output('arraybuffer');
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="fleet-inventory.pdf"'
      }
    });
  } catch (error) {
    console.error('Error in exportFleet:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});