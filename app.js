// ===================================================
// GABON STORIES - JAVASCRIPT PRINCIPAL
// Version anti-CORS - Utilise GET avec paramètre _data
// ===================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbyhtcIwite2fwwKjR54E99Ur88kCIosUKSI0oofC7fmoa-c-r8-pep7bIJ_mDJ01KaEBg/exec';

console.log('🚀 Gabon Stories');
console.log('📡 API URL:', API_URL);

// ===== DIAGNOSTIC =====
(async function diagnostic() {
  console.log('🔍 DIAGNOSTIC...');
  
  // Test GET simple
  try {
    const r = await fetch(API_URL + '?action=getStats');
    const d = await r.json();
    console.log('✅ getStats:', d);
  } catch(e) {
    console.error('❌ getStats:', e.message);
  }
  
  // Test login (via GET)
  try {
    const loginData = JSON.stringify({
      email: 'mayialex370@gmail.com',
      password: 'magnifique241'
    });
    const url = API_URL + '?action=login&_data=' + encodeURIComponent(loginData);
    console.log('URL login:', url);
    
    const r = await fetch(url);
    const d = await r.json();
    console.log('✅ Login:', d);
  } catch(e) {
    console.error('❌ Login:', e.message);
  }
})();

// ===== GESTION DE L'ÉTAT =====
const AppState = {
  user: null,
  token: null,

  init() {
    this.token = localStorage.getItem('gs_token');
    const userStr = localStorage.getItem('gs_user');
    if (userStr) {
      try { this.user = JSON.parse(userStr); } catch(e) {
        this.logout();
      }
    }
  },

  login(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('gs_token', token);
    localStorage.setItem('gs_user', JSON.stringify(user));
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

// ===== API - TOUT EN GET POUR CONTOURNER CORS =====
const API = {
  async get(action, params = {}) {
    try {
      const url = new URL(API_URL);
      url.searchParams.set('action', action);
      Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined) url.searchParams.set(k, v.toString());
      });
      
      console.log('GET:', action);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('Response:', data);
      return data;
    } catch(e) {
      console.error('API GET error:', e);
      return { success: false, message: 'Erreur connexion' };
    }
  },

  async post(data) {
    try {
      // Encoder les données dans l'URL pour éviter CORS
      const url = new URL(API_URL);
      url.searchParams.set('action', data.action);
      url.searchParams.set('_data', encodeURIComponent(JSON.stringify(data)));
      
      console.log('POST via GET:', data.action, url.toString().substring(0, 200) + '...');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      console.log('Response:', result);
      return result;
    } catch(e) {
      console.error('API POST error:', e);
      return { success: false, message: 'Erreur connexion' };
    }
  }
};

// ===== UTILITAIRES UI =====
function showAlert(message, type = 'success', containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) {
    alert(message);
    return;
  }
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { container.innerHTML = ''; }, 5000);
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
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
  } catch(e) { return dateStr; }
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== NAVBAR =====
function renderNavbar() {
  const actionsEl = document.getElementById('navActions');
  if (!actionsEl) return;

  AppState.init();
  if (AppState.isLoggedIn()) {
    const dashLink = AppState.isAdmin() ? 'admin.html' : 'auteur.html';
    actionsEl.innerHTML = `
      <a href="${dashLink}" class="btn btn-secondary btn-sm">Tableau de bord</a>
      <div class="avatar" onclick="handleLogout()" title="Déconnexion" style="cursor:pointer;">
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
  } catch(e) {}
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

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', renderNavbar);
