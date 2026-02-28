import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';
import moment from 'npm:moment@2.30.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { busNumber } = await req.json();
    if (!busNumber) {
      return Response.json({ error: 'Bus number required' }, { status: 400 });
    }

    // Fetch all related data
    const buses = await base44.asServiceRole.entities.Bus.list();
    const bus = buses.find(b => b.bus_number === busNumber);
    if (!bus) {
      return Response.json({ error: 'Bus not found' }, { status: 404 });
    }

    const workOrders = await base44.asServiceRole.entities.WorkOrder.filter({ bus_number: busNumber }, '-created_date');
    const inspections = await base44.asServiceRole.entities.Inspection.filter({ bus_number: busNumber }, '-created_date');
    const history = await base44.asServiceRole.entities.BusHistory.filter({ bus_number: busNumber }, '-start_time');

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPos = margin;

    // ── Page border helper (drawn on each page) ──
    const drawPageBorder = () => {
      doc.setDrawColor(30, 60, 120);
      doc.setLineWidth(1.2);
      doc.rect(6, 6, pageWidth - 12, pageHeight - 12);
      doc.setLineWidth(0.4);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    };
    drawPageBorder();

    // ── Section header helper ──
    const addSection = (title) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        drawPageBorder();
        yPos = margin + 4;
      }
      yPos += 3;
      doc.setFillColor(30, 60, 120);
      doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(title, margin + 3, yPos + 5);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      yPos += 10;
    };

    // ── Section subtitle helper ──
    const addSubtitle = (text) => {
      doc.setFontSize(8);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(80, 80, 80);
      doc.text(text, margin + 2, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      yPos += 5;
    };

    // ── Sanitize text (remove special characters) ──
    const sanitize = (str) => {
      if (!str || str === null || str === undefined) return null;
      const cleaned = String(str)
        .replace(/[\uFFFD]/g, '')
        .replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, '')
        .replace(/[«»„""‟‚''‹›]/g, '"')
        .replace(/[−–—]/g, '-')
        .replace(/[…]/g, '...')
        .replace(/[©®™]/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
      return cleaned === '' ? null : cleaned;
    };

    const addRow = (label, value) => {
      if (yPos > pageHeight - 15) {
        doc.addPage();
        drawPageBorder();
        yPos = margin + 4;
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text(label + ':', margin + 2, yPos);
      doc.setFont(undefined, 'normal');
      const sanitizedValue = sanitize(value);
      const displayValue = sanitizedValue === null || sanitizedValue === undefined || sanitizedValue === '' ? '—' : String(sanitizedValue);
      const wrapped = doc.splitTextToSize(displayValue, pageWidth - 65);
      doc.text(wrapped, 55, yPos);
      // light separator line
      doc.setDrawColor(200, 210, 230);
      doc.setLineWidth(0.2);
      doc.line(margin + 2, yPos + 2, pageWidth - margin - 2, yPos + 2);
      doc.setDrawColor(0, 0, 0);
      yPos += Math.max(5, wrapped.length * 3.5);
    };

    // ── OFFICIAL HEADER ──
    // Top logo/header block
    doc.setFillColor(30, 60, 120);
    doc.rect(margin, yPos, pageWidth - margin * 2, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('NEW HANOVER COUNTY SCHOOLS', pageWidth / 2, yPos + 8, { align: 'center' });
    doc.setFontSize(11);
    doc.text('Transportation Department', pageWidth / 2, yPos + 14, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Vehicle History Transcript', pageWidth / 2, yPos + 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 28;

    // Vehicle title bar
    doc.setFillColor(230, 235, 245);
    doc.setDrawColor(30, 60, 120);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - margin * 2, 10, 'FD');
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 60, 120);
    const busYear = sanitize(bus.year) || '-';
    const busMake = sanitize(bus.make) || '-';
    const busModel = sanitize(bus.model) || '-';
    doc.text(`Bus #${sanitize(bus.bus_number) || 'N/A'} - ${busYear} ${busMake} ${busModel}`.trim(), pageWidth / 2, yPos + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 14;

    // Generated date line
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${moment().format('MMMM D, YYYY [at] h:mm A')}`, pageWidth - margin - 2, yPos, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 6;

    // Vehicle Data
    addSection('VEHICLE INFORMATION');
    addRow('Bus Type', sanitize(bus.bus_type));
    addRow('Year/Make/Model', `${sanitize(bus.year)} ${sanitize(bus.make)} ${sanitize(bus.model)}`);
    addRow('VIN', sanitize(bus.vin));
    addRow('Base Location', sanitize(bus.base_location));
    addRow('Status', sanitize(bus.status));
    addRow('Passenger Capacity', sanitize(String(bus.passenger_capacity || '')));
    addRow('Wheelchair Accessible', bus.wheelchair_accessible ? 'Yes' : 'No');
    yPos += 3;

    // Camera System
    addSection('CAMERA / SURVEILLANCE TECHNICAL DATA');
    addSubtitle('Vehicle camera system specifications and surveillance equipment details');
    addRow('Camera System', sanitize(bus.camera_system_type || 'None'));
    addRow('Serial Number', sanitize(bus.camera_serial_number));
    addRow('Model Number', sanitize(bus.camera_model_number));
    addRow('DVR Asset #', sanitize(bus.asset_number));
    addRow('Samsara Enabled', bus.samsara_enabled ? 'Yes' : 'No');
    addRow('Next Inspection Due', bus.next_inspection_due ? moment(bus.next_inspection_due).format('MM/DD/YYYY') : 'Not Set');
    yPos += 3;

    // Repair History
    addSection('REPAIR WORK ORDERS');
    if (workOrders.length === 0) {
      doc.setFontSize(10);
      doc.text('No repair history', margin + 2, yPos);
      yPos += 4;
    } else {
      workOrders.slice(0, 10).forEach((wo) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          drawPageBorder();
          yPos = margin + 4;
        }
        // Order header
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text(`Order #${sanitize(wo.order_number || wo.id?.slice(-6))} - ${moment(wo.created_date).format('MM/DD/YYYY')}`, margin + 2, yPos);
        yPos += 5;
        
        // Status and tech on one line
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text(`Status: ${sanitize(wo.status)}`, margin + 4, yPos);
        doc.text(`Tech: ${sanitize(wo.technician_name || 'N/A')}`, margin + 50, yPos);
        yPos += 4;
        
        // Issue description
        if (wo.issue_description) {
          doc.setFont(undefined, 'bold');
          doc.setFontSize(8);
          doc.text('Issue:', margin + 4, yPos);
          yPos += 3;
          doc.setFont(undefined, 'normal');
          const issueWrapped = doc.splitTextToSize(sanitize(wo.issue_description), pageWidth - 20);
          doc.text(issueWrapped, margin + 6, yPos);
          yPos += issueWrapped.length * 3 + 2;
        }
        
        // Repairs rendered
        if (wo.repairs_rendered) {
          doc.setFont(undefined, 'bold');
          doc.setFontSize(8);
          doc.text('Repairs:', margin + 4, yPos);
          yPos += 3;
          doc.setFont(undefined, 'normal');
          const repairsWrapped = doc.splitTextToSize(sanitize(wo.repairs_rendered), pageWidth - 20);
          doc.text(repairsWrapped, margin + 6, yPos);
          yPos += repairsWrapped.length * 3 + 3;
        }
        
        // Separator
        doc.setDrawColor(180, 190, 220);
        doc.setLineWidth(0.3);
        doc.line(margin + 2, yPos, pageWidth - margin - 2, yPos);
        yPos += 4;
      });
    }
    yPos += 2;

    // Inspection History
    addSection('INSPECTION HISTORY');
    if (inspections.length === 0) {
      doc.setFontSize(10);
      doc.text('No inspection history', 10, yPos);
      yPos += 4;
    } else {
      inspections.slice(0, 10).forEach((insp) => {
        if (yPos > pageHeight - 18) {
          doc.addPage();
          drawPageBorder();
          yPos = margin + 4;
        }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text(`Inspection #${sanitize(insp.inspection_number)} - ${moment(insp.inspection_date).format('MM/DD/YYYY')}`, 10, yPos);
        yPos += 4;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text(`Inspector: ${sanitize(insp.inspector_name)} | Result: ${sanitize(insp.overall_status || 'N/A')}`, 12, yPos);
        yPos += 3;
        doc.text(`Camera: ${insp.camera_system_functional ? 'OK' : 'FAIL'} | DVR: ${insp.dvr_functional ? 'OK' : 'FAIL'} | Mounting: ${insp.mounting_secure ? 'OK' : 'FAIL'}`, 12, yPos);
        yPos += 3;
        if (insp.inspection_notes) {
          const wrapped = doc.splitTextToSize(sanitize(insp.inspection_notes), pageWidth - 24);
          doc.text(wrapped, 12, yPos);
          yPos += wrapped.length * 2.5 + 2;
        } else {
          yPos += 1;
        }
      });
    }
    yPos += 2;

    // Manual History
    addSection('MANUAL SERVICE LOG');
    if (history.length === 0) {
      doc.setFontSize(10);
      doc.text('No history entries', 10, yPos);
    } else {
      history.slice(0, 15).forEach((h) => {
        if (yPos > pageHeight - 12) {
          doc.addPage();
          drawPageBorder();
          yPos = margin + 4;
        }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(8);
        doc.text(`${moment(h.start_time).format('MM/DD/YY HH:mm')} - ${sanitize(h.technician)}`, 10, yPos);
        yPos += 3;
        doc.setFont(undefined, 'normal');
        const descWrapped = doc.splitTextToSize(sanitize(h.description), pageWidth - 24);
        doc.text(descWrapped, 12, yPos);
        yPos += descWrapped.length * 2.5 + 2;
      });
    }
    yPos += 2;

    // Legacy Data Upload
    if (bus.legacy_upload) {
      addSection('LEGACY AUDIT / REPAIR LOG');
      const legacyWrapped = doc.splitTextToSize(sanitize(bus.legacy_upload), pageWidth - 20);
      doc.setFontSize(9);
      doc.text(legacyWrapped, margin + 2, yPos);
      yPos += legacyWrapped.length * 3.5 + 2;
    }

    // Footer line on last page
    doc.setDrawColor(30, 60, 120);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text('New Hanover County Schools | Transportation Department | Vehicle Surveillance System', pageWidth / 2, pageHeight - 13, { align: 'center' });
    doc.text(`Confidential Document | Bus #${busNumber} | ${moment().format('MM/DD/YYYY')}`, pageWidth / 2, pageHeight - 9, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=bus-${busNumber}-history.pdf`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});