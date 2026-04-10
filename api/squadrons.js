import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { data } = await supabase
      .from('squadrons')
      .select('*, personnel:leader_id(discord_username)');
    
    const formatted = (data || []).map(sq => ({
      ...sq,
      leader_name: sq.personnel?.discord_username
    }));
    
    return res.json(formatted);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}