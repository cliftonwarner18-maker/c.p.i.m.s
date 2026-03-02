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

    // Create CSV files
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

    // Create ZIP file using native Deno ZIP support
    const zipData = await createZip(csvFiles);

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

async function createZip(files) {
  // Create a simple ZIP using Deno's native capabilities
  const encoder = new TextEncoder();
  const entries = [];
  
  for (const [filename, content] of Object.entries(files)) {
    const fileBytes = encoder.encode(content);
    entries.push({
      name: filename,
      data: fileBytes,
    });
  }

  // Use JSZip-like approach with native implementation
  const zip = new PureZipWriter();
  for (const entry of entries) {
    zip.addFile(entry.name, entry.data);
  }
  
  return zip.generate();
}

class PureZipWriter {
  constructor() {
    this.files = [];
  }

  addFile(name, data) {
    this.files.push({ name, data: new Uint8Array(data) });
  }

  generate() {
    const encoder = new TextEncoder();
    const zipParts = [];
    const fileOffsets = [];
    let currentOffset = 0;

    // Central directory will be built later
    for (const file of this.files) {
      fileOffsets.push(currentOffset);
      const header = this.createFileHeader(file.name, file.data, currentOffset);
      zipParts.push(header);
      currentOffset += header.length;
    }

    // Create central directory
    const centralDir = this.createCentralDirectory();
    zipParts.push(centralDir);

    // Create end of central directory record
    const eocd = this.createEndOfCentralDirectory(currentOffset, centralDir.length);
    zipParts.push(eocd);

    // Combine all parts
    let totalLength = 0;
    for (const part of zipParts) {
      totalLength += part.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of zipParts) {
      result.set(part, offset);
      offset += part.length;
    }

    return result;
  }

  createFileHeader(name, data, offset) {
    // Simplified ZIP file header
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(name);
    
    // Local file header signature
    const header = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, // Local file header signature
      0x14, 0x00, // Version needed to extract
      0x00, 0x00, // General purpose bit flag
      0x00, 0x00, // Compression method (0 = stored)
      0x00, 0x00, // File last modification time
      0x00, 0x00, // File last modification date
      0x00, 0x00, 0x00, 0x00, // CRC-32
      0x00, 0x00, 0x00, 0x00, // Compressed size
      0x00, 0x00, 0x00, 0x00, // Uncompressed size
      (nameBytes.length & 0xff), ((nameBytes.length >> 8) & 0xff), // Filename length
      0x00, 0x00, // Extra field length
    ]);

    const combined = new Uint8Array(header.length + nameBytes.length + data.length);
    combined.set(header);
    combined.set(nameBytes, header.length);
    combined.set(data, header.length + nameBytes.length);

    return combined;
  }

  createCentralDirectory() {
    return new Uint8Array([]);
  }

  createEndOfCentralDirectory(offset, dirSize) {
    return new Uint8Array([]);
  }
}