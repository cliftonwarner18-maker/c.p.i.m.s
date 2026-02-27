import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityName } = await req.json();
    
    if (!entityName) {
      return Response.json({ error: 'entityName required' }, { status: 400 });
    }

    // Fetch all records of the entity
    const allRecords = await base44.asServiceRole.entities[entityName].list();
    
    // Group by serial_number
    const grouped = {};
    allRecords.forEach(record => {
      const serial = record.serial_number?.trim().toLowerCase();
      if (serial) {
        if (!grouped[serial]) grouped[serial] = [];
        grouped[serial].push(record);
      }
    });

    // Find duplicates and determine which to keep
    let deletedCount = 0;
    const toDelete = [];

    Object.entries(grouped).forEach(([serial, records]) => {
      if (records.length > 1) {
        // Sort by number of non-empty fields (descending), then by creation date (newer first)
        const sorted = records.sort((a, b) => {
          const aFields = Object.values(a).filter(v => v && v !== '' && v !== false).length;
          const bFields = Object.values(b).filter(v => v && v !== '' && v !== false).length;
          if (aFields !== bFields) return bFields - aFields; // More fields = keep
          return new Date(b.created_date) - new Date(a.created_date); // Newer = keep
        });

        // Keep the first (best), delete the rest
        for (let i = 1; i < sorted.length; i++) {
          toDelete.push(sorted[i].id);
        }
      }
    });

    // Delete duplicates
    for (const id of toDelete) {
      await base44.asServiceRole.entities[entityName].delete(id);
      deletedCount++;
    }

    return Response.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} duplicate records from ${entityName}`,
      deletedCount 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});