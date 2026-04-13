import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { updates } = await req.json();
    if (!updates || !Array.isArray(updates)) {
      return Response.json({ error: 'Invalid updates format' }, { status: 400 });
    }

    // Fetch all buses
    const allBuses = await base44.asServiceRole.entities.Bus.list();
    
    let successCount = 0;
    let skipCount = 0;
    let errors = [];

    // Process updates in batches of 10 with 500ms delay between batches
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      for (const update of batch) {
        const { bus_number, asset_number } = update;
        
        // Skip if no asset number
        if (!asset_number || asset_number === 'NA' || asset_number.trim() === '') {
          skipCount++;
          continue;
        }

        // Find the bus
        const bus = allBuses.find(b => b.bus_number === bus_number);
        if (!bus) {
          errors.push(`Bus #${bus_number} not found`);
          continue;
        }

        try {
          // Update the bus with the asset number
          await base44.asServiceRole.entities.Bus.update(bus.id, {
            asset_number: asset_number.toString().trim()
          });
          successCount++;
        } catch (error) {
          errors.push(`Bus #${bus_number}: ${error.message}`);
        }
      }
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return Response.json({
      success: true,
      successCount,
      skipCount,
      errors: errors.length > 0 ? errors : null,
      total: updates.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});