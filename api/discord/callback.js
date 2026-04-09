export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, redirectUri } = req.body || {};
    
    if (!code) throw new Error('Missing code');
    if (!process.env.DISCORD_CLIENT_ID) throw new Error('Missing DISCORD_CLIENT_ID');
    if (!process.env.DISCORD_CLIENT_SECRET) throw new Error('Missing DISCORD_CLIENT_SECRET');

    // 1. Exchange code for token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token failed');

    // 2. Get user
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();
    if (!userRes.ok) throw new Error('Failed to get user');

    // 3. Get roles from your server
    let roles = ['member'];
    const guildId = process.env.DISCORD_GUILD_ID;
    
    if (guildId) {
      const memberRes = await fetch(
        `https://discord.com/api/users/@me/guilds/${guildId}/member`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );

      if (memberRes.ok) {
        const memberData = await memberRes.json();
        
        // Hierarchy: Command (3) > Staff (2) > Member (1)
        if (process.env.ROLE_COMMAND_ID && memberData.roles.includes(process.env.ROLE_COMMAND_ID)) {
          roles = ['command'];
        } else if (process.env.ROLE_STAFF_ID && memberData.roles.includes(process.env.ROLE_STAFF_ID)) {
          roles = ['staff'];
        }
      }
    }

    // 4. Return to auth.js
    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : null,
      roles: roles
    });

  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}