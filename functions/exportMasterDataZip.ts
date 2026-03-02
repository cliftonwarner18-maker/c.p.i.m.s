import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import JSZip from 'npm:jszip@3.10.1';

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
    const [buses, workOrders, inspections, serializedAssets, nonSerializedAssets, hdrives, users, custodyLogs, busHistory, decommissionedAssets] = await Promise.all([
      base44.entities.Bus.list(),
      base44.entities.WorkOrder.list(),
      base44.entities.Inspection.list(),
      base44.entities.SerializedAsset.list(),
      base44.entities.NonSerializedAsset.list(),
      base44.entities.HDrive.list(),
      base44.entities.User.list(),
      base44.entities.CustodyLog.list(),
      base44.entities.BusHistory.list(),
      base44.entities.DecommissionedAsset.list(),
    ]);

    // Create ZIP with CSVs
    const zip = new JSZip();
    
    zip.file('Buses.csv', toCsv(buses, ['id', 'created_date', 'bus_number', 'bus_type', 'base_location', 'year', 'make', 'model', 'vin', 'passenger_capacity', 'status', 'camera_system_type', 'samsara_enabled', 'next_inspection_due', 'notes']));
    zip.file('WorkOrders.csv', toCsv(workOrders, ['id', 'created_date', 'order_number', 'bus_number', 'reported_by', 'issue_description', 'status', 'technician_name', 'repairs_rendered', 'repair_start_time', 'repair_end_time', 'elapsed_time_minutes', 'completed_date']));
    zip.file('Inspections.csv', toCsv(inspections, ['id', 'created_date', 'inspection_number', 'bus_number', 'inspector_name', 'inspection_date', 'camera_system_functional', 'dvr_functional', 'overall_status', 'inspection_notes', 'next_inspection_due']));
    zip.file('BusHistory.csv', toCsv(busHistory, ['id', 'created_date', 'bus_number', 'technician', 'description', 'start_time', 'end_time', 'elapsed_minutes']));
    zip.file('SerializedAssets.csv', toCsv(serializedAssets, ['id', 'created_date', 'asset_number', 'brand', 'model', 'serial_number', 'asset_type', 'status', 'assigned_bus_number', 'current_location']));
    zip.file('NonSerializedAssets.csv', toCsv(nonSerializedAssets, ['id', 'created_date', 'part_name', 'brand', 'model_number', 'use', 'quantity_on_hand', 'current_location']));
    zip.file('HDrives.csv', toCsv(hdrives, ['id', 'created_date', 'make', 'model', 'serial_number', 'current_user', 'current_lot', 'current_sublocation', 'current_location', 'seized', 'seizing_agency', 'seizure_date', 'seizure_reason']));
    zip.file('CustodyLogs.csv', toCsv(custodyLogs, ['id', 'created_date', 'hdrive_serial', 'transferred_from', 'transferred_to', 'previous_location', 'new_location', 'reason', 'transfer_date']));
    zip.file('DecommissionedAssets.csv', toCsv(decommissionedAssets, ['id', 'created_date', 'out_of_service_date', 'employee', 'bus_number', 'make', 'model', 'asset_number', 'serial_number', 'oos_reason', 'decom_status', 'out_of_inventory']));
    zip.file('SystemUsers.csv', toCsv(users, ['id', 'created_date', 'full_name', 'email', 'role']));

    const zipData = await zip.generateAsync({ type: 'uint8array' });

    return new Response(zipData, {
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