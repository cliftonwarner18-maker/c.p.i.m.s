import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const { default: autoTable } = await import('npm:jspdf-autotable@3.8.3');
    autoTable(jsPDF);

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
    const dateStr = `Report Generated: ${moment().tz('America/New_York').format('MM/DD/YYYY HH:mm')}`;
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
      sanitize(asset.out_of_service_date) || '-',
      sanitize(asset.employee) || '-',
      sanitize(`${asset.make} ${asset.model}`) || '-',
      sanitize(asset.serial_number) || '-',
      sanitize(asset.oos_reason) || '-',
      sanitize(asset.decom_status) || '-'
    ]);

    // Generate table
    autoTable(doc, {
      head: [['OOS Date', 'Employee', 'Make/Model', 'Serial #', 'Reason', 'Status']],
      body: tableData,
      startY: y,
      margin: { left: 8, right: 8 },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 20 },
        2: { cellWidth: 28 },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 },
        5: { cellWidth: 25 }
      },
      headStyles: { fontSize: 9, cellPadding: 3 },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: (data) => {
        y = data.cursor.y;
      }
    });

    // Footer
    doc.setFontSize(8);
    doc.text(`Total Records: ${assets.length}`, 8, y + 10);

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