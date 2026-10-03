// js/usuarios.js - Gestión de Usuarios y Roles
const UsuariosAdmin = {
  // Cargar lista de usuarios registrados
  async cargarUsuarios() {
    const tbody = document.getElementById('tabla-usuarios');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2rem; color: #94a3b8;">
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
            <td colspan="4" style="text-align: center; padding: 2rem; color: #94a3b8;">
              No hay usuarios registrados aún.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = usuarios.map(u => {
        const estado = u.estado || 'pendiente';
        const esActivo = estado === 'activo';
        
        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 0.85rem 0.75rem;">
              <strong style="color: #f8fafc; font-size: 0.95rem;">${u.nombre || 'Sin Nombre'}</strong><br>
              <span style="font-size: 0.8rem; color: #94a3b8;">DNI: ${u.dni || u.id}</span>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
              <select class="form-control" style="padding: 0.3rem 0.5rem; font-size: 0.85rem; width: auto;" onchange="UsuariosAdmin.cambiarRol('${u.dni}', this.value)">
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
                <button class="btn btn-gold" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="UsuariosAdmin.cambiarEstado('${u.dni}', 'activo')">
                  ✓ Aprobar
                </button>
              ` : `
                <button class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;" onclick="UsuariosAdmin.cambiarEstado('${u.dni}', 'pendiente')">
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

  // Aprobar o Inhabilitar usuario
  async cambiarEstado(dni, nuevoEstado) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ estado: nuevoEstado })
        .eq('dni', dni);

      if (error) throw error;

      notify('success', `Usuario ${nuevoEstado === 'activo' ? 'aprobado con éxito' : 'inhabilitado'}`);
      this.cargarUsuarios();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      notify('error', 'Error al cambiar estado del usuario');
    }
  },

  // Cambiar rol (Estudiante / Docente / Admin)
  async cambiarRol(dni, nuevoRol) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ rol: nuevoRol })
        .eq('dni', dni);

      if (error) throw error;

      notify('success', `Rol actualizado a ${nuevoRol.toUpperCase()}`);
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      notify('error', 'Error al cambiar rol del usuario');
    }
  }
};

window.UsuariosAdmin = UsuariosAdmin;
