export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirectUri } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
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

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // 2. Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();

    // 3. Get server roles (requires guilds.members.read scope)
    const guildId = process.env.DISCORD_GUILD_ID; // Your SAS server ID
    let roles = ['member']; // default fallback

    if (guildId) {
      const memberResponse = await fetch(
        `https://discord.com/api/users/@me/guilds/${guildId}/member`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );

      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        
        // Map Discord role IDs to your role names
        const roleMap = {
          [process.env.ROLE_COMMAND_ID]: 'command',
          [process.env.ROLE_STAFF_ID]: 'staff',
          // Add more role mappings as needed
        };

        roles = memberData.roles
          .map(roleId => roleMap[roleId])
          .filter(Boolean); // Remove undefined
        
        if (roles.length === 0) roles = ['member'];
      }
    }

    // 4. Return data that auth.js expects
    return res.status(200).json({
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : null,
      roles: roles
    });

  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}