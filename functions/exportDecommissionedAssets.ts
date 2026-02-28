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
    const { statusFilter, startDate, endDate, filterOutOfInventory } = body;

    let assets = await base44.entities.DecommissionedAsset.list();
    
    if (statusFilter && statusFilter !== 'All') {
      assets = assets.filter(a => a.decom_status === statusFilter);
    }

    if (startDate || endDate) {
      assets = assets.filter(a => {
        const assetDate = new Date(a.out_of_service_date);
        if (startDate && assetDate < new Date(startDate)) return false;
        if (endDate && assetDate > new Date(endDate)) return false;
        return true;
      });
    }

    if (filterOutOfInventory) {
      assets = assets.filter(a => a.out_of_inventory === true);
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    let y = 10;

    // Title
    doc.setFontSize(16);
    doc.text('DECOMMISSIONED ASSETS LOG', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Date
    doc.setFontSize(10);
    const dateStr = `Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
    y += 6;

    if (statusFilter && statusFilter !== 'All') {
      doc.text(`Status Filter: ${statusFilter}`, pageWidth / 2, y, { align: 'center' });
      y += 6;
    }
    if (filterOutOfInventory) {
      doc.text('Filter: Out of Inventory Only', pageWidth / 2, y, { align: 'center' });
      y += 6;
    }

    y += 4;

    // Headers
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    const headers = ['OOS Date', 'Employee', 'Make/Model', 'Serial #', 'Reason', 'Status'];
    const colWidths = [18, 18, 22, 18, 28, 22];
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
      doc.text(sanitize(asset.out_of_service_date) || '-', x, y);
      x += colWidths[0];
      doc.text(sanitize(asset.employee) || '-', x, y);
      x += colWidths[1];
      doc.text((sanitize(`${asset.make} ${asset.model}`) || '-').substring(0, 20), x, y);
      x += colWidths[2];
      doc.text(sanitize(asset.serial_number) || '-', x, y);
      x += colWidths[3];
      doc.text((sanitize(asset.oos_reason) || '-').substring(0, 35), x, y);
      x += colWidths[4];
      doc.text(sanitize(asset.decom_status) || '-', x, y);
      y += 6;
    });

    // Footer
    y += 8;
    doc.setFontSize(8);
    doc.text(`Total Records: ${assets.length}`, 8, y);

    const pdf = doc.output('arraybuffer');
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="decommissioned-assets.pdf"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});