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

    // Fetch pending work orders
    const workOrders = await base44.entities.WorkOrder.list();
    const pending = workOrders.filter(wo => wo.status === 'Pending').sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let yPos = margin;

    // Header
    doc.setFillColor(30, 60, 120);
    doc.rect(margin, yPos, pageWidth - margin * 2, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('FIELD WORK ORDERS - CLIPBOARD', pageWidth / 2, yPos + 8, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Technician Name: ________________________   Date: ${moment().tz('America/New_York').format('MM/DD/YYYY')}`, margin + 2, yPos + 16);
    doc.setTextColor(0, 0, 0);
    yPos += 26;

    // Instructions
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(80, 80, 80);
    doc.text('INSTRUCTIONS: Complete each work order in the field. Check box when complete. Record time, technician name, and repairs performed.', margin + 2, yPos);
    doc.setTextColor(0, 0, 0);
    yPos += 8;

    // Work orders
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);

    pending.forEach((wo, idx) => {
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }

      // Order number and bus
      doc.setFont(undefined, 'bold');
      doc.setFontSize(10);
      doc.text(`ORDER #${wo.order_number}  |  BUS #${wo.bus_number}`, margin, yPos);
      yPos += 6;

      // Report info
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text(`Reported By: ${wo.reported_by || '—'}   |   Date: ${moment(wo.created_date).tz('America/New_York').format('MM/DD/YYYY HH:mm')}`, margin, yPos);
      yPos += 5;

      // Issue description
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.text('ISSUE:', margin, yPos);
      yPos += 4;
      doc.setFont(undefined, 'normal');
      const issueLines = doc.splitTextToSize(wo.issue_description || '—', pageWidth - margin * 2 - 10);
      doc.setFontSize(8);
      doc.text(issueLines, margin + 5, yPos);
      yPos += issueLines.length * 4 + 2;

      // Field sections
      const fieldX = margin;
      const fieldW = pageWidth - margin * 2;
      const boxHeight = 6;

      // Checkbox
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.text('* REPAIR COMPLETE *', fieldX, yPos);
      yPos += 6;

      // Time
      doc.text('Start Time: ____________   End Time: ____________', fieldX, yPos);
      yPos += 6;

      // Technician
      doc.text('Technician Name: ____________________________________', fieldX, yPos);
      yPos += 6;

      // Repairs performed
      doc.text('REPAIRS PERFORMED:', fieldX, yPos);
      yPos += 4;
      doc.setDrawColor(180, 180, 200);
      doc.setLineWidth(0.2);
      doc.rect(fieldX + 2, yPos, fieldW - 4, 20);
      yPos += 22;

      // Separator
      doc.setDrawColor(150, 150, 180);
      doc.setLineWidth(0.5);
      doc.line(fieldX, yPos, fieldX + fieldW, yPos);
      yPos += 6;
    });

    // Footer
    if (yPos < pageHeight - 20) {
      yPos = pageHeight - 15;
    }
    doc.setFontSize(7);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('New Hanover County Schools | Transportation Department | Field Work Order Assignment', pageWidth / 2, yPos, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="field-work-orders.pdf"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});