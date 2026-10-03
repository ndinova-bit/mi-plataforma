// js/usuarios.js - Gestión de Usuarios, Roles, Altas Manuales y Matriculación
const UsuariosAdmin = {
  // Abrir modal de alta
  abrirModal() {
    const modal = document.getElementById('modal-alta-usuario');
    if (modal) {
      modal.classList.add('open', 'active');
      modal.style.display = 'flex';
      this.cargarTrayectosEnModal();
    }
  },

  // Cerrar modal de alta
  cerrarModal() {
    const modal = document.getElementById('modal-alta-usuario');
    if (modal) {
      modal.classList.remove('open', 'active');
      modal.style.display = 'none';
      document.getElementById('form-alta-usuario')?.reset();
    }
  },

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
        .order('id', { ascending: false });

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
        const usrIdentificador = u.usuario || u.id;

        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 0.85rem 0.75rem;">
              <strong style="color: #f8fafc; font-size: 0.95rem;">${nombreCompleto}</strong><br>
              <span style="font-size: 0.8rem; color: #94a3b8;">Usuario / DNI: ${usrIdentificador}</span>
            </td>
            <td style="padding: 0.85rem 0.75rem; font-size: 0.85rem; color: #cbd5e1;">
              ${u.email || 'Sin correo'}<br>
              <span style="font-size: 0.75rem; color: #94a3b8;">${u.ciudad || ''} ${u.provincia ? '(' + u.provincia + ')' : ''}</span>
            </td>
            <td style="padding: 0.85rem 0.75rem;">
              <select class="form-control" style="padding: 0.3rem 0.5rem; font-size: 0.85rem; width: auto;" onchange="UsuariosAdmin.cambiarRol('${usrIdentificador}', this.value)">
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
                <button class="btn btn-gold" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="UsuariosAdmin.cambiarEstado('${usrIdentificador}', 'activo')">
                  ✓ Aprobar
                </button>
              ` : `
                <button class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;" onclick="UsuariosAdmin.cambiarEstado('${usrIdentificador}', 'pendiente')">
                  🔒 Inhabilitar
                </button>
              `}
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      if (typeof notify === 'function') notify('error', 'No se pudieron cargar los usuarios.');
    }
  },

  // Cargar lista de trayectos activos dentro del modal
  async cargarTrayectosEnModal() {
    const contenedor = document.getElementById('usr-alta-trayectos');
    if (!contenedor) return;

    contenedor.innerHTML = '<span style="color: #94a3b8; font-size: 0.85rem;">Cargando trayectos...</span>';

    try {
      const { data: trayectos, error } = await supabase
        .from('trayectos')
        .select('id, nombre');

      if (error) throw error;

      if (!trayectos || trayectos.length === 0) {
        contenedor.innerHTML = '<span style="color: #94a3b8; font-size: 0.85rem;">No hay trayectos disponibles aún.</span>';
        return;
      }

      contenedor.innerHTML = trayectos.map(t => `
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #cbd5e1; cursor: pointer; margin-bottom: 0.4rem;">
          <input type="checkbox" name="trayectos_seleccionados" value="${t.id}">
          <span>${t.nombre}</span>
        </label>
      `).join('');
    } catch (err) {
      console.error('Error al cargar trayectos para el modal:', err);
      contenedor.innerHTML = '<span style="color: #f87171; font-size: 0.85rem;">Error al obtener trayectos.</span>';
    }
  },

  // Alta manual de usuario adaptada a la estructura exacta de Supabase
  async crearUsuarioManual() {
    const apellido = document.getElementById('usr-alta-apellido')?.value.trim();
    const nombre = document.getElementById('usr-alta-nombre')?.value.trim();
    const dniVal = document.getElementById('usr-alta-dni')?.value.trim();
    const email = document.getElementById('usr-alta-email')?.value.trim();
    const rol = document.getElementById('usr-alta-rol')?.value || 'estudiante';
    const fechaNac = document.getElementById('usr-alta-fecha')?.value || null;
    const domicilio = document.getElementById('usr-alta-domicilio')?.value.trim() || '';
    const ciudad = document.getElementById('usr-alta-ciudad')?.value.trim() || '';
    const provincia = document.getElementById('usr-alta-provincia')?.value.trim() || '';
    const nacionalidad = document.getElementById('usr-alta-nacionalidad')?.value.trim() || 'Argentina';

    if (!nombre || !apellido || !dniVal) {
      if (typeof notify === 'function') notify('error', 'Por favor completá Nombre, Apellido y DNI.');
      return;
    }

    try {
      // Estructura limpia que coincide con la tabla 'usuarios'
      const nuevoUsuario = {
        nombre: nombre,
        apellido: apellido,
        usuario: dniVal,
        pass: dniVal,
        email: email || null,
        rol: rol,
        estado: 'activo',
        domicilio: domicilio,
        ciudad: ciudad,
        provincia: provincia,
        nacionalidad: nacionalidad,
        cambiar_pass: true
      };

      // Si ingresó fecha de nacimiento, la incluimos
      if (fechaNac) {
        nuevoUsuario.fecha_nacimiento = fechaNac;
      }

      const { data: usrCreado, error: errUsr } = await supabase
        .from('usuarios')
        .insert([nuevoUsuario])
        .select();

      if (errUsr) throw errUsr;

      // Inscribir en trayectos seleccionados
      const checkboxes = document.querySelectorAll('input[name="trayectos_seleccionados"]:checked');
      const trayectoIds = Array.from(checkboxes).map(cb => cb.value);

      if (trayectoIds.length > 0 && usrCreado && usrCreado[0]) {
        const inscripciones = trayectoIds.map(tId => ({
          usuario_id: usrCreado[0].id,
          usuario_dni: dniVal,
          trayecto_id: tId,
          estado: 'cursando'
        }));

        const { error: errInsc } = await supabase.from('inscripciones').insert(inscripciones);
        if (errInsc) console.error('Error guardando inscripciones:', errInsc);
      }

      if (typeof notify === 'function') {
        notify('success', `Usuario ${nombre} ${apellido} creado con éxito.`);
      } else {
        alert(`Usuario ${nombre} ${apellido} creado con éxito.`);
      }

      this.cerrarModal();
      this.cargarUsuarios();
    } catch (err) {
      console.error('Error al crear usuario:', err);
      const msgError = err.message || 'Error al guardar usuario en Supabase.';
      if (typeof notify === 'function') {
        notify('error', msgError);
      } else {
        alert('Error al guardar: ' + msgError);
      }
    }
  },

  // Cambiar estado
  async cambiarEstado(identificador, nuevoEstado) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ estado: nuevoEstado })
        .eq('usuario', identificador);

      if (error) throw error;

      if (typeof notify === 'function') notify('success', `Estado actualizado a ${nuevoEstado.toUpperCase()}`);
      this.cargarUsuarios();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      if (typeof notify === 'function') notify('error', 'Error al cambiar el estado');
    }
  },

  // Cambiar rol
  async cambiarRol(identificador, nuevoRol) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ rol: nuevoRol })
        .eq('usuario', identificador);

      if (error) throw error;

      if (typeof notify === 'function') notify('success', `Rol actualizado a ${nuevoRol.toUpperCase()}`);
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      if (typeof notify === 'function') notify('error', 'Error al cambiar rol');
    }
  }
};

// Aliases y exposición global
UsuariosAdmin.cargarTrayectosModal = UsuariosAdmin.cargarTrayectosEnModal;
UsuariosAdmin.cargarTrayectos = UsuariosAdmin.cargarTrayectosEnModal;

window.UsuariosAdmin = UsuariosAdmin;
window.Usuarios = UsuariosAdmin;

window.crearUsuarioManual = () => UsuariosAdmin.crearUsuarioManual();
window.cerrarModal = () => UsuariosAdmin.cerrarModal();
window.abrirModal = () => UsuariosAdmin.abrirModal();
