// js/usuarios.js - Gestión de Usuarios y Altas Manuales con Vinculación Real
const UsuariosAdmin = {
  abrirModal() {
    const modal = document.getElementById('modal-alta-usuario');
    if (modal) {
      modal.classList.add('open', 'active');
      modal.style.display = 'flex';
      this.cargarTrayectosEnModal();
    }
  },

  cerrarModal() {
    const modal = document.getElementById('modal-alta-usuario');
    if (modal) {
      modal.classList.remove('open', 'active');
      modal.style.display = 'none';
      document.getElementById('form-alta-usuario')?.reset();
    }
  },

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
        const estadoRaw = String(u.estado || 'PENDIENTE').toUpperCase();
        const esActivo = estadoRaw === 'ACTIVO' || estadoRaw === 'HABILITADO' || estadoRaw === 'APROBADO';
        const nombreCompleto = u.apellido ? `${u.apellido}, ${u.nombre}` : (u.nombre || 'Sin Nombre');
        const usrIdentificador = u.usuario || u.id;

        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 0.85rem 0.75rem;">
              <strong style="color: #f8fafc; font-size: 0.95rem;">${nombreCompleto}</strong><br>
              <span style="font-size: 0.8rem; color: #94a3b8;">Usuario / DNI: ${usrIdentificador}</span>
            </td>
            <td style="padding: 0.85rem 0.75rem; font-size: 0.85rem; color: #cbd5e1;">
              ${u.email || 'Sin correo'}
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
                ${estadoRaw}
              </span>
            </td>
            <td style="padding: 0.85rem 0.75rem; text-align: right;">
              ${!esActivo ? `
                <button class="btn btn-gold" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="UsuariosAdmin.cambiarEstado('${usrIdentificador}', 'ACTIVO')">
                  ✓ Aprobar
                </button>
              ` : `
                <button class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;" onclick="UsuariosAdmin.cambiarEstado('${usrIdentificador}', 'PENDIENTE')">
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

  async cargarTrayectosEnModal() {
    const contenedor = document.getElementById('usr-alta-trayectos');
    if (!contenedor) return;

    contenedor.innerHTML = '<span style="color: #94a3b8; font-size: 0.85rem;">Cargando trayectos...</span>';

    try {
      const { data: trayectos, error } = await supabase
        .from('trayectos')
        .select('*');

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

 async crearUsuarioManual() {
  const apellido = document.getElementById('usr-alta-apellido')?.value.trim().toUpperCase();
  const nombre = document.getElementById('usr-alta-nombre')?.value.trim().toUpperCase();
  const dniVal = document.getElementById('usr-alta-dni')?.value.trim();
  const email = document.getElementById('usr-alta-email')?.value.trim().toUpperCase();
  const rol = document.getElementById('usr-alta-rol')?.value || 'estudiante';

  if (!nombre || !apellido || !dniVal) {
    alert('Por favor completá Nombre, Apellido y DNI.');
    return;
  }

  try {
    // 1. Guardar en la tabla 'usuarios'
    const nuevoUsuario = {
      nombre: nombre,
      apellido: apellido,
      usuario: dniVal,
      pass: dniVal,
      rol: rol,
      estado: 'ACTIVO'
    };

    if (email) nuevoUsuario.email = email;

    const { data: usrCreado, error: errUsr } = await supabase
      .from('usuarios')
      .insert([nuevoUsuario])
      .select();

    if (errUsr) {
      console.error('Error al insertar usuario:', errUsr);
      alert('Error al crear usuario en la BD: ' + errUsr.message);
      return;
    }

    // 2. Guardar inscripciones en la tabla 'inscripciones'
    const checkboxes = document.querySelectorAll('input[name="trayectos_seleccionados"]:checked');
    const trayectoIds = Array.from(checkboxes).map(cb => cb.value);

    if (trayectoIds.length > 0) {
      // Mapeamos los IDs asegurando que se envíen en el formato exacto que espera la BD
      const inscripciones = trayectoIds.map(tId => ({
        estudiante_user: String(dniVal),
        trayecto_id: String(tId)
      }));

      const { error: errInsc } = await supabase
        .from('inscripciones')
        .insert(inscripciones);

      if (errInsc) {
        console.error('Error insertando en inscripciones:', errInsc);
        alert('⚠️ ATENCIÓN: El usuario se creó, pero la vinculación al trayecto FALLÓ por este error de Supabase:\n\n' + errInsc.message);
        return; // Detenemos para no decir que todo salió bien
      }
    }

    alert(`✅ Usuario ${nombre} ${apellido} (DNI: ${dniVal}) creado e inscripto correctamente.`);
    this.cerrarModal();
    if (typeof this.cargarUsuarios === 'function') this.cargarUsuarios();

  } catch (err) {
    console.error('Error general al crear usuario:', err);
    alert('Error inesperado: ' + (err.message || 'Consulte la consola.'));
  }
}

  async cambiarEstado(identificador, nuevoEstado) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ estado: nuevoEstado })
        .eq('usuario', identificador);

      if (error) throw error;
      this.cargarUsuarios();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  },

  async cambiarRol(identificador, nuevoRol) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ rol: nuevoRol })
        .eq('usuario', identificador);

      if (error) throw error;
    } catch (err) {
      console.error('Error al actualizar rol:', err);
    }
  }
};

UsuariosAdmin.cargarTrayectosModal = UsuariosAdmin.cargarTrayectosEnModal;
UsuariosAdmin.cargarTrayectos = UsuariosAdmin.cargarTrayectosEnModal;

window.UsuariosAdmin = UsuariosAdmin;
window.Usuarios = UsuariosAdmin;

window.crearUsuarioManual = () => UsuariosAdmin.crearUsuarioManual();
window.cerrarModal = () => UsuariosAdmin.cerrarModal();
window.abrirModal = () => UsuariosAdmin.abrirModal();
