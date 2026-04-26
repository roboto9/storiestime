// ===================================================
// GABON STORIES - JAVASCRIPT PRINCIPAL
// ===================================================

// Remplacer par l'URL de votre Apps Script déployé
const API_URL = 'https://script.google.com/macros/s/AKfycbyhtcIwite2fwwKjR54E99Ur88kCIosUKSI0oofC7fmoa-c-r8-pep7bIJ_mDJ01KaEBg/exec';

// ===== GESTION DE L'ÉTAT =====
const AppState = {
  user: null,
  token: null,

  init() {
    this.token = localStorage.getItem('gs_token');
    const userStr = localStorage.getItem('gs_user');
    if (userStr) {
      try { this.user = JSON.parse(userStr); } catch(e) {}
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

// ===== API =====
const API = {
  async get(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    return res.json();
  },

  async post(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }
};

// ===== UTILITAIRES UI =====
function showAlert(message, type = 'success', containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  setTimeout(() => { container.innerHTML = ''; }, 5000);
}

function setLoading(btnId, loading, text = 'Charger...') {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="loader"></span> ${text}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2);
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
    const role = AppState.user.role;
    const dashLink = role === 'admin' ? 'admin.html' : 'auteur.html';
    actionsEl.innerHTML = `
      <a href="${dashLink}" class="btn btn-secondary btn-sm">Tableau de bord</a>
      <div class="avatar" onclick="handleLogout()" title="Se déconnecter">
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
  if (AppState.token) {
    await API.post({ action: 'logout', sessionToken: AppState.token });
  }
  AppState.logout();
  window.location.href = 'index.html';
}

// ===== MODAL =====
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ===== TABS =====
function initTabs(containerSelector) {
  document.querySelectorAll(`${containerSelector} .tab`).forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll(`${containerSelector} .tab`).forEach(t => t.classList.remove('active'));
      document.querySelectorAll(`${containerSelector} .tab-content`).forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      const content = document.getElementById(target);
      if (content) content.style.display = 'block';
    });
  });
  // Activer le premier tab
  const firstTab = document.querySelector(`${containerSelector} .tab`);
  if (firstTab) firstTab.click();
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', renderNavbar);
