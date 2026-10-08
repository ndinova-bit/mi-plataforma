const UsuariosAdmin = {
  estaProcesando: false,

  
    hashPassword(pass) {
    if (!pass) return '';
    return typeof CryptoJS !== 'undefined' 
      ? CryptoJS.SHA256(pass).toString() 
      : pass;
  },

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
      const form = document.getElementById('form-alta-usuario');
      if (form) form.reset();
    }
    this.estaProcesando = false;
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
        .select('id, nombre, apellido, usuario, email, rol, estado')
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
        const idPrimario = u.id || u.usuario;
        const textoMostrarUsuario = u.usuario || u.id;

        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 0.85rem 0.75rem;">
              <strong style="color: #f8fafc; font-size: 0.95rem;">${nombreCompleto}</strong><br>
              <span style="font-size: 0.8rem; color: #94a3b8;">Usuario / DNI: ${textoMostrarUsuario}</span>
            </td>
            <td style="padding: 0.85rem 0.75rem; font-size: 0.85rem; color: #cbd5e1;">
              ${u.email || 'Sin correo'}
            </td>
            <td style="padding: 0.85rem 0.75rem;">
              <select class="form-control" style="padding: 0.3rem 0.5rem; font-size: 0.85rem; width: auto;" onchange="UsuariosAdmin.cambiarRol('${idPrimario}', this.value)">
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
            <td style="padding: 0.85rem 0.75rem; text-align: right; display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center;">
              ${!esActivo ? `
                <button class="btn btn-gold" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;" onclick="UsuariosAdmin.cambiarEstado('${idPrimario}', 'ACTIVO')">
                  ✓ Aprobar
                </button>
              ` : `
                <button class="btn btn-danger" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;" onclick="UsuariosAdmin.cambiarEstado('${idPrimario}', 'PENDIENTE')">
                  🔒 Inhabilitar
                </button>
              `}
              <button title="Eliminar definitivamente" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; border-radius: 6px; cursor: pointer;" onclick="UsuariosAdmin.eliminarUsuario('${idPrimario}', '${nombreCompleto.replace(/'/g, "\\'")}')">
                🗑️
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
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
      console.error('Error al cargar trayectos:', err);
      contenedor.innerHTML = '<span style="color: #f87171; font-size: 0.85rem;">Error al obtener trayectos.</span>';
    }
  },

  async crearUsuarioManual(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    if (this.estaProcesando) return;
    this.estaProcesando = true;

    const apellido = document.getElementById('usr-alta-apellido')?.value.trim().toUpperCase();
    const nombre = document.getElementById('usr-alta-nombre')?.value.trim().toUpperCase();
    const dniVal = document.getElementById('usr-alta-dni')?.value.trim();
    const email = document.getElementById('usr-alta-email')?.value.trim().toUpperCase();
    const rol = document.getElementById('usr-alta-rol')?.value || 'estudiante';

    if (!nombre || !apellido || !dniVal) {
      alert('Por favor completá Nombre, Apellido y DNI.');
      this.estaProcesando = false;
      return;
    }

    try {
      const passHash = this.hashPassword(dniVal);

      const nuevoUsuario = {
        nombre: nombre,
        apellido: apellido,
        usuario: dniVal,
        pass: passHash,
        rol: rol,
        estado: 'ACTIVO'
      };

      if (email) nuevoUsuario.email = email;

      const { data: usrCreado, error: errUsr } = await supabase
        .from('usuarios')
        .insert([nuevoUsuario])
        .select();

      if (errUsr) {
        alert('Error al crear usuario: ' + errUsr.message);
        this.estaProcesando = false;
        return;
      }

      const checkboxes = document.querySelectorAll('input[name="trayectos_seleccionados"]:checked');
      const trayectoIds = Array.from(checkboxes).map(cb => cb.value);

      if (trayectoIds.length > 0) {
        const inscripciones = trayectoIds.map(tId => ({
          estudiante_user: String(dniVal),
          trayecto_id: Number(tId)
        }));

        const { error: errInsc } = await supabase
          .from('inscripciones')
          .insert(inscripciones);

        if (errInsc) {
          alert('⚠️ Usuario creado pero falló la inscripción: ' + errInsc.message);
          this.estaProcesando = false;
          return;
        }
      }

      alert(`✅ Usuario ${nombre} ${apellido} guardado correctamente.`);
      this.cerrarModal();
      this.cargarUsuarios();

    } catch (err) {
      console.error('Error general:', err);
      alert('Error inesperado: ' + (err.message || 'Consulte la consola.'));
    } finally {
      this.estaProcesando = false;
    }
  },

  async cambiarEstado(identificador, nuevoEstado) {
    try {
      const idStr = String(identificador);
      const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);

      let query = supabase.from('usuarios').update({ estado: nuevoEstado });
      query = esUUID ? query.eq('id', idStr) : query.eq('usuario', idStr);

      const { error } = await query;
      if (error) throw error;
      this.cargarUsuarios();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  },

  async cambiarRol(identificador, nuevoRol) {
    try {
      const idStr = String(identificador);
      const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);

      let query = supabase.from('usuarios').update({ rol: nuevoRol });
      query = esUUID ? query.eq('id', idStr) : query.eq('usuario', idStr);

      const { error } = await query;
      if (error) throw error;
    } catch (err) {
      console.error('Error al actualizar rol:', err);
    }
  },

