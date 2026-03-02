import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { rows } = body; // Array of { bus_number, dash_cam_sid, gateway_sid }

    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    // Fetch all buses
    const allBuses = await base44.asServiceRole.entities.Bus.list();

    let updated = 0;
    let skipped = 0;
    const errors = [];

    // Update each bus
    for (const row of rows) {
      const { bus_number, dash_cam_sid, gateway_sid } = row;

      if (!bus_number) {
        skipped++;
        continue;
      }

      // Find matching bus
      const bus = allBuses.find(b => b.bus_number === bus_number);
      if (!bus) {
        skipped++;
        continue;
      }

      // Skip if "Installed" is used (placeholder)
      const dashCamId = dash_cam_sid && dash_cam_sid !== 'Installed' ? dash_cam_sid : null;
      const gatewayId = gateway_sid && gateway_sid !== 'Installed' ? gateway_sid : null;

      // Only update if at least one field has data
      if (dashCamId || gatewayId) {
        const updateData = {};
        if (dashCamId) updateData.dash_cam_sid = dashCamId;
        if (gatewayId) updateData.gateway_sid = gatewayId;

        try {
          await base44.asServiceRole.entities.Bus.update(bus.id, updateData);
          updated++;
        } catch (err) {
          errors.push(`Bus ${bus_number}: ${err.message}`);
        }
      } else {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      updated,
      skipped,
      total: rows.length,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});