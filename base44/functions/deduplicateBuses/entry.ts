import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all buses
    const allBuses = await base44.asServiceRole.entities.Bus.list();
    
    // Group buses by bus_number
    const groupedByNumber = {};
    for (const bus of allBuses) {
      if (!bus.bus_number) continue;
      if (!groupedByNumber[bus.bus_number]) {
        groupedByNumber[bus.bus_number] = [];
      }
      groupedByNumber[bus.bus_number].push(bus);
    }

    let deletedCount = 0;
    const deletedBuses = [];
    const keptBuses = [];

    // For each group with duplicates, delete the one with least data
    for (const [busNumber, buses] of Object.entries(groupedByNumber)) {
      if (buses.length <= 1) continue;

      // Count non-empty fields for each bus
      const busesWithCounts = buses.map(bus => {
        let count = 0;
        const fields = ['year', 'make', 'model', 'vin', 'engine', 'camera_system_type', 
                       'camera_serial_number', 'camera_model_number', 'asset_number', 'notes'];
        for (const field of fields) {
          if (bus[field] && bus[field].toString().trim() !== '' && bus[field] !== 'N/A' && bus[field] !== 'NA') {
            count++;
          }
        }
        return { bus, count };
      });

      // Sort by count descending, keep the one with most data
      busesWithCounts.sort((a, b) => b.count - a.count);
      
      // Delete all but the first (most complete)
      for (let i = 1; i < busesWithCounts.length; i++) {
        const busToDelete = busesWithCounts[i];
        try {
          await base44.asServiceRole.entities.Bus.delete(busToDelete.bus.id);
          deletedCount++;
          deletedBuses.push({
            bus_number: busNumber,
            id: busToDelete.bus.id,
            data_fields_count: busToDelete.count
          });
        } catch (error) {
          console.error(`Failed to delete bus ${busToDelete.bus.id}:`, error.message);
        }
      }
      
      keptBuses.push({
        bus_number: busNumber,
        id: busesWithCounts[0].bus.id,
        data_fields_count: busesWithCounts[0].count
      });
    }

    return Response.json({
      success: true,
      deletedCount,
      totalDuplicateGroups: Object.keys(groupedByNumber).filter(num => groupedByNumber[num].length > 1).length,
      deletedBuses,
      keptBuses
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});