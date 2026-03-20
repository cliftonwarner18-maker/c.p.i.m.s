import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import moment from 'npm:moment-timezone@0.5.45';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { statusFilter, assetTypeFilter } = body;

    const assets = await base44.entities.SerializedAsset.list();
    
    let filtered = assets;
    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }
    if (assetTypeFilter && assetTypeFilter !== 'All') {
      filtered = filtered.filter(a => a.asset_type === assetTypeFilter);
    }

    const assetRows = filtered.map((asset, idx) => `
      <tr style="${idx % 2 === 0 ? 'background-color: #f0f4fc;' : 'background-color: white;'}">
        <td style="padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #ddd;">${asset.asset_number || '-'}</td>
        <td style="padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #ddd;">${asset.brand || '-'}</td>
        <td style="padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #ddd;">${asset.model || '-'}</td>
        <td style="padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #ddd;">${asset.serial_number || '-'}</td>
        <td style="padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #ddd;">${asset.asset_type || '-'}</td>
        <td style="padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #ddd;">${asset.status || '-'}</td>
        <td style="padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #ddd;">${asset.assigned_bus_number || '-'}</td>
        <td style="padding: 6px 8px; font-size: 11px; border-bottom: 1px solid #ddd;">${(asset.current_location || '-').substring(0, 25)}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Serialized Assets Inventory Report</title>
        <style>
          body { font-family: 'Courier Prime', monospace; margin: 0; padding: 16px; background: white; }
          .header { text-align: center; margin-bottom: 16px; }
          .header h1 { margin: 0 0 8px 0; font-size: 16px; color: #1e3c78; }
          .header p { margin: 4px 0; font-size: 11px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          thead tr { background: #1e3c78; color: white; }
          th { padding: 8px; text-align: left; font-size: 11px; font-weight: bold; }
          td { padding: 6px 8px; font-size: 11px; }
          .footer { margin-top: 16px; font-size: 10px; color: #666; }
          @media print { body { margin: 0; padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>SERIALIZED ASSETS INVENTORY REPORT</h1>
          <p>Report Generated: ${moment().tz('America/New_York').format('MM/DD/YYYY HH:mm')}</p>
          ${statusFilter && statusFilter !== 'All' ? `<p>Status Filter: ${statusFilter}</p>` : ''}
          ${assetTypeFilter && assetTypeFilter !== 'All' ? `<p>Asset Type Filter: ${assetTypeFilter}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Asset #</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Serial #</th>
              <th>Type</th>
              <th>Status</th>
              <th>Bus #</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            ${assetRows}
          </tbody>
        </table>

        <div class="footer">
          <strong>Total Assets: ${filtered.length}</strong>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});