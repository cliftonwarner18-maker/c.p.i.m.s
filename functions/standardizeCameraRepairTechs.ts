import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all SystemUsers and all non-Radio work orders
    const systemUsers = await base44.entities.SystemUser.list('name', 1000);
    const allWOs = await base44.entities.WorkOrder.list('-created_date', 1000);
    const nonRadioWOs = allWOs.filter(wo => wo.work_order_type !== 'Radio Repair');

    // Create a map of available tech names (case-insensitive for matching)
    const techMap = {};
    systemUsers.forEach(su => {
      techMap[su.name.toUpperCase()] = su.name;
    });

    // Update work orders with matching technician names
    let updated = 0;
    const updates = [];

    for (const wo of cameraRepairWOs) {
      if (wo.technician_name) {
        const upperTech = wo.technician_name.toUpperCase();
        if (techMap[upperTech] && techMap[upperTech] !== wo.technician_name) {
          // Update to match SystemUser exact name
          updates.push(
            base44.entities.WorkOrder.update(wo.id, { technician_name: techMap[upperTech] })
          );
          updated++;
        }
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
    }

    return Response.json({
      message: 'Standardized camera repair work order technician names',
      totalCameraRepairWOs: cameraRepairWOs.length,
      updated: updated,
      availableTechs: systemUsers.map(u => u.name)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});