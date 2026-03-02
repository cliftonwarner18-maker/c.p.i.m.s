import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import JSZip from 'npm:jszip@3.10.1';

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
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str}"`;
      }
      return str;
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
    
    const busHistory_csv = createCSV(busHistory, ['bus_number', 'technician', 'description', 'start_time', 'end_time', 'elapsed_minutes']);

    // Create zip file with individual CSVs
    const zip = new JSZip();
    
    zip.file('Buses.csv', buses_csv);
    zip.file('WorkOrders.csv', workOrders_csv);
    zip.file('Inspections.csv', inspections_csv);
    zip.file('BusHistory.csv', busHistory_csv);
    zip.file('SerializedAssets.csv', serializedAssets_csv);
    zip.file('NonSerializedAssets.csv', nonSerializedAssets_csv);
    zip.file('HDrives.csv', hdrives_csv);
    zip.file('CustodyLogs.csv', custodyLogs_csv);
    zip.file('SystemUsers.csv', users_csv);

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    return new Response(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=master-backup.zip',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});