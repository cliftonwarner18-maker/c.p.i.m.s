import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inspectionId } = await req.json();
    if (!inspectionId) {
      return Response.json({ error: 'Inspection ID required' }, { status: 400 });
    }

    // Fetch inspection and bus data
    const inspections = await base44.asServiceRole.entities.Inspection.list();
    const inspection = inspections.find(i => i.id === inspectionId);
    if (!inspection) {
      return Response.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const buses = await base44.asServiceRole.entities.Bus.list();
    const bus = buses.find(b => b.bus_number === inspection.bus_number);

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let yPos = margin;

    // Page border
    const drawPageBorder = () => {
      doc.setDrawColor(30, 60, 120);
      doc.setLineWidth(1.2);
      doc.rect(6, 6, pageWidth - 12, pageHeight - 12);
      doc.setLineWidth(0.4);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    };
    drawPageBorder();

    // Sanitize text
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

    // Official Header
    doc.setFillColor(30, 60, 120);
    doc.rect(margin, yPos, pageWidth - margin * 2, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('NEW HANOVER COUNTY SCHOOLS', pageWidth / 2, yPos + 7, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Transportation Department', pageWidth / 2, yPos + 14, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('OFFICIAL CAMERA SURVEILLANCE INSPECTION REPORT', pageWidth / 2, yPos + 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 32;

    // Inspection title bar
    doc.setFillColor(230, 235, 245);
    doc.setDrawColor(30, 60, 120);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'FD');
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 60, 120);
    doc.text(`BUS #${sanitize(inspection.bus_number)} INSPECTION REPORT`, pageWidth / 2, yPos + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 14;

    // Generated date
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${moment().tz('America/New_York').format('MMM D, YYYY [at] h:mm A')}`, pageWidth - margin - 2, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 6;

    // Inspection details section
    doc.setFillColor(30, 60, 120);
    doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('INSPECTION INFORMATION', margin + 3, yPos + 5);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    yPos += 10;

    // Inspection details grid
    const detailsGrid = [
      [`Inspection #: ${sanitize(inspection.inspection_number) || '-'}`, `Inspector: ${sanitize(inspection.inspector_name) || '-'}`],
      [`Date/Time: ${moment(inspection.inspection_date || inspection.created_date).tz('America/New_York').format('MM/DD/YYYY HH:mm')}`, `Bus #: ${sanitize(inspection.bus_number) || '-'}`],
      [`Camera System: ${sanitize(bus?.camera_system_type) || '-'}`, `Serial #: ${sanitize(bus?.camera_serial_number) || '-'}`],
    ];

    detailsGrid.forEach((row) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        drawPageBorder();
        yPos = margin + 4;
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(row[0], margin + 2, yPos);
      doc.text(row[1], pageWidth / 2, yPos);
      yPos += 5;
    });
    yPos += 4;

    // Inspection Results
    doc.setFillColor(30, 60, 120);
    doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('INSPECTION RESULTS', margin + 3, yPos + 5);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // Results checklist
    const results = [
      ['Camera System Functional', inspection.camera_system_functional],
      ['Mounting Secure', inspection.mounting_secure],
      ['DVR System Functional', inspection.dvr_functional],
      ['Date/Time Accuracy', inspection.date_time_accuracy],
      ['Signals & Lights Functional', inspection.signals_lights_functional],
      ['Programming Verified', inspection.programming_verified],
      [`Lens Condition: ${sanitize(inspection.lenses_condition) || '-'}`, null],
    ];

    results.forEach((item) => {
      if (yPos > pageHeight - 18) {
        doc.addPage();
        drawPageBorder();
        yPos = margin + 4;
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('  ✓ ' + item[0], margin + 2, yPos);
      if (item[1] !== null) {
        const status = item[1] ? 'PASS' : 'FAIL';
        const color = item[1] ? [22, 101, 52] : [153, 27, 27];
        doc.setTextColor(...color);
        doc.setFont(undefined, 'bold');
        doc.text(status, pageWidth - margin - 15, yPos);
        doc.setTextColor(0, 0, 0);
      }
      yPos += 5;
    });
    yPos += 4;

    // Overall Status
    const statusColor = inspection.overall_status === 'Pass' ? [22, 101, 52] : inspection.overall_status === 'Fail' ? [153, 27, 27] : [146, 64, 14];
    doc.setFillColor(...statusColor);
    doc.rect(margin, yPos, pageWidth - margin * 2, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`OVERALL RESULT: ${inspection.overall_status?.toUpperCase()}`, pageWidth / 2, yPos + 8, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 16;

    // Notes section
    if (inspection.inspection_notes) {
      doc.setFillColor(30, 60, 120);
      doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('INSPECTION NOTES', margin + 3, yPos + 5);
      doc.setTextColor(0, 0, 0);
      yPos += 10;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const notesWrapped = doc.splitTextToSize(sanitize(inspection.inspection_notes), pageWidth - 20);
      doc.text(notesWrapped, margin + 2, yPos);
      yPos += notesWrapped.length * 3.5 + 2;
    }

    // Next inspection due
    if (inspection.next_inspection_due) {
      yPos += 4;
      doc.setDrawColor(30, 60, 120);
      doc.setLineWidth(1);
      doc.rect(margin, yPos, pageWidth - margin * 2, 10);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`NEXT INSPECTION DUE: ${moment(inspection.next_inspection_due).format('MM/DD/YYYY')}`, pageWidth / 2, yPos + 7, { align: 'center' });
      yPos += 14;
    }

    // Footer
    doc.setDrawColor(30, 60, 120);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text('New Hanover County Schools | Transportation Department | Vehicle Surveillance System', pageWidth / 2, pageHeight - 13, { align: 'center' });
    doc.text(`OFFICIAL INSPECTION REPORT | Bus #${inspection.bus_number} | ${moment().format('MM/DD/YYYY')}`, pageWidth / 2, pageHeight - 9, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=inspection-bus-${inspection.bus_number}-${moment().format('YYYYMMDD')}.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});