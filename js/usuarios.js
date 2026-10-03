// js/usuarios.js - Gestión de Usuarios, Roles y Altas Manuales
const UsuariosAdmin = {
  // Cargar lista de usuarios registrados
  async cargarUsuarios() {
    const tbody = document.getElementById('tabla-usuarios');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #94a3b8;">
          Cargando usuarios...
        </td>
      </tr>
    `;

    try {
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 2rem; color: #94a3b8;">
              No hay usuarios registrados aún.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = usuarios.map(u => {
        const estado = u.estado || 'pendiente';
        const esActivo = estado === 'activo';
        const nombreCompleto = u.apellido ? `${u.apellido}, ${u.nombre}` : (u.nombre || 'Sin Nombre');
        const dniVal = u.dni || u.usuario || u.id;

        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 0.85rem 0.75rem;">
              <strong style="color: #f8fafc; font-size: 0.95rem;">${nombreCompleto}</strong><br>
              <span style="font-size: 0.8rem; color: #94a3b8;">DNI: ${dniVal}</span>
            </td>
            <td style="padding: 0.85rem 0.75rem; font-size: 0.85rem; color: #cbd5e1;">
              ${u.email || 'Sin correo'}<br>
              <span style="font-size: 0.75rem; color: #94a3b8;">${u.ciudad || ''} ${u.provincia ? '(' + u.provincia + ')' : ''}</span>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
              <select class="form-control" style="padding: 0.3rem 0.5rem; font-size: 0.85rem; width: auto;" onchange="UsuariosAdmin.cambiarRol('${dniVal}', this.value)">
                <option value="estudiante" ${u.rol === 'estudiante' ? 'selected' : ''}>Estudiante</option>
                <option value="docente" ${u.rol === 'docente' ? 'selected' : ''}>Docente</option>
                <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Administrador</option>
              </select>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
              <span class="badge" style="background: ${esActivo ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)'}; color: ${esActivo ? '#4ade80' : '#facc15'}; border: 1px solid ${esActivo ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)'}; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
                ${estado.toUpperCase()}
              </span>
            </td>
            <td style="padding: 0.85rem 0.75rem; text-align: right;">
              ${!esActivo ? `
                <button class="btn btn-gold" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="UsuariosAdmin.cambiarEstado('${dniVal}', 'activo')">
                  ✓ Aprobar
                </button>
              ` : `
                <button class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;" onclick="UsuariosAdmin.cambiarEstado('${dniVal}', 'pendiente')">
                  🔒 Inhabilitar
                </button>
              `}
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      notify('error', 'No se pudieron cargar los usuarios.');
    }
  },

  // Alta manual de usuario desde el administrador
  async crearUsuarioManual() {
    const apellido = document.getElementById('usr-alta-apellido')?.value.trim();
    const nombre = document.getElementById('usr-alta-nombre')?.value.trim();
    const dni = document.getElementById('usr-alta-dni')?.value.trim();
    const email = document.getElementById('usr-alta-email')?.value.trim();
    const rol = document.getElementById('usr-alta-rol')?.value || 'estudiante';
    const fechaNac = document.getElementById('usr-alta-fecha')?.value || null;
    const domicilio = document.getElementById('usr-alta-domicilio')?.value.trim() || '';
    const ciudad = document.getElementById('usr-alta-ciudad')?.value.trim() || '';
    const provincia = document.getElementById('usr-alta-provincia')?.value.trim() || '';
    const nacionalidad = document.getElementById('usr-alta-nacionalidad')?.value.trim() || 'Argentina';

    if (!nombre || !apellido || !dni) {
      notify('error', 'Por favor completá Nombre, Apellido y DNI.');
      return;
    }

    try {
      const nuevoUsuario = {
        nombre: nombre,
        apellido: apellido,
        dni: dni,
        usuario: dni, // DNI como usuario
        pass: dni,    // DNI como contraseña inicial por defecto
        email: email,
        rol: rol,
        estado: 'activo', // Las altas directas por el admin nacen activas
        fecha_nacimiento: fechaNac,
        domicilio: domicilio,
        ciudad: ciudad,
        provincia: provincia,
        nacionalidad: nacionalidad,
        cambiar_pass: true
      };

      const { error } = await supabase.from('usuarios').insert([nuevoUsuario]);

      if (error) throw error;

      notify('success', `Usuario ${nombre} ${apellido} creado con éxito. Clave inicial: ${dni}`);
      
      // Limpiar formulario y cerrar modal si existe
      document.getElementById('form-alta-usuario')?.reset();
      const modal = document.getElementById('modal-alta-usuario');
      if (modal) modal.style.display = 'none';

      this.cargarUsuarios();
    } catch (err) {
      console.error('Error al crear usuario:', err);
      notify('error', 'Error al guardar el usuario en Supabase.');
    }
  },

  // Cambiar estado
  async cambiarEstado(dni, nuevoEstado) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ estado: nuevoEstado })
        .eq('usuario', dni);

      if (error) throw error;

      notify('success', `Estado actualizado a ${nuevoEstado.toUpperCase()}`);
      this.cargarUsuarios();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      notify('error', 'Error al cambiar el estado');
    }
  },

  // Cambiar rol
  async cambiarRol(dni, nuevoRol) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ rol: nuevoRol })
        .eq('usuario', dni);

      if (error) throw error;

      notify('success', `Rol actualizado a ${nuevoRol.toUpperCase()}`);
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      notify('error', 'Error al cambiar rol');
    }
  }
};

window.UsuariosAdmin = UsuariosAdmin;
window.Usuarios = UsuariosAdmin;
