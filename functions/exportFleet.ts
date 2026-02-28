import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const formatDateTime24h = (date = new Date()) => {
  const offset = -5 * 60 * 60 * 1000; // EST/EDT offset
  const localDate = new Date(date.getTime() + offset);
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  const year = localDate.getUTCFullYear();
  const hours = String(localDate.getUTCHours()).padStart(2, '0');
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}`;
};

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

    // Sanitize function
    const sanitize = (str) => {
      if (!str || str === null || str === undefined) return null;
      let cleaned = String(str)
        .replace(/[\uFFFD]/g, '')
        .replace(/[ï¿½]/g, '')
        .replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, '')
        .replace(/[«»„""‟‚''‹›]/g, '"')
        .replace(/[−–—]/g, '-')
        .replace(/[…]/g, '...')
        .replace(/[©®™]/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim();
      return cleaned === '' ? null : cleaned;
    };

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
    const dateStr = `Report Generated: ${formatDateTime24h()}`;
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
      doc.text(sanitize(bus.bus_number) || '-', x, y);
      x += colWidths[0];
      doc.text((sanitize(bus.bus_type) || '-').substring(0, 15), x, y);
      x += colWidths[1];
      doc.text(sanitize(bus.base_location) || '-', x, y);
      x += colWidths[2];
      doc.text(sanitize(bus.year) || '-', x, y);
      x += colWidths[3];
      doc.text((sanitize(bus.make) || '-').substring(0, 15), x, y);
      x += colWidths[4];
      doc.text((sanitize(bus.model) || '-').substring(0, 20), x, y);
      x += colWidths[5];
      doc.text(sanitize(bus.status) || '-', x, y);
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
    console.error('Error in exportFleet:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});