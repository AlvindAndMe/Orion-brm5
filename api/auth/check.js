import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const { data } = await supabase
      .from('personnel')
      .select('is_admin, rank, squadron_id, squadrons(callsign)')
      .eq('discord_id', userId)
      .single();

    if (!data) {
      return res.json({ approved: false });
    }

    return res.json({
      approved: true,
      isAdmin: data.is_admin,
      rank: data.rank,
      squadron: data.squadrons?.callsign || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}