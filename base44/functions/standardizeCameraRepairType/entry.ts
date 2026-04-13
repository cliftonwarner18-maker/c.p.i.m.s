import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all work orders
    const allWOs = await base44.entities.WorkOrder.list('-created_date', 1000);
    
    // Find camera repair work orders and ensure type is set correctly
    const updates = [];
    let updated = 0;

    for (const wo of allWOs) {
      // If issue_description or repairs_rendered contains "camera" (case-insensitive), ensure type is Camera Repair
      const description = (wo.issue_description || '').toLowerCase();
      const repairs = (wo.repairs_rendered || '').toLowerCase();
      const isCameraRelated = description.includes('camera') || repairs.includes('camera');
      
      if (isCameraRelated && wo.work_order_type !== 'Camera Repair') {
        updates.push(
          base44.entities.WorkOrder.update(wo.id, { work_order_type: 'Camera Repair' })
        );
        updated++;
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return Response.json({
      message: 'Standardized Camera Repair work order types',
      updated: updated,
      totalProcessed: allWOs.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});