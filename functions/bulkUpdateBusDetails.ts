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
        const { bus_number, dvr_serial, camera_brand, year, make, vin } = update;
        
        // Skip if no bus number
        if (!bus_number || bus_number.trim() === '') {
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
          // Build update object with only non-empty fields
          const updateData = {};
          if (dvr_serial && dvr_serial.trim() !== '') {
            updateData.camera_serial_number = dvr_serial.toString().trim();
          }
          if (camera_brand && camera_brand.trim() !== '') {
            updateData.camera_system_type = camera_brand.includes('Safety') ? 'Safety Vision' : 'Seon';
          }
          if (year && year.trim() !== '') {
            updateData.year = year.toString().trim();
          }
          if (make && make.trim() !== '') {
            updateData.make = make.toString().trim();
          }
          if (vin && vin.trim() !== '') {
            updateData.vin = vin.toString().trim();
          }

          if (Object.keys(updateData).length > 0) {
            await base44.asServiceRole.entities.Bus.update(bus.id, updateData);
            successCount++;
          } else {
            skipCount++;
          }
        } catch (error) {
          errors.push(`Bus #${bus_number}: ${error.message}`);
        }
      }
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < updates.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
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