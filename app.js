// ===================================================
// GABON STORIES - JAVASCRIPT PRINCIPAL
// ===================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbyhtcIwite2fwwKjR54E99Ur88kCIosUKSI0oofC7fmoa-c-r8-pep7bIJ_mDJ01KaEBg/exec';

// ===== GESTION DE L'ÉTAT =====
const AppState = {
  user: null,
  token: null,

  init() {
    this.token = localStorage.getItem('gs_token');
    const userStr = localStorage.getItem('gs_user');
    if (userStr) {
      try { 
        this.user = JSON.parse(userStr); 
      } catch(e) {
        console.error('Erreur parsing user:', e);
        this.user = null;
        this.token = null;
      }
    }
    console.log('AppState initialisé:', this.user ? `Connecté (${this.user.role})` : 'Non connecté');
  },

  login(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('gs_token', token);
    localStorage.setItem('gs_user', JSON.stringify(user));
    console.log('Utilisateur connecté:', user.username);
  },

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_user');
  },

  isLoggedIn() { return !!this.token && !!this.user; },
  isAdmin() { return this.user?.role === 'admin'; },
  isAuthor() { return this.user?.role === 'auteur' || this.user?.role === 'admin'; }
};

// ===== API =====
const API = {
  async get(action, params = {}) {
    try {
      const url = new URL(API_URL);
      url.searchParams.set('action', action);
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          url.searchParams.set(k, v.toString());
        }
      });
      
      console.log('GET:', action, url.toString());
      const res = await fetch(url.toString());
      const data = await res.json();
      console.log('GET Response:', data);
      return data;
    } catch(e) {
      console.error('Erreur GET:', e);
      return { success: false, message: 'Erreur réseau: ' + e.message };
    }
  },

  async post(data) {
    try {
      console.log('POST:', data.action, data);
      
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await res.json();
      console.log('POST Response:', result);
      return result;
    } catch(e) {
      console.error('Erreur POST:', e);
      return { success: false, message: 'Erreur réseau: ' + e.message };
    }
  }
};

// ===== UTILITAIRES UI =====
function showAlert(message, type = 'success', containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container #${containerId} non trouvé, message:`, message);
    return;
  }
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  container.innerHTML = '';
  container.appendChild(alertDiv);
  
  setTimeout(() => { 
    if (container.contains(alertDiv)) {
      container.removeChild(alertDiv);
    }
  }, 5000);
}

function setLoading(btnId, loading, text = 'Chargement...') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="loader"></span> ${text}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch(e) {
    return dateStr;
  }
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== NAVBAR DYNAMIQUE =====
function renderNavbar() {
  const actionsEl = document.getElementById('navActions');
  if (!actionsEl) return;

  AppState.init();
  
  if (AppState.isLoggedIn()) {
    const dashboardLink = AppState.isAdmin() ? 'admin.html' : 'auteur.html';
    actionsEl.innerHTML = `
      <a href="${dashboardLink}" class="btn btn-secondary btn-sm">Tableau de bord</a>
      <div class="avatar" onclick="handleLogout()" title="Se déconnecter" style="cursor:pointer;">
        ${getInitials(AppState.user.username)}
      </div>
    `;
  } else {
    actionsEl.innerHTML = `
      <a href="connexion.html" class="btn btn-secondary btn-sm">Se connecter</a>
      <a href="inscription.html" class="btn btn-primary btn-sm">S'inscrire</a>
    `;
  }
}

async function handleLogout() {
  try {
    if (AppState.token) {
      await API.post({ action: 'logout', sessionToken: AppState.token });
    }
  } catch(e) {
    console.error('Erreur logout:', e);
  }
  
  AppState.logout();
  window.location.href = 'index.html';
}

// ===== MODAL =====
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ===== TABS =====
function initTabs(containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  
  const tabs = container.querySelectorAll('.tab');
  const contents = container.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.style.display = 'none');
      
      tab.classList.add('active');
      const content = document.getElementById(target);
      if (content) content.style.display = 'block';
    });
  });
  
  // Activer le premier tab
  if (tabs.length > 0) {
    tabs[0].click();
  }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialisée');
  AppState.init();
  renderNavbar();
});
