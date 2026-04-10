import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { data } = await supabase
      .from('config')
      .select('value')
      .eq('key', 'unit_status')
      .single();
    
    return res.json(data?.value || { 
      status: 'Operational', 
      message: 'All systems normal',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}