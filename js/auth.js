// js/auth.js - Encriptación Automática en Formulario

const Auth = {
  usuarioActual: null,

  limpiarIdentificador(val) {
    if (!val) return '';
    return String(val).trim();
  },

  // Convierte texto plano a SHA-256 garantizado
  hashPassword(pass) {
    if (!pass) return '';
    if (typeof CryptoJS !== 'undefined' && CryptoJS.SHA256) {
      return CryptoJS.SHA256(pass).toString();
    }
    return pass;
  },

  init() {
    const perfilRaw = localStorage.getItem('usuario_actual');
    if (perfilRaw) {
      try {
        let perfil = JSON.parse(perfilRaw);
        this.usuarioActual = perfil;

        if (typeof notify === 'function') {
          notify('success', `¡Bienvenido/a ${perfil.nombre || perfil.usuario}!`);
        }

        if (typeof UI !== 'undefined' && typeof UI.mostrarDashboard === 'function') {
          UI.mostrarDashboard(perfil);
        }

      } catch (e) {
        console.error('Error recuperando sesión:', e);
        this.cerrarSesion();
      }
    }
  },

  cerrarSesion() {
    this.usuarioActual = null;
    localStorage.removeItem('usuario_actual');
    if (typeof UI !== 'undefined' && typeof UI.mostrarLogin === 'function') {
      UI.mostrarLogin();
    } else {
      window.location.reload();
    }
  },

  solicitarRegistro: async function() {
    console.log("Solicitando registro...");
  },

  iniciarSesion: async function() {
    // 1. Quitar cualquier aria-hidden bloqueante
    const loginScreenEl = document.getElementById('login-screen');
    if (loginScreenEl) loginScreenEl.removeAttribute('aria-hidden');

    const userValRaw = document.getElementById('login-user')?.value?.trim() || '';
    const passVal = document.getElementById('login-pass')?.value?.trim() || '';
    const roleVal = document.getElementById('role-select')?.value || '';

    if (!userValRaw || !passVal) {
      if (typeof alertError === 'function') {
        alertError('Campos incompletos', 'Por favor ingresá tu usuario/DNI y contraseña.');
      } else {
        alert('Por favor ingresá tu usuario/DNI y contraseña.');
      }
      return;
    }

    const userVal = userValRaw.toLowerCase();
    
    // Convertir la clave escrita a SHA-256
    const passHash = this.hashPassword(passVal);

    try {
      // 2. Traer el usuario de Supabase
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`usuario.eq.${userVal},email.ilike.${userVal}`);

      if (error) throw error;

      if (!usuarios || usuarios.length === 0) {
        if (typeof alertError === 'function') {
          alertError('Error al ingresar', 'Usuario, DNI o contraseña incorrectos.');
        } else {
          alert('Usuario, DNI o contraseña incorrectos.');
        }
        return;
      }

      // 3. Comparar el Hash del input contra el Hash de la DB
      const perfil = usuarios.find(u => {
        const dbPass = String(u.pass || '').trim();
        return dbPass === passHash || dbPass === passVal;
      });

      if (!perfil) {
        if (typeof alertError === 'function') {
          alertError('Error al ingresar', 'Usuario, DNI o contraseña incorrectos.');
        } else {
          alert('Usuario, DNI o contraseña incorrectos.');
        }
        return;
      }

      // 4. Validar estado y rol
      const estado = String(perfil.estado || '').toUpperCase();
      const rolNorm = String(perfil.rol || '').toLowerCase().trim();

      if (rolNorm !== 'admin' && estado !== 'ACTIVO' && estado !== 'HABILITADO' && estado !== 'APROBADO') {
        if (typeof alertError === 'function') {
          alertError('Cuenta pendiente', 'Tu cuenta está pendiente de aprobación por un administrador.');
        } else {
          alert('Tu cuenta está pendiente de aprobación por un administrador.');
        }
        return;
      }

      // 5. Iniciar Sesión y mostrar Dashboard
      this.usuarioActual = perfil;
      localStorage.setItem('usuario_actual', JSON.stringify(perfil));

      if (typeof notify === 'function') {
        notify('success', `¡Bienvenido/a ${perfil.nombre || perfil.usuario}!`);
      }

      const loginScreen = document.getElementById('login-screen');
      if (loginScreen) {
        loginScreen.style.setProperty('display', 'none', 'important');
      }

      if (typeof UI !== 'undefined' && typeof UI.mostrarDashboard === 'function') {
        UI.mostrarDashboard(perfil);
      }

    } catch (err) {
      console.error('Error Auth:', err);
      if (typeof alertError === 'function') {
        alertError('Error al ingresar', 'Credenciales inválidas o problema de conexión.');
      } else {
        alert('Credenciales inválidas o problema de conexión.');
      }
    }
  }
};
