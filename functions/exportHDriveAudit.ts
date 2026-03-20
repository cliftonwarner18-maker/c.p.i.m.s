import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { search, userFilter, locationFilter, seizedOnly } = body;

    let drives = await base44.entities.HDrive.list('-created_date');

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      drives = drives.filter(d =>
        d.serial_number?.toLowerCase().includes(s) ||
        d.make?.toLowerCase().includes(s) ||
        d.model?.toLowerCase().includes(s) ||
        d.current_user?.toLowerCase().includes(s) ||
        d.current_location?.toLowerCase().includes(s)
      );
    }

    if (userFilter && userFilter.trim()) {
      drives = drives.filter(d => d.current_user === userFilter.trim());
    }

    if (locationFilter && locationFilter.trim()) {
      const lf = locationFilter.trim().toLowerCase();
      drives = drives.filter(d => d.current_location?.toLowerCase().includes(lf));
    }

    if (seizedOnly) {
      drives = drives.filter(d => d.seized === true);
    }

    const allCustody = await base44.entities.CustodyLog.list('-transfer_date');

    const filterParts = [];
    if (userFilter) filterParts.push('User: ' + userFilter);
    if (locationFilter) filterParts.push('Location: ' + locationFilter);
    if (seizedOnly) filterParts.push('SEIZED ONLY');
    if (search) filterParts.push('Search: "' + search + '"');

    const driveSerials = new Set(drives.map(d => d.serial_number));
    const filteredCustody = allCustody.filter(c => driveSerials.has(c.hdrive_serial));
    const seizedDrives = drives.filter(d => d.seized);

    // Generate inventory table rows
    const inventoryRows = drives.map((drive, idx) => {
      const custodyCount = allCustody.filter(c => c.hdrive_serial === drive.serial_number).length;
      const seized = drive.seized;
      const serialLabel = (seized ? '[SEIZED] ' : '') + (drive.serial_number || '-');
      const bgColor = seized ? 'background-color: #ffe6b4; border-left: 3px solid #c86400;' : (idx % 2 === 0 ? 'background-color: #f0f4fc;' : 'background-color: white;');
      const makeModel = ((drive.make || '') + ' ' + (drive.model || '')).trim() || '-';
      return '<tr style="' + bgColor + '">' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8;">' + (idx + 1) + '</td>' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8; font-weight: bold;">' + serialLabel.substring(0, 25) + '</td>' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8;">' + makeModel + '</td>' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8;">' + (drive.current_user || '-').substring(0, 20) + '</td>' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8;">' + (drive.current_location || '-').substring(0, 32) + '</td>' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8; text-align: center;">' + custodyCount + '</td>' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8; color: #666;">___/___/______</td>' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8; text-align: center;">☐</td>' +
        '<td style="padding: 5px 4px; font-size: 12px; border: 1px solid #b4b4c8;">:________________</td>' +
        '</tr>';
    }).join('');

    // Generate seized drives table rows
    const seizedRows = seizedDrives.map(d => {
      const row = '<tr style="background-color: #ffebb8;">' +
        '<td style="padding: 6px 4px; font-size: 12px; border: 1px solid #c86400; font-weight: bold;">' + (d.serial_number || '-') + '</td>' +
        '<td style="padding: 6px 4px; font-size: 12px; border: 1px solid #c86400;">' + (d.seizing_agency || '-') + '</td>' +
        '<td style="padding: 6px 4px; font-size: 12px; border: 1px solid #c86400;">' + (d.seizing_person || '-') + '</td>' +
        '<td style="padding: 6px 4px; font-size: 12px; border: 1px solid #c86400;">' + (d.seizure_case_number || '-') + '</td>' +
        '<td style="padding: 6px 4px; font-size: 12px; border: 1px solid #c86400;">' + (d.seizure_date ? moment(d.seizure_date).tz('America/New_York').format('MM/DD/YYYY HH:mm') : '-') + '</td>' +
        '<td style="padding: 6px 4px; font-size: 12px; border: 1px solid #c86400;">' + (d.seizure_reason || '-') + '</td>' +
        '</tr>';
      if (d.seizure_notes) {
        return row + '<tr style="background-color: #fffadc;"><td colspan="6" style="padding: 4px; font-size: 11px; border: 1px solid #c86400; color: #783c00; font-style: italic;">NOTE: ' + d.seizure_notes.substring(0, 120) + '</td></tr>';
      }
      return row;
    }).join('');

    // Generate custody log rows
    const custodyRows = filteredCustody.map((c, idx) => {
      const bgColor = idx % 2 === 0 ? 'background-color: #f0f4fc;' : 'background-color: white;';
      return '<tr style="' + bgColor + '">' +
        '<td style="padding: 5px 4px; font-size: 11px; border: 1px solid #b4b4c8; font-weight: bold;">' + (c.hdrive_serial || '') + '</td>' +
        '<td style="padding: 5px 4px; font-size: 11px; border: 1px solid #b4b4c8;">' + (c.transferred_from || '-') + '</td>' +
        '<td style="padding: 5px 4px; font-size: 11px; border: 1px solid #b4b4c8;">' + (c.transferred_to || '-') + '</td>' +
        '<td style="padding: 5px 4px; font-size: 11px; border: 1px solid #b4b4c8;">' + (c.previous_location || '-') + '</td>' +
        '<td style="padding: 5px 4px; font-size: 11px; border: 1px solid #b4b4c8;">' + (c.new_location || '-') + '</td>' +
        '<td style="padding: 5px 4px; font-size: 11px; border: 1px solid #b4b4c8;">' + (c.reason || '-') + '</td>' +
        '<td style="padding: 5px 4px; font-size: 11px; border: 1px solid #b4b4c8;">' + (c.transfer_date ? moment(c.transfer_date).tz('America/New_York').format('MM/DD/YYYY HH:mm') : '-') + '</td>' +
        '</tr>';
    }).join('');

    const seizedSection = seizedRows ? '<div style="background: #c86400; color: white; padding: 6px 8px; margin-top: 12px; margin-bottom: 6px; font-weight: bold; font-size: 12px;">*** SEIZED / LEGAL HOLD DRIVES ***</div>' +
      '<table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">' +
      '<thead><tr style="background: #c86400; color: white;">' +
      '<th style="padding: 6px 4px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #c86400;">SERIAL #</th>' +
      '<th style="padding: 6px 4px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #c86400;">SEIZING AGENCY</th>' +
      '<th style="padding: 6px 4px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #c86400;">SEIZING PERSON</th>' +
      '<th style="padding: 6px 4px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #c86400;">CASE #</th>' +
      '<th style="padding: 6px 4px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #c86400;">DATE/TIME</th>' +
      '<th style="padding: 6px 4px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #c86400;">REASON</th>' +
      '</tr></thead>' +
      '<tbody>' + seizedRows + '</tbody>' +
      '</table>' : '';

    const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>H-Drive Audit Report</title><style>' +
      'body { font-family: "Courier Prime", monospace; margin: 0; padding: 10px; background: white; }' +
      '.header { background: #1e3c78; color: white; padding: 12px; margin-bottom: 8px; border-radius: 2px; }' +
      '.header h1 { margin: 0; font-size: 14px; letter-spacing: 0.5px; }' +
      '.header p { margin: 4px 0 0 0; font-size: 11px; }' +
      '.section-title { background: #3a5a96; color: white; padding: 6px 8px; margin-top: 12px; margin-bottom: 6px; font-weight: bold; font-size: 12px; }' +
      '.meta { background: #f5f5f5; border: 1px solid #ddd; padding: 8px; margin-bottom: 8px; font-size: 10px; color: #666; }' +
      'table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }' +
      'th { background: #325096; color: white; padding: 6px 4px; text-align: left; font-size: 11px; font-weight: bold; border: 1px solid #b4b4c8; }' +
      'td { padding: 6px 4px; font-size: 11px; }' +
      '.footer-box { border: 1px solid #000; padding: 10px; margin: 12px 0; background: #f0f0f0; }' +
      '.footer-title { font-weight: bold; font-size: 11px; margin-bottom: 6px; }' +
      '.footer-text { font-size: 9px; line-height: 1.5; margin-bottom: 8px; }' +
      '.sig-line { display: inline-block; width: 180px; border-top: 1px solid #000; margin: 0 20px; vertical-align: bottom; }' +
      '.sig-label { font-size: 9px; margin-top: 2px; display: inline-block; }' +
      '@media print { body { margin: 0; padding: 10px; } }' +
      '</style></head><body>' +
      '<div class="header">' +
      '<h1>NEW HANOVER COUNTY SCHOOLS - TRANSPORTATION DEPT.</h1>' +
      '<p>MOBILE VEHICLE SURVEILLANCE SYSTEM - H-DRIVE CHAIN OF CUSTODY AUDIT REPORT</p>' +
      '</div>' +
      '<div class="meta">Generated: ' + moment().tz('America/New_York').format('MM/DD/YYYY HH:mm') + ' | Records: ' + drives.length + (filterParts.length ? ' | Filters: ' + filterParts.join(', ') : '') + '</div>' +
      '<div class="section-title">INVENTORY AUDIT - CHAIN OF CUSTODY VERIFICATION</div>' +
      '<table>' +
      '<thead><tr>' +
      '<th>#</th><th>SERIAL NUMBER</th><th>MAKE / MODEL</th><th>CURRENT USER</th><th>CURRENT LOCATION</th>' +
      '<th>LOG#</th><th>DATE (MM/DD/YYYY)</th><th>[CHK]</th><th>INITIALS</th>' +
      '</tr></thead>' +
      '<tbody>' + inventoryRows + '</tbody>' +
      '</table>' +
      seizedSection +
      '<div class="section-title">CHAIN OF CUSTODY TRANSFER LOG</div>' +
      '<table>' +
      '<thead><tr>' +
      '<th>SERIAL #</th><th>FROM</th><th>TO</th><th>PREV. LOCATION</th><th>NEW LOCATION</th><th>REASON</th><th>DATE/TIME</th>' +
      '</tr></thead>' +
      '<tbody>' + custodyRows + '</tbody>' +
      '</table>' +
      '<div class="footer-box">' +
      '<div class="footer-title">CHAIN OF CUSTODY ACCOUNTABILITY AND LIABILITY DISCLOSURE</div>' +
      '<div class="footer-text">By signing below, the undersigned acknowledges receipt and current custody of the H-Drive unit(s) listed above. The signing party accepts full personal responsibility for the security, safekeeping, and proper handling of all assigned drives. The signing party is fully liable for any loss, theft, or intentional damage to assigned H-Drive units. By signing, the undersigned agrees to immediately report any loss or suspected theft to their direct supervisor and the Transportation Department.</div>' +
      '<div style="margin-top: 20px;">' +
      '<div style="display: inline-block; margin-right: 20px;"><div class="sig-line"></div><div class="sig-label">RESPONSIBLE PARTY SIGNATURE</div></div>' +
      '<div style="display: inline-block; margin-right: 20px;"><div class="sig-line"></div><div class="sig-label">PRINTED NAME / TITLE</div></div>' +
      '<div style="display: inline-block;"><div class="sig-line"></div><div class="sig-label">DATE</div></div>' +
      '</div></div>' +
      '</body></html>';

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});