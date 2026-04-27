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
      try { this.user = JSON.parse(userStr); } catch(e) { this.logout(); }
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

// ===== API (TOUT EN GET) =====
const API = {
  async get(action, params = {}) {
    try {
      const url = new URL(API_URL);
      url.searchParams.set('action', action);
      for (const [k, v] of Object.entries(params)) {
        if (v !== null && v !== undefined) url.searchParams.set(k, String(v));
      }
      const res = await fetch(url.toString());
      return await res.json();
    } catch(e) {
      return { success: false, message: 'Erreur réseau' };
    }
  },

  async post(data) {
    try {
      const url = new URL(API_URL);
      // Ajouter tous les champs comme paramètres GET
      for (const [k, v] of Object.entries(data)) {
        if (v !== null && v !== undefined && v !== '') {
          url.searchParams.set(k, String(v));
        }
      }
      const res = await fetch(url.toString());
      return await res.json();
    } catch(e) {
      return { success: false, message: 'Erreur réseau' };
    }
  }
};

// ===== UTILITAIRES UI =====
function showAlert(message, type, containerId) {
  type = type || 'success';
  containerId = containerId || 'alertContainer';
  const container = document.getElementById(containerId);
  if (!container) { alert(message); return; }
  container.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
  setTimeout(function() { container.innerHTML = ''; }, 5000);
}

function setLoading(btnId, loading, text) {
  text = text || 'Chargement...';
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.setAttribute('data-original', btn.innerHTML);
    btn.innerHTML = '<span class="loader"></span> ' + text;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.getAttribute('data-original') || btn.innerHTML;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch(e) { return dateStr; }
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(function(n) { return n[0]; }).join('').toUpperCase().substring(0, 2);
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
    actionsEl.innerHTML = '<a href="' + dashLink + '" class="btn btn-secondary btn-sm">Tableau de bord</a>' +
      '<div class="avatar" onclick="handleLogout()" title="Déconnexion" style="cursor:pointer;">' + getInitials(AppState.user.username) + '</div>';
  } else {
    actionsEl.innerHTML = '<a href="connexion.html" class="btn btn-secondary btn-sm">Se connecter</a>' +
      '<a href="inscription.html" class="btn btn-primary btn-sm">S\'inscrire</a>';
  }
}

async function handleLogout() {
  try {
    if (AppState.token) await API.post({ action: 'logout', sessionToken: AppState.token });
  } catch(e) {}
  AppState.logout();
  window.location.href = 'index.html';
}

// ===== MODAL =====
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) { overlay.classList.remove('active'); document.body.style.overflow = ''; }
}

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ===== TABS =====
function initTabs(containerSelector) {
  document.querySelectorAll(containerSelector + ' .tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      const target = this.dataset.tab;
      document.querySelectorAll(containerSelector + ' .tab').forEach(function(t) { t.classList.remove('active'); });
      document.querySelectorAll(containerSelector + ' .tab-content').forEach(function(c) { c.style.display = 'none'; });
      this.classList.add('active');
      const content = document.getElementById(target);
      if (content) content.style.display = 'block';
    });
  });
  const firstTab = document.querySelector(containerSelector + ' .tab');
  if (firstTab) firstTab.click();
}

document.addEventListener('DOMContentLoaded', renderNavbar);
