import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all buses
    const buses = await base44.asServiceRole.entities.Bus.list();
    let cleaned = 0;

    // Fields to check for mojibake
    const fieldsToCheck = [
      'passenger_capacity',
      'model',
      'model_number',
      'camera_model_number',
      'camera_serial_number',
      'vin',
      'engine'
    ];

    // Process each bus
    for (const bus of buses) {
      let updates = {};
      let hasMojibake = false;

      for (const field of fieldsToCheck) {
        const value = bus[field];
        
        // Check if field contains mojibake patterns
        if (value && typeof value === 'string' && (
          value.includes('ï¿½') ||
          value.match(/[\uFFFD]/g) ||
          value.trim() === ''
        )) {
          updates[field] = null;
          hasMojibake = true;
        }
      }

      // Update bus if mojibake found
      if (hasMojibake) {
        await base44.asServiceRole.entities.Bus.update(bus.id, updates);
        cleaned++;
      }
    }

    return Response.json({
      success: true,
      message: `Cleaned ${cleaned} bus records with corrupted data`,
      cleaned
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});