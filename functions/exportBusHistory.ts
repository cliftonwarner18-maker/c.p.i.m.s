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
    let yPos = 10;

    const addSection = (title) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 10;
      }
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(title, 10, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
    };

    const addRow = (label, value) => {
      if (yPos > pageHeight - 10) {
        doc.addPage();
        yPos = 10;
      }
      doc.setFont(undefined, 'bold');
      doc.text(label + ':', 10, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(String(value || '—'), 50, yPos);
      yPos += 4;
    };

    // Header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('NHCS VEHICLE HISTORY REPORT', 10, yPos);
    yPos += 6;
    doc.setFontSize(11);
    doc.text(`Bus #${bus.bus_number}`, 10, yPos);
    yPos += 8;

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
    addSection('CAMERA SYSTEM DATA');
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
        if (yPos > pageHeight - 15) {
          doc.addPage();
          yPos = 10;
        }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text(`Order #${wo.order_number} - ${moment(wo.created_date).format('MM/DD/YYYY')}`, 10, yPos);
        yPos += 3;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text(`Status: ${wo.status} | Tech: ${wo.technician_name || 'N/A'}`, 12, yPos);
        yPos += 2;
        doc.text(`Issue: ${wo.issue_description}`, 12, yPos);
        yPos += 2;
        if (wo.repairs_rendered) {
          const wrapped = doc.splitTextToSize(wo.repairs_rendered, pageWidth - 24);
          doc.text(wrapped, 12, yPos);
          yPos += wrapped.length * 2 + 1;
        }
        yPos += 2;
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
        if (yPos > pageHeight - 12) {
          doc.addPage();
          yPos = 10;
        }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text(`Inspection #${insp.inspection_number} - ${moment(insp.inspection_date).format('MM/DD/YYYY')}`, 10, yPos);
        yPos += 3;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text(`Inspector: ${insp.inspector_name} | Result: ${insp.overall_status || 'N/A'}`, 12, yPos);
        yPos += 2;
        doc.text(`Camera: ${insp.camera_system_functional ? '✓' : '✗'} | DVR: ${insp.dvr_functional ? '✓' : '✗'} | Mounting: ${insp.mounting_secure ? '✓' : '✗'}`, 12, yPos);
        yPos += 2;
        if (insp.inspection_notes) {
          const wrapped = doc.splitTextToSize(insp.inspection_notes, pageWidth - 24);
          doc.text(wrapped, 12, yPos);
          yPos += wrapped.length * 2 + 1;
        }
        yPos += 2;
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
        if (yPos > pageHeight - 10) {
          doc.addPage();
          yPos = 10;
        }
        doc.setFont(undefined, 'bold');
        doc.setFontSize(8);
        doc.text(`${moment(h.start_time).format('MM/DD/YY HH:mm')} - ${h.technician}`, 10, yPos);
        yPos += 2;
        doc.setFont(undefined, 'normal');
        doc.text(h.description, 12, yPos);
        yPos += 2;
      });
    }

    // Footer
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