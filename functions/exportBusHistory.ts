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
      const wrapped = doc.splitTextToSize(String(value || '—'), pageWidth - 65);
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
    doc.text(`Bus #${bus.bus_number}  —  ${bus.year || ''} ${bus.make || ''} ${bus.model || ''}`, pageWidth / 2, yPos + 7, { align: 'center' });
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
    addRow('Bus Type', bus.bus_type);
    addRow('Year/Make/Model', `${bus.year} ${bus.make} ${bus.model}`);
    addRow('VIN', bus.vin);
    addRow('Base Location', bus.base_location);
    addRow('Status', bus.status);
    addRow('Passenger Capacity', bus.passenger_capacity);
    addRow('Wheelchair Accessible', bus.wheelchair_accessible ? 'Yes' : 'No');
    yPos += 3;

    // Camera System
    addSection('CAMERA / SURVEILLANCE TECHNICAL DATA');
    addSubtitle('Vehicle camera system specifications and surveillance equipment details');
    addRow('Camera System', bus.camera_system_type || 'None');
    addRow('Serial Number', bus.camera_serial_number);
    addRow('Model Number', bus.camera_model_number);
    addRow('DVR Asset #', bus.asset_number);
    addRow('Samsara Enabled', bus.samsara_enabled ? 'Yes' : 'No');
    addRow('Next Inspection Due', bus.next_inspection_due ? moment(bus.next_inspection_due).format('MM/DD/YYYY') : 'Not Set');
    yPos += 3;

    // Repair History
    addSection('REPAIR WORK ORDERS');
    if (workOrders.length === 0) {
      doc.setFontSize(10);
      doc.text('No repair history', 10, yPos);
      yPos += 4;
    } else {
      workOrders.slice(0, 10).forEach((wo) => {
        if (yPos > pageHeight - 20) {
          doc.addPage();
          drawPageBorder();
          yPos = margin + 4;
        }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text(`Order #${wo.order_number} - ${moment(wo.created_date).format('MM/DD/YYYY')}`, 10, yPos);
        yPos += 4;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        const statusLine = `Status: ${wo.status} | Tech: ${wo.technician_name || 'N/A'}`;
        doc.text(statusLine, 12, yPos);
        yPos += 3;
        const issueWrapped = doc.splitTextToSize(`Issue: ${wo.issue_description}`, pageWidth - 24);
        doc.text(issueWrapped, 12, yPos);
        yPos += issueWrapped.length * 2.5 + 1;
        if (wo.repairs_rendered) {
          const repairsWrapped = doc.splitTextToSize(`Repairs: ${wo.repairs_rendered}`, pageWidth - 24);
          doc.text(repairsWrapped, 12, yPos);
          yPos += repairsWrapped.length * 2.5 + 2;
        } else {
          yPos += 1;
        }
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
        doc.text(`Inspection #${insp.inspection_number} - ${moment(insp.inspection_date).format('MM/DD/YYYY')}`, 10, yPos);
        yPos += 4;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text(`Inspector: ${insp.inspector_name} | Result: ${insp.overall_status || 'N/A'}`, 12, yPos);
        yPos += 3;
        doc.text(`Camera: ${insp.camera_system_functional ? '✓' : '✗'} | DVR: ${insp.dvr_functional ? '✓' : '✗'} | Mounting: ${insp.mounting_secure ? '✓' : '✗'}`, 12, yPos);
        yPos += 3;
        if (insp.inspection_notes) {
          const wrapped = doc.splitTextToSize(insp.inspection_notes, pageWidth - 24);
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
        doc.text(`${moment(h.start_time).format('MM/DD/YY HH:mm')} - ${h.technician}`, 10, yPos);
        yPos += 3;
        doc.setFont(undefined, 'normal');
        const descWrapped = doc.splitTextToSize(h.description, pageWidth - 24);
        doc.text(descWrapped, 12, yPos);
        yPos += descWrapped.length * 2.5 + 2;
      });
    }

    // Footer line on last page
    doc.setDrawColor(30, 60, 120);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text('New Hanover County Schools — Transportation Department — Vehicle Surveillance System', pageWidth / 2, pageHeight - 13, { align: 'center' });
    doc.text(`Confidential Document — Bus #${busNumber} — ${moment().format('MM/DD/YYYY')}`, pageWidth / 2, pageHeight - 9, { align: 'center' });
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