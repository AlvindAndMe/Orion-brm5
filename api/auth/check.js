import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { userId } = req.query;
  
  // DEBUG: Log what we received
  console.log('Checking userId:', userId);
  console.log('Env vars present:', !!process.env.SUPABASE_URL, !!process.env.SUPABASE_SERVICE_KEY);
  
  if (!userId) {
    return res.status(400).json({ error: 'Missing userId', received: req.query });
  }

  try {
    // DEBUG: Try simple select first
    const { data, error } = await supabase
      .from('personnel')
      .select('*')  // Select all columns for debugging
      .eq('discord_id', userId)
      .single();
    
    // DEBUG: Log the result
    console.log('Supabase result:', { data, error });
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message, userId });
    }
    
    if (!data) {
      // DEBUG: Try to find any user with similar ID
      const { data: allUsers } = await supabase
        .from('personnel')
        .select('discord_id')
        .limit(5);
      
      return res.json({ 
        approved: false, 
        searchedFor: userId,
        sampleIdsInDb: allUsers?.map(u => u.discord_id) || []
      });
    }

    return res.json({
      approved: true,
      isAdmin: data.is_admin,
      rank: data.rank,
      discord_id: data.discord_id
    });
    
  } catch (err) {
    console.error('Catch error:', err);
    return res.status(500).json({ error: err.message });
  }
}