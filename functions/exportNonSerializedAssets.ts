import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import momentTZ from 'npm:moment-timezone@0.5.45';
import autoTable from 'npm:jspdf-autotable@3.8.3';

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
    const dateStr = `Report Generated: ${momentTZ().tz('America/New_York').format('MM/DD/YYYY HH:mm')}`;
    doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
    y += 10;

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

    // Prepare table data
    const tableData = assets.map(asset => [
      sanitize(asset.part_name) || '-',
      sanitize(asset.brand) || '-',
      sanitize(asset.model_number) || '-',
      sanitize(asset.use) || '-',
      String(asset.quantity_on_hand || 0),
      sanitize(asset.current_location) || '-'
    ]);

    // Generate table
    autoTable(doc, {
      head: [['Part Name', 'Brand', 'Model #', 'Use', 'Qty', 'Location']],
      body: tableData,
      startY: y,
      margin: { left: 8, right: 8 },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 24 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 14 },
        5: { cellWidth: 30 }
      },
      headStyles: { fontSize: 9, cellPadding: 3 },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: (data) => {
        y = data.cursor.y;
      }
    });

    // Footer
    doc.setFontSize(8);
    doc.text(`Total Part Types: ${assets.length}`, 8, y + 10);

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