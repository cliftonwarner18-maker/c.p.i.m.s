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
    const { locationFilter, busTypeFilter } = body;

    let buses = await base44.entities.Bus.list();
    
    if (locationFilter && locationFilter !== 'All') {
      buses = buses.filter(b => b.base_location === locationFilter);
    }

    if (busTypeFilter && busTypeFilter !== 'All') {
      buses = buses.filter(b => b.bus_type === busTypeFilter);
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let y = 10;

    // Title
    doc.setFontSize(16);
    doc.text('FLEET INVENTORY REPORT', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Date
    doc.setFontSize(10);
    const dateStr = `Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
    y += 6;

    if (locationFilter && locationFilter !== 'All') {
      doc.text(`Location: ${locationFilter}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    if (busTypeFilter && busTypeFilter !== 'All') {
      doc.text(`Type: ${busTypeFilter}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    y += 4;

    // Headers
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    const headers = ['Bus #', 'Type', 'Location', 'Year', 'Make', 'Model', 'Status'];
    const colWidths = [18, 20, 20, 15, 20, 25, 22];
    let x = 8;
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += 6;

    // Data rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    buses.forEach(bus => {
      if (y > pageHeight - 15) {
        doc.addPage();
        y = 10;
      }
      
      x = 8;
      doc.text(bus.bus_number || '-', x, y);
      x += colWidths[0];
      doc.text((bus.bus_type || '-').substring(0, 15), x, y);
      x += colWidths[1];
      doc.text(bus.base_location || '-', x, y);
      x += colWidths[2];
      doc.text(bus.year || '-', x, y);
      x += colWidths[3];
      doc.text((bus.make || '-').substring(0, 15), x, y);
      x += colWidths[4];
      doc.text((bus.model || '-').substring(0, 20), x, y);
      x += colWidths[5];
      doc.text(bus.status || '-', x, y);
      y += 6;
    });

    // Footer
    y += 8;
    doc.setFontSize(8);
    doc.text(`Total Vehicles: ${buses.length}`, 8, y);

    const pdf = doc.output('arraybuffer');
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="fleet-inventory.pdf"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});