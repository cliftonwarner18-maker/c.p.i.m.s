import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data (all statuses, no filters)
    const [buses, workOrders, inspections, serializedAssets, nonSerializedAssets, hdrives, users, custodyLogs, busHistory] = await Promise.all([
      base44.entities.Bus.list(),
      base44.entities.WorkOrder.list(),
      base44.entities.Inspection.list(),
      base44.entities.SerializedAsset.list(),
      base44.entities.NonSerializedAsset.list(),
      base44.entities.HDrive.list(),
      base44.entities.User.list(),
      base44.entities.CustodyLog.list(),
      base44.entities.BusHistory.list(),
    ]);

    const sanitize = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Helper to create CSV from array of objects
    const createCSV = (data, columns) => {
      if (!data.length) return columns.join(',') + '\n';
      const header = columns.join(',');
      const rows = data.map((row) =>
        columns.map((col) => sanitize(row[col])).join(',')
      );
      return [header, ...rows].join('\n');
    };

    // Create individual CSV files
    const buses_csv = createCSV(buses, ['bus_number', 'bus_type', 'base_location', 'year', 'make', 'model', 'vin', 'passenger_capacity', 'status', 'camera_system_type', 'next_inspection_due']);
    
    const workOrders_csv = createCSV(workOrders, ['order_number', 'bus_number', 'reported_by', 'issue_description', 'status', 'technician_name', 'repairs_rendered', 'completed_date']);
    
    const inspections_csv = createCSV(inspections, ['inspection_number', 'bus_number', 'inspector_name', 'inspection_date', 'camera_system_functional', 'overall_status', 'next_inspection_due']);
    
    const serializedAssets_csv = createCSV(serializedAssets, ['asset_number', 'brand', 'model', 'serial_number', 'asset_type', 'status', 'assigned_bus_number']);
    
    const nonSerializedAssets_csv = createCSV(nonSerializedAssets, ['part_name', 'brand', 'model_number', 'use', 'quantity_on_hand', 'current_location']);
    
    const hdrives_csv = createCSV(hdrives, ['serial_number', 'make', 'model', 'current_user', 'current_lot', 'current_location', 'seized', 'seizing_agency', 'seizure_date']);
    
    const users_csv = createCSV(users, ['full_name', 'email', 'role']);
    
    const custodyLogs_csv = createCSV(custodyLogs, ['hdrive_serial', 'transferred_from', 'transferred_to', 'previous_location', 'new_location', 'reason', 'transfer_date']);

    // Combine all CSVs into a single text blob with separators
    const combinedContent = [
      '=== MASTER SYSTEM BACKUP - CSV ARCHIVE ===',
      new Date().toISOString(),
      '',
      '=== FLEET VEHICLES ===',
      buses_csv,
      '',
      '=== WORK ORDERS ===',
      workOrders_csv,
      '',
      '=== INSPECTIONS ===',
      inspections_csv,
      '',
      '=== SERIALIZED ASSETS ===',
      serializedAssets_csv,
      '',
      '=== SPARE PARTS ===',
      nonSerializedAssets_csv,
      '',
      '=== H-DRIVES ===',
      hdrives_csv,
      '',
      '=== CUSTODY LOGS ===',
      custodyLogs_csv,
      '',
      '=== SYSTEM USERS ===',
      users_csv,
    ].join('\n');

    // Return as text file (client can save as .txt or .csv)
    const buffer = new TextEncoder().encode(combinedContent);
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=master-backup.csv',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});