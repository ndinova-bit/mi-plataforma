// Muestra el Panel Administrativo o Alumno y filtra la interfaz según el rol
  mostrarDashboard(perfil) {
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

    // 1. Marcar el contenedor principal con el rol actual
    if (app) app.setAttribute('data-rol', rolNorm);

    // 2. Ocultar en la barra lateral todo lo que no sea Dashboard o Trayectos para estudiantes
    const sidebarButtons = document.querySelectorAll('.sidebar-nav button, .sidebar-nav a, .sidebar-nav .nav-item-btn');
    sidebarButtons.forEach(btn => {
      const txt = (btn.innerText || btn.textContent).toLowerCase();
      const onclickAttr = btn.getAttribute('onclick') || '';

      // Si es estudiante y el botón menciona 'cargar', 'certificado', 'usuario' o llama a esas pestañas
      if (!isAdmin) {
        if (
          txt.includes('cargar') || 
          txt.includes('certificado') || 
          txt.includes('usuario') ||
          onclickAttr.includes('nuevo-trayecto') ||
          onclickAttr.includes('certificados') ||
          onclickAttr.includes('usuarios')
        ) {
          btn.style.setProperty('display', 'none', 'important');
        } else {
          btn.style.setProperty('display', 'flex', 'important');
        }
      } else {
        btn.style.removeProperty('display');
      }
    });

    // 3. Ocultar elementos genéricos marcados con la clase admin-only
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.setProperty('display', isAdmin ? 'block' : 'none', 'important');
    });

    // 4. Si es estudiante, ir directo a "Mis Trayectos Formativos"
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

    // Bloqueo de seguridad: si un estudiante intenta entrar a secciones admin, redirigir a trayectos
    if (!isAdmin && (tabId === 'nuevo-trayecto' || tabId === 'certificados' || tabId === 'usuarios')) {
      tabId = 'trayectos';
    }

    document.querySelectorAll('.section-tab').forEach(sec => {
      sec.style.setProperty('display', 'none', 'important');
      sec.classList.remove('active');
    });

    document.querySelectorAll('.sidebar-nav .nav-item-btn, .sidebar-nav button, .sidebar-nav a').forEach(btn => {
      btn.classList.remove('active');
    });

    const targetSection = document.getElementById(tabId === 'dashboard' ? 'sec-dashboard' : tabId);
    if (targetSection) {
      targetSection.style.setProperty('display', 'block', 'important');
      targetSection.classList.add('active');
    }

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
