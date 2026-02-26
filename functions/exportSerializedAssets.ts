import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { statusFilter, startDate, endDate } = body;

    const assets = await base44.entities.SerializedAsset.list();
    
    let filtered = assets;
    if (statusFilter && statusFilter !== 'All') {
      filtered = assets.filter(a => a.status === statusFilter);
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let y = 10;

    // Title
    doc.setFontSize(16);
    doc.text('SERIALIZED ASSETS INVENTORY REPORT', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Date range
    doc.setFontSize(10);
    const dateStr = `Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
    y += 6;

    if (statusFilter && statusFilter !== 'All') {
      doc.text(`Status Filter: ${statusFilter}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    y += 4;

    // Headers
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    const headers = ['Asset #', 'Brand', 'Model', 'Serial #', 'Status', 'Bus #', 'Location'];
    const colWidths = [20, 20, 20, 25, 20, 15, 30];
    let x = 8;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += 6;

    // Data rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    filtered.forEach(asset => {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = 10;
      }
      
      x = 8;
      doc.text(asset.asset_number || '-', x, y);
      x += colWidths[0];
      doc.text(asset.brand || '-', x, y);
      x += colWidths[1];
      doc.text(asset.model || '-', x, y);
      x += colWidths[2];
      doc.text(asset.serial_number || '-', x, y);
      x += colWidths[3];
      doc.text(asset.status || '-', x, y);
      x += colWidths[4];
      doc.text(asset.assigned_bus_number || '-', x, y);
      x += colWidths[5];
      doc.text((asset.current_location || '-').substring(0, 20), x, y);
      y += 6;
    });

    // Footer
    y += 8;
    doc.setFontSize(8);
    doc.text(`Total Assets: ${filtered.length}`, 8, y);

    const pdf = doc.output('arraybuffer');
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="serialized-assets.pdf"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});