async eliminarUsuario(identificador, nombreMostrar) {
    const usuarioABorrar = nombreMostrar || identificador;
    const confirmar = confirm(`⚠️ ¿Estás seguro de que querés eliminar definitivamente a "${usuarioABorrar}"?\nEsta acción no se puede deshacer.`);
    if (!confirmar) return;

    try {
      const idStr = String(identificador);

      // 1. Leemos la sesión si existe para obtener la contraseña si estuviera guardada
      const sesionRaw = localStorage.getItem('usuario_actual') || localStorage.getItem('usuario_logueado') || sessionStorage.getItem('usuario_logueado');
      const perfil = sesionRaw ? JSON.parse(sesionRaw) : {};
      const passAdmin = perfil.passHash || perfil.pass || perfil.password || '';

      // 2. Intentamos primero borrar por la función RPC de Supabase
      let { error } = await supabase.rpc('eliminar_usuario_admin', { 
        p_id: idStr,
        p_admin_pass: passAdmin
      });

      // 3. Si la RPC falla o no encuentra el procedimiento, ejecutamos la consulta directa a la tabla
      if (error) {
        console.warn('RPC no disponible o rechazada, ejecutando borrado directo:', error.message);
        const resDirect = await supabase
          .from('usuarios')
          .delete()
          .eq('id', idStr);
        
        error = resDirect.error;
      }

      if (error) throw error;

      alert(`🗑️ Usuario "${usuarioABorrar}" eliminado correctamente.`);
      
      // Recargar la tabla de usuarios
      if (typeof this.cargarUsuarios === 'function') {
        await this.cargarUsuarios();
      } else if (typeof UsuariosAdmin !== 'undefined' && UsuariosAdmin.cargarUsuarios) {
        await UsuariosAdmin.cargarUsuarios();
      }

    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      alert('Error al eliminar usuario: ' + (err.message || 'Ocurrió un problema de conexión.'));
    }
  }
};

// Escuchador para el formulario de alta
document.addEventListener('submit', function(e) {
  if (e.target && e.target.id === 'form-alta-usuario') {
    e.preventDefault();
    UsuariosAdmin.crearUsuarioManual(e);
  }
});

UsuariosAdmin.cargarTrayectosModal = UsuariosAdmin.cargarTrayectosEnModal;
UsuariosAdmin.cargarTrayectos = UsuariosAdmin.cargarTrayectosEnModal;

window.UsuariosAdmin = UsuariosAdmin;
window.Usuarios = UsuariosAdmin;
window.crearUsuarioManual = (e) => UsuariosAdmin.crearUsuarioManual(e);
window.cerrarModal = () => UsuariosAdmin.cerrarModal();
window.abrirModal = () => UsuariosAdmin.abrirModal();
