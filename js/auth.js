// js/auth.js - Autenticación con tabla propia de usuarios
const Auth = {
  usuarioActual: null,

  // Inicializa y verifica la sesión persistida al cargar
  init() {
    const perfilRaw = localStorage.getItem('usuario_actual');
    if (perfilRaw) {
      try {
        const perfil = JSON.parse(perfilRaw);
        this.usuarioActual = perfil;
        if (typeof UI !== 'undefined' && typeof UI.mostrarDashboard === 'function') {
          UI.mostrarDashboard(perfil);
        }
      } catch (e) {
        console.error('Error recuperando sesión:', e);
        this.cerrarSesion();
      }
    }
  },

  async iniciarSesion() {
    const userVal = document.getElementById('login-user').value.trim();
    const passVal = document.getElementById('login-pass').value.trim();
    const roleVal = document.getElementById('role-select').value;

    if (!userVal || !passVal) {
      if (typeof alertError === 'function') {
        alertError('Campos incompletos', 'Por favor ingresá tu usuario/DNI y contraseña.');
      } else {
        alert('Por favor ingresá tu usuario/DNI y contraseña.');
      }
      return;
    }

    try {
      // 1. Consultar en la tabla 'usuarios'
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`usuario.eq.${userVal},email.ilike.${userVal}`)
        .eq('pass', passVal);

      if (error) throw error;

      if (!usuarios || usuarios.length === 0) {
        if (typeof alertError === 'function') {
          alertError('Error al ingresar', 'Usuario, DNI o contraseña incorrectos.');
        } else {
          alert('Usuario, DNI o contraseña incorrectos.');
        }
        return;
      }

      const perfil = usuarios[0];

      // 2. Validar estado (ACTIVO / HABILITADO)
      const estado = String(perfil.estado || '').toUpperCase();
      if (estado !== 'ACTIVO' && estado !== 'HABILITADO') {
        if (typeof alertError === 'function') {
          alertError('Cuenta pendiente', 'Tu cuenta está pendiente de aprobación por un administrador.');
        } else {
          alert('Tu cuenta está pendiente de aprobación por un administrador.');
        }
        return;
      }

      // 3. Validar rol seleccionado
      if (roleVal && perfil.rol.toLowerCase() !== roleVal.toLowerCase()) {
        if (typeof alertError === 'function') {
          alertError('Rol incorrecto', `Tu usuario no está registrado como ${roleVal.toUpperCase()}.`);
        } else {
          alert(`Tu usuario no está registrado como ${roleVal.toUpperCase()}.`);
        }
        return;
      }

      // 4. Guardar sesión y activar vista
      this.usuarioActual = perfil;
      localStorage.setItem('usuario_actual', JSON.stringify(perfil));

      if (typeof notify === 'function') {
        notify('success', `¡Bienvenido/a ${perfil.nombre}!`);
      }

      if (typeof UI !== 'undefined' && typeof UI.mostrarDashboard === 'function') {
        UI.mostrarDashboard(perfil);
      } else {
        window.location.reload();
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
    const dni = document.getElementById('reg-dni')?.value.trim();
    const pass = document.getElementById('reg-pass')?.value.trim();
    const rol = document.getElementById('reg-rol')?.value || 'estudiante';

    if (!nombre || !dni || !pass) {
      if (typeof alertError === 'function') {
        alertError('Campos incompletos', 'Todos los campos son obligatorios.');
      } else {
        alert('Todos los campos son obligatorios.');
      }
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('usuarios')
        .insert([{
          nombre: nombre,
          usuario: dni,
          pass: pass,
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

// Autoejecutar inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});

window.Auth = Auth;
