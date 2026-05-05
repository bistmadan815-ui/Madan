import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allClients = await base44.asServiceRole.entities.ClientProfile.list('-created_date', 500);
    const unconfigured = allClients.filter(c => !c.password_hash);
    
    return Response.json({ unconfigured });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});