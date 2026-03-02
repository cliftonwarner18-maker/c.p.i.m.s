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

const createTar = (files) => {
  const encoder = new TextEncoder();
  const parts = [];

  for (const [filename, content] of Object.entries(files)) {
    const fileBytes = encoder.encode(content);
    const fileSize = fileBytes.length;
    
    // TAR header (512 bytes)
    const header = new Uint8Array(512);
    const headerView = new DataView(header.buffer);
    
    // Filename (0-99)
    for (let i = 0; i < Math.min(filename.length, 100); i++) {
      header[i] = encoder.encode(filename)[i];
    }
    
    // Mode (100-107): 0644
    const mode = '0000644\0';
    for (let i = 0; i < mode.length; i++) {
      header[100 + i] = encoder.encode(mode)[i];
    }
    
    // Owner UID (108-115): 0
    header[108] = 48; // '0'
    header[115] = 32;
    
    // Group UID (116-123): 0
    header[116] = 48; // '0'
    header[123] = 32;
    
    // File size (124-135) in octal
    const sizeStr = fileSize.toString(8).padStart(11, '0') + '\0';
    for (let i = 0; i < sizeStr.length; i++) {
      header[124 + i] = encoder.encode(sizeStr)[i];
    }
    
    // Modification time (136-147)
    const now = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0';
    for (let i = 0; i < now.length; i++) {
      header[136 + i] = encoder.encode(now)[i];
    }
    
    // Checksum (148-155) - set to spaces first
    for (let i = 148; i < 156; i++) {
      header[i] = 32; // space
    }
    
    // Typeflag (156): '0' for regular file
    header[156] = 48;
    
    // Calculate checksum
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    
    const checksumStr = checksum.toString(8).padStart(6, '0') + '\0 ';
    for (let i = 0; i < checksumStr.length; i++) {
      header[148 + i] = encoder.encode(checksumStr)[i];
    }
    
    parts.push(header);
    parts.push(fileBytes);
    
    // Padding to 512-byte boundary
    const padding = (512 - (fileSize % 512)) % 512;
    if (padding > 0) {
      parts.push(new Uint8Array(padding));
    }
  }
  
  // Add two 512-byte blocks of zeros to mark end
  parts.push(new Uint8Array(1024));
  
  // Combine all parts
  let totalLength = 0;
  for (const part of parts) {
    totalLength += part.length;
  }
  
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  
  return result;
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

    // Create CSV files object
    const csvFiles = {
      'Buses.csv': toCsv(buses, ['id', 'created_date', 'bus_number', 'bus_type', 'base_location', 'year', 'make', 'model', 'vin', 'passenger_capacity', 'status', 'camera_system_type', 'samsara_enabled', 'next_inspection_due', 'notes']),
      'WorkOrders.csv': toCsv(workOrders, ['id', 'created_date', 'order_number', 'bus_number', 'reported_by', 'issue_description', 'status', 'technician_name', 'repairs_rendered', 'repair_start_time', 'repair_end_time', 'elapsed_time_minutes', 'completed_date']),
      'Inspections.csv': toCsv(inspections, ['id', 'created_date', 'inspection_number', 'bus_number', 'inspector_name', 'inspection_date', 'camera_system_functional', 'dvr_functional', 'overall_status', 'inspection_notes', 'next_inspection_due']),
      'BusHistory.csv': toCsv(busHistory, ['id', 'created_date', 'bus_number', 'technician', 'description', 'start_time', 'end_time', 'elapsed_minutes']),
      'SerializedAssets.csv': toCsv(serializedAssets, ['id', 'created_date', 'asset_number', 'brand', 'model', 'serial_number', 'asset_type', 'status', 'assigned_bus_number', 'current_location']),
      'NonSerializedAssets.csv': toCsv(nonSerializedAssets, ['id', 'created_date', 'part_name', 'brand', 'model_number', 'use', 'quantity_on_hand', 'current_location']),
      'HDrives.csv': toCsv(hdrives, ['id', 'created_date', 'make', 'model', 'serial_number', 'current_user', 'current_lot', 'current_sublocation', 'current_location', 'seized', 'seizing_agency', 'seizure_date', 'seizure_reason']),
      'CustodyLogs.csv': toCsv(custodyLogs, ['id', 'created_date', 'hdrive_serial', 'transferred_from', 'transferred_to', 'previous_location', 'new_location', 'reason', 'transfer_date']),
      'DecommissionedAssets.csv': toCsv(decommissionedAssets, ['id', 'created_date', 'out_of_service_date', 'employee', 'bus_number', 'make', 'model', 'asset_number', 'serial_number', 'oos_reason', 'decom_status', 'out_of_inventory']),
      'SystemUsers.csv': toCsv(users, ['id', 'created_date', 'full_name', 'email', 'role']),
    };

    const tarData = createTar(csvFiles);

    return new Response(tarData, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-tar',
        'Content-Disposition': 'attachment; filename=master-backup.tar',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});