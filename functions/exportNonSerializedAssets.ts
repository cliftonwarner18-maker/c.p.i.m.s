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

    const assets = await base44.entities.NonSerializedAsset.list();

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let y = 10;

    // Title
    doc.setFontSize(16);
    doc.text('NON-SERIALIZED ASSETS INVENTORY REPORT', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Date
    doc.setFontSize(10);
    const dateStr = `Report Generated: ${moment().tz('America/New_York').format('MM/DD/YYYY HH:mm')}`;
    doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Headers
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    const headers = ['Part Name', 'Brand', 'Model #', 'Use', 'Qty', 'Location'];
    const colWidths = [30, 20, 20, 25, 12, 33];
    let x = 8;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += 6;

    // Sanitize function
    const sanitize = (str) => {
      if (!str || str === null || str === undefined) return null;
      let cleaned = String(str)
        .replace(/[\uFFFD]/g, '')
        .replace(/[ï¿½]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
      return cleaned === '' ? null : cleaned;
    };

    // Data rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    assets.forEach(asset => {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = 10;
      }
      
      x = 8;
      doc.text((sanitize(asset.part_name) || '-').substring(0, 25), x, y);
      x += colWidths[0];
      doc.text(sanitize(asset.brand) || '-', x, y);
      x += colWidths[1];
      doc.text(sanitize(asset.model_number) || '-', x, y);
      x += colWidths[2];
      doc.text((sanitize(asset.use) || '-').substring(0, 20), x, y);
      x += colWidths[3];
      doc.text(String(asset.quantity_on_hand || 0), x, y);
      x += colWidths[4];
      doc.text((sanitize(asset.current_location) || '-').substring(0, 25), x, y);
      y += 6;
    });

    // Footer
    y += 8;
    doc.setFontSize(8);
    doc.text(`Total Part Types: ${assets.length}`, 8, y);

    const pdf = doc.output('arraybuffer');
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="non-serialized-assets.pdf"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});