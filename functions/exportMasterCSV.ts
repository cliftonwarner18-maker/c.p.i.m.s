import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import JSZip from 'npm:jszip@3.10.1';
import XLSX from 'npm:xlsx@0.18.5';

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

    // Helper to create Excel workbook from data
    const createExcel = (data, columns) => {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data.map(row => {
        const obj = {};
        columns.forEach(col => {
          obj[col] = row[col] || '';
        });
        return obj;
      }));
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    };

    // Create Excel files
    const buses_xlsx = createExcel(buses, ['bus_number', 'bus_type', 'base_location', 'year', 'make', 'model', 'vin', 'passenger_capacity', 'status', 'camera_system_type', 'next_inspection_due']);
    const workOrders_xlsx = createExcel(workOrders, ['order_number', 'bus_number', 'reported_by', 'issue_description', 'status', 'technician_name', 'repairs_rendered', 'completed_date']);
    const inspections_xlsx = createExcel(inspections, ['inspection_number', 'bus_number', 'inspector_name', 'inspection_date', 'camera_system_functional', 'overall_status', 'next_inspection_due']);
    const serializedAssets_xlsx = createExcel(serializedAssets, ['asset_number', 'brand', 'model', 'serial_number', 'asset_type', 'status', 'assigned_bus_number']);
    const nonSerializedAssets_xlsx = createExcel(nonSerializedAssets, ['part_name', 'brand', 'model_number', 'use', 'quantity_on_hand', 'current_location']);
    const hdrives_xlsx = createExcel(hdrives, ['serial_number', 'make', 'model', 'current_user', 'current_lot', 'current_location', 'seized', 'seizing_agency', 'seizure_date']);
    const users_xlsx = createExcel(users, ['full_name', 'email', 'role']);
    const custodyLogs_xlsx = createExcel(custodyLogs, ['hdrive_serial', 'transferred_from', 'transferred_to', 'previous_location', 'new_location', 'reason', 'transfer_date']);
    const busHistory_xlsx = createExcel(busHistory, ['bus_number', 'technician', 'description', 'start_time', 'end_time', 'elapsed_minutes']);

    // Create zip with Excel files
    const zip = new JSZip();
    zip.file('Buses.xlsx', new Uint8Array(buses_xlsx));
    zip.file('WorkOrders.xlsx', new Uint8Array(workOrders_xlsx));
    zip.file('Inspections.xlsx', new Uint8Array(inspections_xlsx));
    zip.file('BusHistory.xlsx', new Uint8Array(busHistory_xlsx));
    zip.file('SerializedAssets.xlsx', new Uint8Array(serializedAssets_xlsx));
    zip.file('NonSerializedAssets.xlsx', new Uint8Array(nonSerializedAssets_xlsx));
    zip.file('HDrives.xlsx', new Uint8Array(hdrives_xlsx));
    zip.file('CustodyLogs.xlsx', new Uint8Array(custodyLogs_xlsx));
    zip.file('SystemUsers.xlsx', new Uint8Array(users_xlsx));

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