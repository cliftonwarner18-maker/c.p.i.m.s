import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const csvEscape = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const toCsv = (data, columns) => {
  const header = columns.map(col => csvEscape(col)).join(',');
  const rows = (Array.isArray(data) ? data : []).map(row => 
    columns.map(col => csvEscape(row[col])).join(',')
  );
  return [header, ...rows].join('\n');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data
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

    const csvData = [
      '=== BUSES ===\n' + toCsv(buses, ['bus_number', 'bus_type', 'base_location', 'year', 'make', 'model', 'vin', 'passenger_capacity', 'status', 'camera_system_type', 'next_inspection_due']),
      '=== WORK ORDERS ===\n' + toCsv(workOrders, ['order_number', 'bus_number', 'reported_by', 'issue_description', 'status', 'technician_name', 'repairs_rendered', 'completed_date']),
      '=== INSPECTIONS ===\n' + toCsv(inspections, ['inspection_number', 'bus_number', 'inspector_name', 'inspection_date', 'camera_system_functional', 'overall_status', 'next_inspection_due']),
      '=== BUS HISTORY ===\n' + toCsv(busHistory, ['bus_number', 'technician', 'description', 'start_time', 'end_time', 'elapsed_minutes']),
      '=== SERIALIZED ASSETS ===\n' + toCsv(serializedAssets, ['asset_number', 'brand', 'model', 'serial_number', 'asset_type', 'status', 'assigned_bus_number']),
      '=== NON-SERIALIZED ASSETS ===\n' + toCsv(nonSerializedAssets, ['part_name', 'brand', 'model_number', 'use', 'quantity_on_hand', 'current_location']),
      '=== H-DRIVES ===\n' + toCsv(hdrives, ['serial_number', 'make', 'model', 'current_user', 'current_lot', 'current_location', 'seized', 'seizing_agency', 'seizure_date']),
      '=== CUSTODY LOGS ===\n' + toCsv(custodyLogs, ['hdrive_serial', 'transferred_from', 'transferred_to', 'previous_location', 'new_location', 'reason', 'transfer_date']),
      '=== SYSTEM USERS ===\n' + toCsv(users, ['full_name', 'email', 'role']),
    ].join('\n\n');

    const encoder = new TextEncoder();
    const csvBytes = encoder.encode(csvData);

    return new Response(csvBytes, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=master-backup.csv',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});