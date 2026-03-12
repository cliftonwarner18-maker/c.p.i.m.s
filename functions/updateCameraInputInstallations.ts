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
    
    // Find all work orders with "Install Inputs for amber, reds, stop sign" and ensure type is "Camera Repair"
    const targetWOs = allWOs.filter(wo => 
      (wo.issue_description || '').trim() === 'Install Inputs for amber, reds, stop sign' &&
      wo.work_order_type !== 'Camera Repair'
    );

    let updated = 0;

    // Batch updates in groups of 5 to avoid rate limiting
    for (let i = 0; i < targetWOs.length; i += 5) {
      const batch = targetWOs.slice(i, i + 5);
      await Promise.all(
        batch.map(wo => 
          base44.entities.WorkOrder.update(wo.id, { work_order_type: 'Camera Repair' })
        )
      );
      updated += batch.length;
      // Small delay between batches
      if (i + 5 < targetWOs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return Response.json({
      message: 'Updated Camera Repair input installation work order types',
      updated: updated,
      totalProcessed: allWOs.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});