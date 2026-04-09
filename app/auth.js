const AUTH_CONFIG = {
  discordClientId: '1491725983131369552',
  redirectUri: window.location.origin + '/login.html',
  backendUrl: window.location.origin
};

const ROLE_HIERARCHY = {
  'command': 3,
  'staff': 2,
  'member': 1
};

class AuthManager {
  constructor() {
    this.user = null;
    this.init();
  }

  init() {
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && window.location.pathname === '/login.html') {
      this.handleCallback(code);
    } else {
      this.checkSession();
    }
  }

  async handleCallback(code) {
    try {
      const response = await fetch(`${AUTH_CONFIG.backendUrl}/auth/discord/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: AUTH_CONFIG.redirectUri })
      });

      if (!response.ok) throw new Error('Auth failed');

      const data = await response.json();
      this.setSession(data);
      
      // Clean URL and redirect
      window.history.replaceState({}, document.title, '/app.html');
      window.location.href = '/app.html';
    } catch (err) {
      console.error('Auth error:', err);
      this.showError('Authentication failed. Please try again.');
    }
  }

  setSession(data) {
    localStorage.setItem('sas_user', JSON.stringify({
      username: data.username,
      roles: data.roles,
      avatar: data.avatar,
      id: data.id,
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24h
    }));
  }

  getSession() {
    const stored = localStorage.getItem('sas_user');
    if (!stored) return null;
    
    const user = JSON.parse(stored);
    if (Date.now() > user.expires) {
      this.clearSession();
      return null;
    }
    return user;
  }

  clearSession() {
    localStorage.removeItem('sas_user');
    this.user = null;
  }

  checkSession() {
    this.user = this.getSession();
    if (!this.user && !this.isPublicPage()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }

  isPublicPage() {
    return window.location.pathname === '/login.html';
  }

  hasRole(minRole) {
    if (!this.user) return false;
    const userLevel = Math.max(...this.user.roles.map(r => ROLE_HIERARCHY[r] || 0));
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    return userLevel >= requiredLevel;
  }

  getHighestRole() {
    if (!this.user) return null;
    return this.user.roles.reduce((highest, role) => {
      return (ROLE_HIERARCHY[role] || 0) > (ROLE_HIERARCHY[highest] || 0) ? role : highest;
    }, 'member');
  }

  logout() {
    this.clearSession();
    window.location.href = '/login.html';
  }

  showError(msg) {
    const errorDiv = document.getElementById('authError');
    if (errorDiv) {
      errorDiv.textContent = msg;
      errorDiv.style.display = 'block';
    }
  }

  updateUI() {
    if (!this.user) return;

    // Update user menu
    const userMenu = document.getElementById('userMenu');
    const roleBadge = document.getElementById('roleBadge');
    
    if (userMenu) {
      userMenu.style.display = 'flex';
      const avatar = userMenu.querySelector('.user-avatar');
      const username = userMenu.querySelector('.username');
      
      if (avatar) avatar.textContent = this.user.username.slice(0, 2).toUpperCase();
      if (username) username.textContent = this.user.username;
    }

    if (roleBadge) {
      const highest = this.getHighestRole();
      roleBadge.className = `role-badge ${highest}`;
      roleBadge.textContent = highest;
    }

    // Lock/unlock nav items based on roles
    this.updateNavAccess();
  }

  updateNavAccess() {
    // Operations: staff+
    const opsLinks = document.querySelectorAll('[data-require="staff"]');
    opsLinks.forEach(link => {
      if (!this.hasRole('staff')) {
        link.classList.add('nav-locked');
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          alert('Staff access required');
        };
      }
    });

    // Promotions: command
    const promoLinks = document.querySelectorAll('[data-require="command"]');
    promoLinks.forEach(link => {
      if (!this.hasRole('command')) {
        link.classList.add('nav-locked');
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          alert('Command access required');
        };
      }
    });
  }

  protectAdminPage() {
    if (!this.hasRole('command')) {
      document.body.innerHTML = `
        <header class="header">
          <div class="header-container">
            <a href="/app.html" class="logo">SAS SOG</a>
            <div class="user-menu" id="userMenu">
              <button class="btn logout-btn" onclick="auth.logout()">Logout</button>
            </div>
          </div>
        </header>
        <main class="section">
          <div class="access-denied">
            <div class="access-denied-icon">⛔</div>
            <h1 class="section-title">Access Denied</h1>
            <p class="lead">This area is restricted to Command personnel only.</p>
            <a href="/app.html" class="btn btn-primary mt-2">Return to Dashboard</a>
          </div>
        </main>
      `;
      return false;
    }
    return true;
  }
}

// Initialize
const auth = new AuthManager();

// Protect pages on load
document.addEventListener('DOMContentLoaded', () => {
  if (!auth.isPublicPage()) {
    if (!auth.checkSession()) return;
    auth.updateUI();
  }
});