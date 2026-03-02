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
      doc.rect(margin, yPos - 5, pageWidth - margin * 2, 7, 'F');
      doc.text(title, margin + 4, yPos + 1);
      doc.setTextColor(0, 0, 0);
      yPos += 10;
    };

    const addRow = (label, value) => {
      if (yPos > pageHeight - 8) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(label + ':', margin + 4, yPos);
      doc.setFont(undefined, 'normal');
      const wrapped = doc.splitTextToSize(String(value || '-'), pageWidth - 55);
      doc.text(wrapped, margin + 50, yPos);
      yPos += Math.max(4, wrapped.length * 3);
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
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const estTime = new Date(utcTime - (5 * 60 * 60 * 1000)); // EST is UTC-5
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[estTime.getMonth()];
    const day = estTime.getDate();
    const year = estTime.getFullYear();
    const hours = estTime.getHours();
    const minutes = String(estTime.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formattedTime = `${month} ${day}, ${year} at ${displayHours}:${minutes} ${ampm}`;
    doc.text(`Generated: ${formattedTime}`, pageWidth / 2, yPos, { align: 'center' });
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
    addSectionHeader('FLEET VEHICLES - DETAILED SPECIFICATION');
    buses.forEach((bus) => {
      if (yPos > pageHeight - 45) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(`Bus #${bus.bus_number}`, margin + 4, yPos);
      yPos += 4;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      addRow('Year/Make/Model', `${bus.year} ${bus.make} ${bus.model}`);
      addRow('VIN', bus.vin);
      addRow('Status', bus.status);
      addRow('Base Location', bus.base_location);
      addRow('Camera System', bus.camera_system_type || 'None');
      addRow('Camera Serial Number', bus.camera_serial_number || 'N/A');
      addRow('Camera Model Number', bus.camera_model_number || 'N/A');
      addRow('Dash Cam SID', bus.dash_cam_sid || 'N/A');
      addRow('Gateway SID', bus.gateway_sid || 'N/A');
      addRow('Stop Arm Cameras', bus.stop_arm_cameras ? 'YES' : 'NO');
      addRow('AI Cameras Installed', bus.ai_cameras_installed ? 'YES' : 'NO');
      addRow('Samsara Enabled', bus.samsara_enabled ? 'YES' : 'NO');
      addRow('Next Inspection Due', bus.next_inspection_due || 'Not Set');
      yPos += 5;
    });

    // Work Orders Section
    addSectionHeader('WORK ORDERS');
    workOrders.forEach((wo) => {
      if (yPos > pageHeight - 25) {
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
      if (wo.issue_description) {
        const issueWrapped = doc.splitTextToSize(sanitize(wo.issue_description), pageWidth - 20);
        doc.text('Issue: ', margin + 4, yPos);
        doc.text(issueWrapped, margin + 6, yPos);
        yPos += issueWrapped.length * 2.5 + 2;
      }
      if (wo.repairs_rendered) {
        const repairsWrapped = doc.splitTextToSize(sanitize(wo.repairs_rendered), pageWidth - 30);
        doc.setFont(undefined, 'bold');
        doc.text('Repairs: ', margin + 4, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(repairsWrapped, margin + 6, yPos);
        yPos += repairsWrapped.length * 3 + 3;
      }
      yPos += 3;
      if (yPos > pageHeight - 20) {
        doc.addPage();
        addPageHeader();
      }
    });

    // Inspections Section
    addSectionHeader('INSPECTIONS');
    inspections.forEach((insp) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        addPageHeader();
      }
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(`Bus #${insp.bus_number} | ${insp.inspection_number}`, margin + 2, yPos);
      yPos += 4;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(`Inspector: ${sanitize(insp.inspector_name)} | Date: ${insp.inspection_date || 'N/A'}`, margin + 4, yPos);
      yPos += 3;
      doc.text(`Camera: ${insp.camera_system_functional ? 'OK' : 'FAIL'} | DVR: ${insp.dvr_functional ? 'OK' : 'FAIL'} | Status: ${insp.overall_status}`, margin + 4, yPos);
      yPos += 3;
      if (insp.inspection_notes) {
        const notesWrapped = doc.splitTextToSize(sanitize(insp.inspection_notes), pageWidth - 20);
        doc.setFont(undefined, 'bold');
        doc.text('Notes: ', margin + 4, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(notesWrapped, margin + 6, yPos);
        yPos += notesWrapped.length * 2.5 + 2;
      }
      yPos += 2;
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
      doc.text(`${log.hdrive_serial} | ${log.transferred_from} → ${log.transferred_to}`, margin + 4, yPos);
      yPos += 3;
      doc.setFont(undefined, 'normal');
      doc.text(`${sanitize(log.reason)} | ${log.new_location}`, margin + 6, yPos);
      yPos += 3;
    });

    // Technician Hours Report
    const technicianHours = {};
    workOrders.forEach((wo) => {
      if (wo.technician_name && wo.elapsed_time_minutes) {
        if (!technicianHours[wo.technician_name]) {
          technicianHours[wo.technician_name] = 0;
        }
        technicianHours[wo.technician_name] += wo.elapsed_time_minutes;
      }
    });

    if (Object.keys(technicianHours).length > 0) {
      addSectionHeader('TECHNICIAN HOURS & TIME RECORDS');
      Object.entries(technicianHours).forEach(([tech, minutes]) => {
        if (yPos > pageHeight - 12) {
          doc.addPage();
          addPageHeader();
        }
        const hours = (minutes / 60).toFixed(1);
        doc.setFontSize(8);
        doc.text(`${sanitize(tech)}: ${minutes} minutes (${hours} hours)`, margin + 4, yPos);
        yPos += 4;
      });
    }

    // Footer on last page
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    const now = new Date();
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const reportTime = `${estTime.getMonth() + 1}/${estTime.getDate()}/${estTime.getFullYear()}-${String(estTime.getHours()).padStart(2, '0')}:${String(estTime.getMinutes()).padStart(2, '0')}`;
    doc.text(`Master Backup | ${reportTime} (EST)`, margin, pageHeight - 4);

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