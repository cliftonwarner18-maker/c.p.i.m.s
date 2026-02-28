import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const assets = await base44.asServiceRole.entities.SerializedAsset.list();
    
    let updated = 0;
    for (const asset of assets) {
      if (!asset.asset_type || asset.asset_type !== 'DVR') {
        await base44.asServiceRole.entities.SerializedAsset.update(asset.id, { asset_type: 'DVR' });
        updated++;
      }
    }

    return Response.json({ message: `Updated ${updated} assets to DVR type` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});