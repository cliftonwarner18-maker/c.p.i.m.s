import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { drives } = body;

    if (!Array.isArray(drives) || drives.length === 0) {
      return Response.json({ error: 'No drives provided' }, { status: 400 });
    }

    const results = await base44.entities.HDrive.bulkCreate(drives);
    
    return Response.json({
      success: true,
      imported: results.length,
      drives: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});