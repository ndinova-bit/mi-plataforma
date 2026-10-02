const UI = {
  // Muestra la pantalla de inicio (Landing)
  showLanding() {
    const landing = document.getElementById('landing-screen') || document.getElementById('public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    if (landing) landing.style.display = 'block';
    if (login) login.style.display = 'none';
    if (app) app.style.display = 'none';
  },

  // Muestra la pantalla de Login centrada
  showLoginScreen() {
    const landing = document.getElementById('landing-screen') || document.getElementById('public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    if (landing) landing.style.display = 'none';
    if (login) login.style.display = 'flex';
    if (app) app.style.display = 'none';
  },

  // Muestra el Panel de Control / Dashboard según rol
  mostrarDashboard(perfil) {
    const landing = document.getElementById('landing-screen') || document.getElementById('public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    if (landing) landing.style.display = 'none';
    if (login) login.style.display = 'none';
    if (app) app.style.display = 'block';

    const displayUsername = document.getElementById('display-username');
    const displayRole = document.getElementById('display-role');

    if (displayUsername) displayUsername.innerText = perfil.nombre || perfil.usuario;
    if (displayRole) displayRole.innerText = (perfil.rol || '').toUpperCase();

    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = (perfil.rol === 'admin') ? 'block' : 'none';
    });

    document.querySelectorAll('.docente-only').forEach(el => {
      el.style.display = (perfil.rol === 'docente') ? 'block' : 'none';
    });

    document.querySelectorAll('.docente-or-admin').forEach(el => {
      el.style.display = (perfil.rol === 'docente' || perfil.rol === 'admin') ? 'block' : 'none';
    });

    this.showTab('trayectos');
  },

  // Alterna entre la pestaña Ingresar y Solicitar Cuenta
  toggleAuthTab(tab) {
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-register');

    if (tab === 'login') {
      if (btnLogin) btnLogin.classList.add('active');
      if (btnReg) btnReg.classList.remove('active');
      if (formLogin) formLogin.style.display = 'block';
      if (formReg) formReg.style.display = 'none';
    } else {
      if (btnReg) btnReg.classList.add('active');
      if (btnLogin) btnLogin.classList.remove('active');
      if (formReg) formReg.style.display = 'block';
      if (formLogin) formLogin.style.display = 'none';
    }
  },

  // Manejo de solapas dentro del Dashboard
  showTab(tabId) {
    document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

    const btn = document.getElementById(`btn-${tabId}`);
    const sec = document.getElementById(tabId);

    if (btn) btn.classList.add('active');
    if (sec) sec.classList.add('active');
  },

  // Utilidades de formularios
  toggleWidget(headerEl) {
    const body = headerEl.nextElementSibling;
    if (body) {
      const isVisible = body.style.display === 'block';
      body.style.display = isVisible ? 'none' : 'block';
    }
  },

  agregarFilaModulo() {
    const contenedor = document.getElementById('contenedor-modulos');
    if (!contenedor) return;

    const div = document.createElement('div');
    div.className = 'modulo-card';
    div.innerHTML = `
      <div class="modulo-row-header">
        <input type="text" class="mod-nombre" placeholder="Nombre del Módulo" style="width: 65%;">
        <input type="text" class="mod-codigo" placeholder="Código (Ej: GH 0050)" style="width: 25%;">
        <button class="btn btn-danger btn-xs" onclick="UI.eliminarFilaModulo(this)">X</button>
      </div>
      <div class="modulo-row-dates">
        <label>Inicio:</label>
        <input type="date" class="mod-inicio">
        <label>Fin:</label>
        <input type="date" class="mod-fin">
      </div>
    `;
    contenedor.appendChild(div);
  },

  eliminarFilaModulo(btn) {
    const card = btn.closest('.modulo-card');
    if (document.querySelectorAll('.modulo-card').length > 1) {
      if (card) card.remove();
    } else {
      if (typeof notify === 'function') notify('info', 'Debe haber al menos un módulo por trayecto.');
    }
  },

  toggleInscripcionesBox() {
    const rolEl = document.getElementById('user-rol');
    const box = document.getElementById('box-inscripciones');
    const lbl = document.getElementById('lbl-inscripciones');

    if (!rolEl || !box) return;

    const rol = rolEl.value;
    if (rol === 'admin') {
      box.style.display = 'none';
    } else {
      box.style.display = 'block';
      if (lbl) lbl.innerText = rol === 'estudiante' ? 'Asignar a Trayectos:' : 'Asignar como Docente en:';
    }
  }
};
