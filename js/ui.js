/* ==========================================================================
   INTERFAZ DE USUARIO Y NAVEGACIÓN (UI)
   Archivo: js/ui.js
   ========================================================================== */

const UI = {
  // Muestra la vista pública
  showLanding() {
    const landing = document.getElementById('landing-screen') || document.querySelector('.public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    if (landing) landing.style.setProperty('display', 'block', 'important');
    if (login) login.style.setProperty('display', 'none', 'important');
    if (app) app.style.setProperty('display', 'none', 'important');
  },

  // Muestra el Panel Administrativo y OCULTA la vista pública
  mostrarDashboard(perfil) {
    const landing = document.getElementById('landing-screen') || document.querySelector('.public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    // Ocultar Landing y Login por completo
    if (landing) landing.style.setProperty('display', 'none', 'important');
    if (login) login.style.setProperty('display', 'none', 'important');

    // Mostrar el Dashboard
    if (app) app.style.setProperty('display', 'flex', 'important'); 

    const displayUsername = document.getElementById('display-username');
    const displayRole = document.getElementById('display-role');

    if (displayUsername) displayUsername.innerText = perfil.nombre || perfil.usuario;
    if (displayRole) displayRole.innerText = (perfil.rol || '').toUpperCase();

    // Permisos de roles
    const isAdmin = perfil.rol === 'admin';
    const isDocente = perfil.rol === 'docente';

    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = isAdmin ? (el.tagName === 'BUTTON' ? 'flex' : 'block') : 'none';
    });

    document.querySelectorAll('.docente-only').forEach(el => {
      el.style.display = isDocente ? (el.tagName === 'BUTTON' ? 'flex' : 'block') : 'none';
    });

    document.querySelectorAll('.docente-or-admin').forEach(el => {
      el.style.display = (isDocente || isAdmin) ? (el.tagName === 'BUTTON' ? 'flex' : 'block') : 'none';
    });

    this.actualizarContadoresDashboard();
    this.showTab('dashboard');
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
    // Quitar 'active' de todos los botones de la barra lateral
    document.querySelectorAll('.sidebar .nav-item-btn, .sidebar button').forEach(btn => {
      btn.classList.remove('active');
    });

    // Ocultar todas las secciones
    document.querySelectorAll('.section-tab, .section').forEach(sec => {
      sec.style.display = 'none';
      sec.classList.remove('active');
    });

    // Determinar ID real de la sección
    const sectionId = tabId === 'dashboard' ? 'sec-dashboard' : tabId;
    const btn = document.getElementById(`btn-${tabId}`);
    const sec = document.getElementById(sectionId);

    if (btn) btn.classList.add('active');
    if (sec) {
      sec.style.display = 'block';
      sec.classList.add('active');
    }

    // Actualizar título en el Header Superior
    const titleMap = {
      'dashboard': 'Dashboard General',
      'trayectos': 'Trayectos Formativos',
      'nuevo-trayecto': 'Cargar Nuevo Trayecto',
      'certificados': 'Emisión de Certificados'
    };
    const headerTitle = document.getElementById('current-section-title');
    if (headerTitle) {
      headerTitle.textContent = titleMap[tabId] || 'Panel Administrativo';
    }

    // Recargar datos desde Supabase al abrir la pestaña "Trayectos Formativos"
    if (tabId === 'trayectos' && typeof Trayectos !== 'undefined' && Trayectos.cargarTrayectos) {
      Trayectos.cargarTrayectos();
    }
  },

  // Actualiza contadores numéricos del Dashboard con datos reales de Supabase
  actualizarContadoresDashboard() {
    const elTrayectos = document.getElementById('stat-count-trayectos');
    const elModulos = document.getElementById('stat-count-modulos');

    if (typeof Trayectos !== 'undefined' && Array.isArray(Trayectos.listaTrayectos)) {
      if (elTrayectos) elTrayectos.textContent = Trayectos.listaTrayectos.length;
      if (elModulos) {
        const totalModulos = Trayectos.listaTrayectos.reduce((acc, t) => acc + (t.modulos ? t.modulos.length : 0), 0);
        elModulos.textContent = totalModulos;
      }
    }
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
    div.className = 'modulo-item-card';
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span style="font-size: 0.8rem; font-weight: 600; color: #94a3b8;">Módulo Adicional</span>
        <button type="button" class="btn btn-danger btn-xs" onclick="UI.eliminarFilaModulo(this)" style="padding: 0.2rem 0.5rem;">✕ Eliminar</button>
      </div>
      <div class="form-grid-2">
        <input type="text" class="mod-nombre form-control" placeholder="Nombre del Módulo">
        <input type="text" class="mod-codigo form-control" placeholder="Código (Ej: GH 0050)">
      </div>
      <div class="form-grid-2" style="margin-top: 0.75rem;">
        <div>
          <label style="font-size: 0.75rem; color: #94a3b8;">Inicio</label>
          <input type="date" class="mod-inicio form-control">
        </div>
        <div>
          <label style="font-size: 0.75rem; color: #94a3b8;">Fin</label>
          <input type="date" class="mod-fin form-control">
        </div>
      </div>
    `;
    contenedor.appendChild(div);
  },

  eliminarFilaModulo(btn) {
    const card = btn.closest('.modulo-item-card') || btn.closest('.modulo-card');
    const totalCards = document.querySelectorAll('.modulo-item-card, .modulo-card').length;
    
    if (totalCards > 1) {
      if (card) card.remove();
    } else {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'info',
          title: 'Atención',
          text: 'Debe haber al menos un módulo por trayecto.',
          confirmButtonColor: '#2563eb'
        });
      }
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

// Cargar trayectos desde Supabase al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Trayectos !== 'undefined' && Trayectos.cargarTrayectos) {
    Trayectos.cargarTrayectos();
  }
});
