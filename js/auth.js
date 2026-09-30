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

    const email = userVal.includes('@') ? userVal : `${userVal}@cfp403.edu.ar`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: passVal
      });

      if (error) throw error;

      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (perfilError || !perfil) {
        alertError('Error de acceso', 'No se encontró un perfil registrado asociado a esta cuenta.');
        return;
      }

      if (perfil.estado === 'pendiente') {
        Swal.fire({
          icon: 'warning',
          title: 'Cuenta Pendiente de Aprobación',
          text: 'Tu solicitud de registro está siendo revisada por el equipo directivo/administrador.',
          confirmButtonColor: '#f59e0b'
        });
        await supabase.auth.signOut();
        return;
      }

      if (perfil.rol !== roleVal) {
        alertError('Rol incorrecto', `Tu usuario no está registrado como ${roleVal.toUpperCase()}.`);
        await supabase.auth.signOut();
        return;
      }

      this.usuarioActual = perfil;
      notify('success', `¡Bienvenido/a ${perfil.nombre}!`);
      UI.mostrarDashboard(perfil);

    } catch (err) {
      console.error('Error Auth:', err);
      alertError('Error al ingresar', 'Credenciales inválidas o problema de conexión.');
    }
  },

  async solicitarRegistro() {
    const nombre = document.getElementById('reg-nombre').value.trim();
    const dni = document.getElementById('reg-dni').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    const rol = document.getElementById('reg-rol').value;

    if (!nombre || !dni || !pass) {
      alertError('Campos incompletos', 'Todos los campos son obligatorios.');
      return;
    }

    const email = `${dni}@cfp403.edu.ar`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: pass
      });

      if (error) throw error;

      const { error: dbError } = await supabase
        .from('usuarios')
        .insert([{
          id: data.user.id,
          nombre: nombre,
          usuario: dni,
          rol: rol,
          estado: 'pendiente'
        }]);

      if (dbError) throw dbError;

      alertSuccess('Solicitud Enviada', 'Tu registro ha sido enviado. Un administrador deberá aprobar tu cuenta antes de que puedas ingresar.');
      document.getElementById('form-register').reset();
      UI.toggleAuthTab('login');

    } catch (err) {
      console.error('Error Registro:', err);
      alertError('Error de Registro', err.message || 'No se pudo procesar la solicitud.');
    }
  },

  async cerrarSesion() {
    await supabase.auth.signOut();
    this.usuarioActual = null;
    notify('info', 'Sesión cerrada');
    UI.showLanding();
  }
};
