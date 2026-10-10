/* ==========================================================================
   INTERFAZ DE USUARIO Y NAVEGACIÓN (UI)
   Archivo: js/ui.js
   ========================================================================== */

const UI = {
  // Muestra la vista pública inicial
  showLanding() {
    const landing = document.getElementById('landing-screen') || document.querySelector('.public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    if (landing) landing.style.setProperty('display', 'block', 'important');
    if (login) login.style.setProperty('display', 'none', 'important');
    if (app) app.style.setProperty('display', 'none', 'important');
  },

  // Muestra la pantalla o modal de Login centrado
  showLoginScreen() {
    const landing = document.getElementById('landing-screen') || document.querySelector('.public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    if (landing) landing.style.setProperty('display', 'none', 'important');
    if (app) app.style.setProperty('display', 'none', 'important');
    
    if (login) {
      login.removeAttribute('aria-hidden');
      login.style.setProperty('display', 'flex', 'important');
      login.style.setProperty('justify-content', 'center', 'important');
      login.style.setProperty('align-items', 'center', 'important');
      login.style.setProperty('min-height', '100vh', 'important');
      this.toggleAuthTab('login');
    }
  },

  // Cambia entre las pestañas de Login y Registro
  toggleAuthTab(tab) {
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');

    if (tab === 'login') {
      if (formLogin) formLogin.style.display = 'block';
      if (formRegister) formRegister.style.display = 'none';
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
    } else {
      if (formLogin) formLogin.style.display = 'none';
      if (formRegister) formRegister.style.display = 'block';
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabRegister) tabRegister.classList.add('active');
    }
  },

  // Muestra la plataforma adaptada estrictamente al rol del usuario
  mostrarDashboard(perfil) {
    if (!perfil) {
      perfil = (typeof Auth !== 'undefined' && Auth.usuarioActual) ? Auth.usuarioActual : JSON.parse(localStorage.getItem('usuario_actual'));
    }

    if (!perfil) return;

    if (perfil.usuario) perfil.usuario = String(perfil.usuario).split(':')[0].trim();
    if (perfil.dni) perfil.dni = String(perfil.dni).split(':')[0].trim();
    localStorage.setItem('usuario_actual', JSON.stringify(perfil));

    const landing = document.getElementById('landing-screen') || document.querySelector('.public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    if (landing) landing.style.setProperty('display', 'none', 'important');
    if (login) login.style.setProperty('display', 'none', 'important');
    if (app) app.style.setProperty('display', 'flex', 'important'); 

    const displayUsername = document.getElementById('display-username');
    const displayRole = document.getElementById('display-role');

    if (displayUsername) {
      let nombreMostrar = perfil.nombre || perfil.usuario || 'USUARIO';
      if (perfil.apellido && perfil.nombre) {
        nombreMostrar = `${perfil.apellido}, ${perfil.nombre}`;
      } else if (perfil.apellido) {
        nombreMostrar = perfil.apellido;
      }
      displayUsername.innerText = nombreMostrar;
    }

    if (displayRole) displayRole.innerText = (perfil.rol || '').toUpperCase();

    const rolNorm = (perfil.rol || '').toLowerCase().trim();
    const isAdmin = rolNorm === 'admin' || rolNorm === 'administrador';

    if (app) app.setAttribute('data-rol', rolNorm);

    // Filtrar visibilidad de botones en la barra lateral
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnNuevoTrayecto = document.getElementById('btn-nuevo-trayecto');
    const btnCertificados = document.getElementById('btn-certificados');
    const btnUsuarios = document.getElementById('btn-usuarios');

    if (btnDashboard) btnDashboard.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    if (btnNuevoTrayecto) btnNuevoTrayecto.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    if (btnCertificados) btnCertificados.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    if (btnUsuarios) btnUsuarios.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');

    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.setProperty('display', isAdmin ? (el.tagName === 'BUTTON' ? 'inline-flex' : 'block') : 'none', 'important');
    });

    if (!isAdmin) {
      this.showTab('trayectos');
    } else {
      this.showTab('dashboard');
    }
  },

  // Cambia entre secciones dentro del Panel
  async showTab(tabId) {
    const perfilRaw = localStorage.getItem('usuario_actual');
    const perfil = perfilRaw ? JSON.parse(perfilRaw) : {};
    const isAdmin = (perfil.rol || '').toLowerCase().trim() === 'admin';

    if (!isAdmin && (tabId === 'dashboard' || tabId === 'nuevo-trayecto' || tabId === 'certificados' || tabId === 'usuarios')) {
      tabId = 'trayectos';
    }

    document.querySelectorAll('.section-tab').forEach(sec => {
      sec.style.setProperty('display', 'none', 'important');
      sec.classList.remove('active');
    });

    document.querySelectorAll('.sidebar-nav .nav-item-btn, .sidebar-nav button').forEach(btn => {
      btn.classList.remove('active');
    });

    const targetSection = document.getElementById(tabId === 'dashboard' ? 'sec-dashboard' : tabId);
    if (targetSection) {
      targetSection.style.setProperty('display', 'block', 'important');
      targetSection.classList.add('active');
    }

    const activeBtn = document.getElementById(`btn-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');

    const titleEl = document.getElementById('current-section-title');
    if (titleEl) {
      const titles = {
        'dashboard': 'Dashboard',
        'trayectos': isAdmin ? 'Trayectos Formativos' : 'Mis Trayectos Formativos',
        'nuevo-trayecto': 'Cargar Trayecto',
        'certificados': 'Emitir Certificados',
        'usuarios': 'Usuarios y Roles'
      };
      titleEl.innerText = titles[tabId] || 'Panel de Control';
    }

    if (tabId === 'usuarios' && window.UsuariosAdmin) {
      window.UsuariosAdmin.cargarUsuarios();
    }

    if (tabId === 'trayectos') {
      await this.cargarTrayectosDelUsuario();
    }
  },

  // Carga los trayectos vinculados al usuario según su rol delegando en Trayectos
  async cargarTrayectosDelUsuario() {
    if (window.Trayectos && typeof window.Trayectos.cargarTrayectos === 'function') {
      await window.Trayectos.cargarTrayectos();
    }
  },

  // Cierra el modal de alta de usuario
  cerrarModalNuevoUsuario() {
    const modal = document.getElementById('modal-alta-usuario');
    if (modal) {
      modal.classList.remove('open', 'active');
      modal.style.display = 'none';
      document.getElementById('form-alta-usuario')?.reset();
    }
  },

  // Agrega una fila de módulo en el formulario
  agregarFilaModulo() {
    const contenedor = document.getElementById('contenedor-modulos');
    if (!contenedor) return;

    const div = document.createElement('div');
    div.className = 'modulo-item-card';
    div.innerHTML = `
      <div class="form-grid-2">
        <input type="text" class="mod-nombre form-control" placeholder="Nombre del Módulo" required>
        <input type="text" class="mod-codigo form-control" placeholder="Código (Ej: GH 0050)">
      </div>
      <div class="form-grid-2" style="margin-top: 0.75rem;">
        <div>
          <label style="font-size: 0.75rem;">Fecha Inicio</label>
          <input type="date" class="mod-inicio form-control">
        </div>
        <div>
          <label style="font-size: 0.75rem;">Fecha Fin</label>
          <input type="date" class="mod-fin form-control">
        </div>
      </div>
    `;
    contenedor.appendChild(div);
  }
};

window.UI = UI;
