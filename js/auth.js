const Auth = {
  usuarioActual: null,

  async iniciarSesion() {
    const userVal = document.getElementById('login-user').value.trim();
    const passVal = document.getElementById('login-pass').value.trim();
    const roleVal = document.getElementById('role-select').value;

    if (!userVal || !passVal) {
      alertError('Campos incompletos', 'Por favor ingresá tu usuario/DNI y contraseña.');
      return;
    }

    try {
      // 1. Consultar directamente en tu tabla 'usuarios'
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .or(`usuario.eq.${userVal},email.ilike.${userVal}`)
        .eq('pass', passVal);

      if (error) throw error;

      if (!usuarios || usuarios.length === 0) {
        alertError('Error al ingresar', 'Usuario, DNI o contraseña incorrectos.');
        return;
      }

      const perfil = usuarios[0];

      // 2. Validar estado (soporta 'ACTIVO', 'activo', etc.)
      const estado = String(perfil.estado || '').toUpperCase();
      if (estado !== 'ACTIVO' && estado !== 'HABILITADO') {
        alertError('Cuenta pendiente', 'Tu cuenta está pendiente de aprobación por un administrador.');
        return;
      }

      // 3. Validar rol seleccionado
      if (roleVal && perfil.rol.toLowerCase() !== roleVal.toLowerCase()) {
        alertError('Rol incorrecto', `Tu usuario no está registrado como ${roleVal.toUpperCase()}.`);
        return;
      }

      // 4. Guardar usuario actual y mostrar pantalla correspondiente
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
      alertError('Error al ingresar', 'Credenciales inválidas o problema de conexión.');
    }
  },

  async solicitarRegistro() {
    const nombre = document.getElementById('reg-nombre').value.trim().toUpperCase();
    const dni = document.getElementById('reg-dni').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    const rol = document.getElementById('reg-rol').value;

    if (!nombre || !dni || !pass) {
      alertError('Campos incompletos', 'Todos los campos son obligatorios.');
      return;
    }

    try {
      // Registro directo en la tabla 'usuarios' sin pasar por auth.users
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

      alertSuccess('Solicitud Enviada', 'Tu registro ha sido enviado. Un administrador deberá aprobar tu cuenta antes de que puedas ingresar.');
      document.getElementById('form-register')?.reset();
      
      if (typeof UI !== 'undefined' && typeof UI.toggleAuthTab === 'function') {
        UI.toggleAuthTab('login');
      }

    } catch (err) {
      console.error('Error Registro:', err);
      alertError('Error de Registro', err.message || 'No se pudo procesar la solicitud.');
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
