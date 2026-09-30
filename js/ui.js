const UI = {
  showLanding() {
    document.getElementById('public-landing').style.display = 'block';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'none';
  },

  showLoginScreen() {
    document.getElementById('public-landing').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
  },

  mostrarDashboard(perfil) {
    document.getElementById('public-landing').style.display = 'none';
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';

    document.getElementById('display-username').innerText = perfil.nombre || perfil.usuario;
    document.getElementById('display-role').innerText = perfil.rol.toUpperCase();

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

  toggleAuthTab(tab) {
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-register');

    if (tab === 'login') {
      btnLogin.classList.add('active');
      btnReg.classList.remove('active');
      formLogin.style.display = 'block';
      formReg.style.display = 'none';
    } else {
      btnReg.classList.add('active');
      btnLogin.classList.remove('active');
      formReg.style.display = 'block';
      formLogin.style.display = 'none';
    }
  },

  showTab(tabId) {
    document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));

    const btn = document.getElementById(`btn-${tabId}`);
    const sec = document.getElementById(tabId);

    if (btn) btn.classList.add('active');
    if (sec) sec.classList.add('active');
  },

  toggleWidget(headerEl) {
    const body = headerEl.nextElementSibling;
    const isVisible = body.style.display === 'block';
    body.style.display = isVisible ? 'none' : 'block';
  },

  agregarFilaModulo() {
    const contenedor = document.getElementById('contenedor-modulos');
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
      card.remove();
    } else {
      notify('info', 'Debe haber al menos un módulo por trayecto.');
    }
  },

  toggleInscripcionesBox() {
    const rol = document.getElementById('user-rol').value;
    const box = document.getElementById('box-inscripciones');
    const lbl = document.getElementById('lbl-inscripciones');

    if (rol === 'admin') {
      box.style.display = 'none';
    } else {
      box.style.display = 'block';
      lbl.innerText = rol === 'estudiante' ? 'Asignar a Trayectos:' : 'Asignar como Docente en:';
    }
  }
};
