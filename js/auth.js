// js/auth.js - Autenticación limpia con Hash de contraseñas para Admins y Estudiantes
const Auth = {
  usuarioActual: null,

  // Función interna para generar Hash de contraseña con CryptoJS
  hashPassword(pass) {
    if (!pass) return '';
    return typeof CryptoJS !== 'undefined' 
      ? CryptoJS.SHA256(pass).toString() 
      : pass;
  },

  // Sanitizador inteligente: quita sufijos tipo ":1" sin destruir usuarios con texto
  limpiarIdentificador(val) {
    if (!val) return '';
    let str = String(val).trim();
    if (str.includes(':')) {
      str = str.split(':')[0];
    }
    return str;
  },

   // js/auth.js
init() {
  const perfilRaw = localStorage.getItem('usuario_actual');
  if (perfilRaw) {
    try {
      let perfil = JSON.parse(perfilRaw);
      
      if (perfil) {
        if (perfil.usuario) perfil.usuario = this.limpiarIdentificador(perfil.usuario);
        localStorage.setItem('usuario_actual', JSON.stringify(perfil));
      }

      this.usuarioActual = perfil;

      if (typeof notify === 'function') {
        notify('success', `¡Bienvenido/a ${perfil.nombre || perfil.usuario}!`);
      }

      // IMPORTANTE: Pasar 'perfil' a mostrarDashboard y NO recargar
      if (typeof UI !== 'undefined' && typeof UI.mostrarDashboard === 'function') {
        UI.mostrarDashboard(perfil);
      }

    } catch (e) {
      console.error('Error recuperando sesión:', e);
      this.cerrarSesion();
    }
  }
}

 iniciarSesion: async function() {
    const userValRaw = document.getElementById('login-user').value.trim();
    const passVal = document.getElementById('login-pass').value.trim();
    const roleVal = document.getElementById('role-select')?.value || '';

    if (!userValRaw || !passVal) {
      if (typeof alertError === 'function') {
        alertError('Campos incompletos', 'Por favor ingresá tu usuario/DNI y contraseña.');
      } else {
        alert('Por favor ingresá tu usuario/DNI y contraseña.');
      }
      return;
    }

    const userVal = this.limpiarIdentificador(userValRaw);
    const passHash = this.hashPassword(passVal);

    try {
      // Consultamos solo columnas que existen en la tabla 'usuarios'
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido, usuario, email, rol, estado')
        .or(`usuario.eq.${userVal},email.ilike.${userVal}`)
        .eq('pass', passHash);

      if (error) throw error;

      if (!usuarios || usuarios.length === 0) {
        if (typeof alertError === 'function') {
          alertError('Error al ingresar', 'Usuario, DNI o contraseña incorrectos.');
        } else {
          alert('Usuario, DNI o contraseña incorrectos.');
        }
        return;
      }

      let perfil = usuarios[0];

      if (perfil.usuario) perfil.usuario = this.limpiarIdentificador(perfil.usuario);

      // Validar estado (ACTIVO / HABILITADO / APROBADO O si es ADMIN)
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

      // Validar rol si se seleccionó uno específico en el login
      if (roleVal && rolNorm !== roleVal.toLowerCase()) {
        if (typeof alertError === 'function') {
          alertError('Rol incorrecto', `Tu usuario no está registrado como ${roleVal.toUpperCase()}.`);
        } else {
          alert(`Tu usuario no está registrado como ${roleVal.toUpperCase()}.`);
        }
        return;
      }

      // Guardar sesión sin la contraseña
      this.usuarioActual = perfil;
      localStorage.setItem('usuario_actual', JSON.stringify(perfil));

      if (typeof notify === 'function') {
        notify('success', `¡Bienvenido/a ${perfil.nombre || perfil.usuario}!`);
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
  },

  async solicitarRegistro() {
    const nombre = document.getElementById('reg-nombre')?.value.trim().toUpperCase();
    const dniRaw = document.getElementById('reg-dni')?.value.trim();
    const pass = document.getElementById('reg-pass')?.value.trim();
    const rol = document.getElementById('reg-rol')?.value || 'estudiante';

    const dniLimpio = this.limpiarIdentificador(dniRaw);

    if (!nombre || !dniLimpio || !pass) {
      if (typeof alertError === 'function') {
        alertError('Campos incompletos', 'Todos los campos son obligatorios.');
      } else {
        alert('Todos los campos son obligatorios.');
      }
      return;
    }

    const passHash = this.hashPassword(pass);

    try {
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert([{
          nombre: nombre,
          usuario: dniLimpio,
          pass: passHash,
          rol: rol,
          estado: 'PENDIENTE'
        }]);

      if (dbError) throw dbError;

      if (typeof alertSuccess === 'function') {
        alertSuccess('Solicitud Enviada', 'Tu registro ha sido enviado. Un administrador deberá aprobar tu cuenta antes de que puedas ingresar.');
      } else {
        alert('Tu registro ha sido enviado con éxito.');
      }

      document.getElementById('form-register')?.reset();
      
      if (typeof UI !== 'undefined' && typeof UI.toggleAuthTab === 'function') {
        UI.toggleAuthTab('login');
      }

    } catch (err) {
      console.error('Error Registro:', err);
      if (typeof alertError === 'function') {
        alertError('Error de Registro', err.message || 'No se pudo procesar la solicitud.');
      } else {
        alert('Error de Registro: ' + (err.message || 'No se pudo procesar.'));
      }
    }
  },

  async cerrarSesion() {
    this.usuarioActual = null;
    localStorage.removeItem('usuario_actual');
    
    if (typeof notify === 'function') notify('info', 'Sesión cerrada');
    if (typeof UI !== 'undefined' && typeof UI.showLanding === 'function') {
      UI.showLanding();
    } else {
      window.location.reload();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});

window.Auth = Auth;
