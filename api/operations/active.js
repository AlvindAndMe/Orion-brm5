import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { data } = await supabase
      .from('operations')
      .select('*, squadrons(callsign)')
      .order('created_at', { ascending: false });
    
    // Format for frontend
    const formatted = (data || []).map(op => ({
      ...op,
      squadron_callsign: op.squadrons?.callsign
    }));
    
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}