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
    if (perfil) {
      if (perfil.usuario) perfil.usuario = String(perfil.usuario).split(':')[0].trim();
      if (perfil.dni) perfil.dni = String(perfil.dni).split(':')[0].trim();
      localStorage.setItem('usuario_actual', JSON.stringify(perfil));
    }

    const landing = document.getElementById('landing-screen') || document.querySelector('.public-landing');
    const login = document.getElementById('login-screen');
    const app = document.getElementById('app-screen');

    if (landing) landing.style.setProperty('display', 'none', 'important');
    if (login) login.style.setProperty('display', 'none', 'important');
    if (app) app.style.setProperty('display', 'flex', 'important'); 

    const displayUsername = document.getElementById('display-username');
    const displayRole = document.getElementById('display-role');

    if (displayUsername) displayUsername.innerText = perfil.nombre || perfil.usuario;
    if (displayRole) displayRole.innerText = (perfil.rol || '').toUpperCase();

    const rolNorm = (perfil.rol || '').toLowerCase().trim();
    const isAdmin = rolNorm === 'admin';

    if (app) app.setAttribute('data-rol', rolNorm);

    // 1. Filtrar visibilidad de botones en la barra lateral
    const btnDashboard = document.getElementById('btn-dashboard');
    const btnNuevoTrayecto = document.getElementById('btn-nuevo-trayecto');
    const btnCertificados = document.getElementById('btn-certificados');
    const btnUsuarios = document.getElementById('btn-usuarios');

    if (btnDashboard) btnDashboard.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    if (btnNuevoTrayecto) btnNuevoTrayecto.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    if (btnCertificados) btnCertificados.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
    if (btnUsuarios) btnUsuarios.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');

    // Ocultamiento general de elementos con clase .admin-only
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.setProperty('display', isAdmin ? (el.tagName === 'BUTTON' ? 'inline-flex' : 'block') : 'none', 'important');
    });

    // 2. Redirección e inicialización según rol
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

    // Bloqueo de seguridad: impide acceso a pestañas administrativas si no es admin
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
      this.cargarTrayectosDelUsuario();
    }
  },

  // Carga los trayectos vinculados al usuario actual
  async cargarTrayectosDelUsuario() {
    const contenedorAdmin = document.getElementById('lista-trayectos-admin');
    const perfilRaw = localStorage.getItem('usuario_actual');
    if (!perfilRaw) return;
    
    let perfil = JSON.parse(perfilRaw);
    
    const rolUsuario = String(perfil.rol || '').toLowerCase().trim();
    const isAdmin = rolUsuario === 'admin' || rolUsuario === 'administrador';

    if (isAdmin) {
      if (window.TrayectosAdmin && typeof window.TrayectosAdmin.cargarTrayectos === 'function') {
        window.TrayectosAdmin.cargarTrayectos();
      }
      return;
    }

    if (!contenedorAdmin) return;
    contenedorAdmin.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 2rem;">Cargando tus trayectos vinculados...</p>';

    try {
      const usrVal = String(perfil.usuario || '').trim();
      const dniVal = String(perfil.dni || '').trim();
      const nomVal = String(perfil.nombre || '').trim();

      const condiciones = [];
      if (usrVal) condiciones.push(`estudiante_user.eq.${usrVal}`);
      if (dniVal) condiciones.push(`estudiante_user.eq.${dniVal}`);
      if (nomVal) condiciones.push(`estudiante_user.eq.${nomVal}`);

      if (condiciones.length === 0) {
        contenedorAdmin.innerHTML = '<p style="color: #f87171; text-align: center;">No se encontró un usuario válido.</p>';
        return;
      }

      const { data: inscripciones, error: errInsc } = await supabase
        .from('inscripciones')
        .select('trayecto_id')
        .or(condiciones.join(','));

      if (errInsc) throw errInsc;

      if (!inscripciones || inscripciones.length === 0) {
        contenedorAdmin.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: rgba(30,41,59,0.5); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <h3 style="color: #f8fafc; margin-bottom: 0.5rem;">No estás vinculado a ningún trayecto</h3>
            <p style="color: #94a3b8;">Ponete en contacto con la administración del CFP para habilitar tu inscripción.</p>
          </div>
        `;
        return;
      }

      const idsTrayectos = inscripciones.map(i => i.trayecto_id).filter(Boolean);
      let trayectosMap = {};

      if (idsTrayectos.length > 0) {
        const { data: trayectos, error: errTray } = await supabase
          .from('trayectos')
          .select('id, nombre, descripcion')
          .in('id', idsTrayectos);

        if (!errTray && trayectos) {
          trayectos.forEach(t => {
            trayectosMap[t.id] = t;
          });
        }
      }

      contenedorAdmin.innerHTML = inscripciones.map(i => {
        const trayecto = trayectosMap[i.trayecto_id] || {};
        return `
          <div style="background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid rgba(255,255,255,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="color: #f8fafc; margin: 0; font-size: 1.2rem;">${trayecto.nombre || 'Trayecto Formativo'}</h3>
              <span style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                CURSANDO
              </span>
            </div>
            <p style="color: #94a3b8; margin-top: 0.75rem; font-size: 0.9rem;">
              ${trayecto.descripcion || 'Sin descripción disponible.'}
            </p>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('Error cargando trayectos del usuario:', err);
      contenedorAdmin.innerHTML = '<p style="color: #f87171; text-align: center;">Error al obtener tus trayectos.</p>';
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
