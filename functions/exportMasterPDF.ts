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

    // Fetch all data (all statuses, no filters)
    const [buses, workOrders, inspections, serializedAssets, nonSerializedAssets, hdrives, users, custodyLogs, busHistory] = await Promise.all([
      base44.entities.Bus.list(),
      base44.entities.WorkOrder.list(),
      base44.entities.Inspection.list(),
      base44.entities.SerializedAsset.list(),
      base44.entities.NonSerializedAsset.list(),
      base44.entities.HDrive.list(),
      base44.entities.User.list(),
      base44.entities.CustodyLog.list(),
      base44.entities.BusHistory.list(),
    ]);

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    let yPos = margin;

    const addPageHeader = () => {
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 60, 120);
      doc.text('NEW HANOVER COUNTY SCHOOLS', pageWidth / 2, 8, { align: 'center' });
      doc.setFontSize(9);
      doc.text('Transportation Department | Master System Backup', pageWidth / 2, 12, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.setDrawColor(30, 60, 120);
      doc.line(margin, 14, pageWidth - margin, 14);
      yPos = 18;
      doc.setTextColor(0, 0, 0);
    };

    const addSectionHeader = (title) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.setFillColor(30, 60, 120);
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, yPos - 4, pageWidth - margin * 2, 6, 'F');
      doc.text(title, margin + 2, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
    };

    const addRow = (label, value) => {
      if (yPos > pageHeight - 8) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(label + ':', margin + 2, yPos);
      doc.setFont(undefined, 'normal');
      doc.text(String(value || '-').substring(0, 50), margin + 40, yPos);
      yPos += 4;
    };

    const sanitize = (str) => {
      if (!str) return '';
      return String(str).replace(/[^\w\s\-.,]/g, '').substring(0, 100);
    };

    // Title Page
    addPageHeader();
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('MASTER SYSTEM BACKUP', pageWidth / 2, yPos + 10, { align: 'center' });
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${moment().format('MMMM D, YYYY [at] h:mm A')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.text(`Exported by: ${user.full_name || user.email}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Summary Stats
    addSectionHeader('BACKUP SUMMARY');
    addRow('Fleet Vehicles', buses.length);
    addRow('Work Orders (All Statuses)', workOrders.length);
    addRow('Inspections (Completed & Due)', inspections.length);
    addRow('Service History Records', busHistory.length);
    addRow('Serialized Assets', serializedAssets.length);
    addRow('Spare Parts', nonSerializedAssets.length);
    addRow('H-Drives', hdrives.length);
    addRow('Custody Logs', custodyLogs.length);
    addRow('System Users', users.length);

    // Vehicles Section
    addSectionHeader('FLEET VEHICLES');
    buses.forEach((bus) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(`Bus #${bus.bus_number}`, margin + 2, yPos);
      yPos += 4;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      const info = `${bus.year} ${bus.make} ${bus.model} | VIN: ${bus.vin} | Status: ${bus.status}`;
      doc.text(sanitize(info), margin + 4, yPos);
      yPos += 3;
    });

    // Work Orders Section
    addSectionHeader('WORK ORDERS');
    workOrders.forEach((wo) => {
      if (yPos > pageHeight - 16) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(`${wo.order_number} | Bus #${wo.bus_number}`, margin + 2, yPos);
      yPos += 4;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(`Status: ${wo.status} | Reported by: ${sanitize(wo.reported_by)}`, margin + 4, yPos);
      yPos += 3;
    });

    // Inspections Section
    addSectionHeader('INSPECTIONS');
    inspections.forEach((insp) => {
      if (yPos > pageHeight - 16) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(`Bus #${insp.bus_number} | ${insp.inspection_number}`, margin + 2, yPos);
      yPos += 4;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(`Inspector: ${sanitize(insp.inspector_name)} | Status: ${insp.overall_status}`, margin + 4, yPos);
      yPos += 3;
    });

    // Assets Section
    addSectionHeader('SERIALIZED ASSETS');
    serializedAssets.forEach((asset) => {
      if (yPos > pageHeight - 12) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(`${asset.asset_number}`, margin + 2, yPos);
      yPos += 3;
      doc.setFont(undefined, 'normal');
      doc.text(`${asset.brand} ${asset.model} | SN: ${asset.serial_number} | Status: ${asset.status}`, margin + 4, yPos);
      yPos += 3;
    });

    // Non-Serialized Assets
    addSectionHeader('SPARE PARTS & NON-SERIALIZED ASSETS');
    nonSerializedAssets.forEach((asset) => {
      if (yPos > pageHeight - 12) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(`${sanitize(asset.part_name)}`, margin + 2, yPos);
      yPos += 3;
      doc.setFont(undefined, 'normal');
      doc.text(`Qty: ${asset.quantity_on_hand} | Location: ${sanitize(asset.current_location)}`, margin + 4, yPos);
      yPos += 3;
    });

    // H-Drives Section
    addSectionHeader('H-DRIVE STORAGE');
    hdrives.forEach((drive) => {
      if (yPos > pageHeight - 12) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(`${drive.serial_number}`, margin + 2, yPos);
      yPos += 3;
      doc.setFont(undefined, 'normal');
      doc.text(`${drive.make} ${drive.model} | Location: ${sanitize(drive.current_location)} | User: ${sanitize(drive.current_user)}`, margin + 4, yPos);
      yPos += 3;
    });

    // Users Section
    addSectionHeader('SYSTEM USERS');
    users.forEach((u) => {
      if (yPos > pageHeight - 12) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(8);
      doc.text(`${u.full_name} (${u.email}) | Role: ${u.role}`, margin + 2, yPos);
      yPos += 3;
    });

    // Service History / Time Records
    addSectionHeader('SERVICE HISTORY & TIME RECORDS');
    busHistory.forEach((hist) => {
      if (yPos > pageHeight - 12) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text(`Bus #${hist.bus_number}`, margin + 2, yPos);
      yPos += 3;
      doc.setFont(undefined, 'normal');
      doc.text(`${hist.technician} | ${sanitize(hist.description)} | ${hist.elapsed_minutes} min`, margin + 4, yPos);
      yPos += 3;
    });

    // Custody Logs
    addSectionHeader('H-DRIVE CUSTODY LOGS');
    custodyLogs.forEach((log) => {
      if (yPos > pageHeight - 12) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(8);
      doc.text(`${log.hdrive_serial} | ${log.transferred_from} → ${log.transferred_to}`, margin + 2, yPos);
      yPos += 3;
      doc.setFont(undefined, 'normal');
      doc.text(`${sanitize(log.reason)} | ${log.new_location}`, margin + 4, yPos);
      yPos += 3;
    });

    // Footer on last page
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`Master Backup | ${moment().format('MM/DD/YYYY HH:mm')}`, margin, pageHeight - 4);

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=master-backup.pdf',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});