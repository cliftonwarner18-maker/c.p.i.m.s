import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
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

    // Create single Excel workbook with multiple sheets
    const workbook = XLSX.utils.book_new();
    
    const addSheet = (data, columns, sheetName) => {
      const worksheet = XLSX.utils.json_to_sheet(data.map(row => {
        const obj = {};
        columns.forEach(col => {
          obj[col] = row[col] || '';
        });
        return obj;
      }));
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    };

    addSheet(buses, ['bus_number', 'bus_type', 'base_location', 'year', 'make', 'model', 'vin', 'passenger_capacity', 'status', 'camera_system_type', 'next_inspection_due'], 'Buses');
    addSheet(workOrders, ['order_number', 'bus_number', 'reported_by', 'issue_description', 'status', 'technician_name', 'repairs_rendered', 'completed_date'], 'WorkOrders');
    addSheet(inspections, ['inspection_number', 'bus_number', 'inspector_name', 'inspection_date', 'camera_system_functional', 'overall_status', 'next_inspection_due'], 'Inspections');
    addSheet(busHistory, ['bus_number', 'technician', 'description', 'start_time', 'end_time', 'elapsed_minutes'], 'BusHistory');
    addSheet(serializedAssets, ['asset_number', 'brand', 'model', 'serial_number', 'asset_type', 'status', 'assigned_bus_number'], 'SerializedAssets');
    addSheet(nonSerializedAssets, ['part_name', 'brand', 'model_number', 'use', 'quantity_on_hand', 'current_location'], 'NonSerializedAssets');
    addSheet(hdrives, ['serial_number', 'make', 'model', 'current_user', 'current_lot', 'current_location', 'seized', 'seizing_agency', 'seizure_date'], 'HDrives');
    addSheet(custodyLogs, ['hdrive_serial', 'transferred_from', 'transferred_to', 'previous_location', 'new_location', 'reason', 'transfer_date'], 'CustodyLogs');
    addSheet(users, ['full_name', 'email', 'role'], 'SystemUsers');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=master-backup.xlsx',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});