import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workOrders = await base44.asServiceRole.entities.WorkOrder.list();
    const active = workOrders
      .filter(w => w.status === 'Pending' || w.status === 'In Progress')
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ACTIVE WORK ORDERS — PENDING REPAIRS', 20, 15);
    
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 23);

    const columns = ['ORDER#', 'DATE', 'BUS#', 'REPORTED BY', 'ISSUE', 'STATUS'];
    const rows = active.map(wo => [
      wo.order_number,
      new Date(wo.created_date).toLocaleDateString(),
      wo.bus_number,
      wo.reported_by,
      wo.issue_description.substring(0, 40),
      wo.status
    ]);

    let y = 35;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text(columns.join('     '), 20, y);
    y += 5;
    doc.setFont(undefined, 'normal');
    
    rows.forEach(row => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(row.join('     '), 20, y);
      y += 5;
    });

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=active-work-orders.pdf'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});