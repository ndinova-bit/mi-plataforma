/* ==========================================================================
   MÓDULO DE TRAYECTOS FORMATIVOS
   Archivo: js/trayectos.js
   ========================================================================== */

const Trayectos = {
  listaTrayectos: [],

  // Carga los trayectos según el rol del usuario (Administrador vs Estudiante)
  async cargarTrayectos() {
    try {
      const perfilRaw = localStorage.getItem('usuario_actual');
      const perfil = perfilRaw ? JSON.parse(perfilRaw) : {};
      const rolNorm = String(perfil.rol || '').toLowerCase().trim();
      const esEstudiante = rolNorm === 'estudiante';

      // Si el usuario es Estudiante, traemos solo los trayectos a los que está inscripto
      if (esEstudiante) {
        const idEstudiante = perfil.usuario || perfil.dni || perfil.id;

        if (!idEstudiante) {
          console.warn('No se detectó un usuario válido en la sesión.');
          this.listaTrayectos = [];
          this.renderizarTrayectos();
          return;
        }

        // 1. Consultar inscripciones del estudiante
        const { data: inscripciones, error: errInsc } = await supabase
          .from('inscripciones')
          .select('trayecto_id')
          .eq('estudiante_user', String(idEstudiante));

        if (errInsc) throw errInsc;

        if (!inscripciones || inscripciones.length === 0) {
          this.listaTrayectos = [];
          this.renderizarTrayectos();
          return;
        }

        // 2. Traer la información completa de esos trayectos y sus módulos
        const idsTrayectos = inscripciones.map(i => i.trayecto_id);

        const { data: trayectosEstudiante, error: errTray } = await supabase
          .from('trayectos')
          .select(`
            *,
            modulos (*)
          `)
          .in('id', idsTrayectos)
          .order('created_at', { ascending: false });

        if (errTray) throw errTray;

        this.listaTrayectos = trayectosEstudiante || [];
      } else {
        // Para visitantes públicos o Admins, cargar toda la oferta académica
        const { data, error } = await supabase
          .from('trayectos')
          .select(`
            *,
            modulos (*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        this.listaTrayectos = data || [];
      }

      this.renderizarTrayectos();
    } catch (err) {
      console.error('Error al cargar trayectos:', err);
      if (typeof alertError === 'function') {
        alertError('Error', 'No se pudieron cargar los trayectos formativos.');
      }
    }
  },

  // Renderiza las tarjetas de trayectos
  renderizarTrayectos() {
    const contenedores = [
      document.getElementById('lista-trayectos-cards'),
      document.getElementById('lista-trayectos-admin'),
      document.getElementById('contenedor-trayectos-estudiante'),
      document.getElementById('contenedor-trayectos')
    ].filter(el => el !== null);

    if (contenedores.length === 0) return;

    // Verificar si el usuario actual es Administrador
    const perfilRaw = localStorage.getItem('usuario_actual');
    const perfil = perfilRaw ? JSON.parse(perfilRaw) : {};
    const rolNorm = String(perfil.rol || '').toLowerCase().trim();
    const isAdmin = rolNorm === 'admin' || rolNorm === 'administrador';

    contenedores.forEach(contenedor => {
      contenedor.innerHTML = '';

      // ÚNICAMENTE la landing pública (sin sesión de usuario) usará la vista simplificada
      const esVistaPublica = contenedor.id === 'lista-trayectos-cards' || contenedor.id === 'contenedor-trayectos';
       
      if (this.listaTrayectos.length === 0) {
        contenedor.innerHTML = `
          <div class="empty-state-card fade-in" style="text-align: center; padding: 3rem; background: rgba(30,41,59,0.5); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); grid-column: 1 / -1;">
            <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
            <h3 class="empty-state-title" style="color: #f8fafc; margin-bottom: 0.5rem;">No hay trayectos disponibles</h3>
            <p class="empty-state-text" style="color: #94a3b8;">
              Ponate en contacto con la administración del CFP para más información.
            </p>
          </div>
        `;
        return;
      }

      const grid = document.createElement('div');
      grid.className = 'trayectos-grid';
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
      grid.style.gap = '1.5rem';
      grid.style.width = '100%';

      this.listaTrayectos.forEach(trayecto => {
        const card = document.createElement('div');
        card.className = 'course-card fade-in';
        card.style.background = '#1e293b';
        card.style.borderRadius = '12px';
        card.style.padding = '1.5rem';
        card.style.border = '1px solid rgba(255,255,255,0.1)';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';

        const accionesAdmin = isAdmin ? `
          <div style="margin-top: 1.25rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="btn btn-outline" style="padding: 0.3rem 0.7rem; font-size: 0.8rem;" onclick="Trayectos.eliminarTrayecto('${trayecto.id}')">
              🗑️ Eliminar
            </button>
          </div>
        ` : '';

        if (esVistaPublica) {
          // --- TARJETA CORTA (Solo para la Web pública antes de ingresar) ---
          card.innerHTML = `
            <div>
              <div style="margin-bottom: 0.75rem;">
                <h3 style="color: #f8fafc; margin: 0; font-size: 1.2rem; font-weight: 600;">${trayecto.nombre}</h3>
              </div>

              <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.75rem; line-height: 1.4;">
                ${trayecto.descripcion || 'Sin descripción disponible.'}
              </p>

              ${trayecto.requisitos ? `
                <div style="background: rgba(251, 191, 36, 0.08); border-left: 3px solid #fbbf24; padding: 0.5rem 0.75rem; border-radius: 4px;">
                  <strong style="color: #fbbf24; font-size: 0.75rem; display: block;">📋 Requisitos:</strong>
                  <span style="color: #f8fafc; font-size: 0.8rem;">${trayecto.requisitos}</span>
                </div>
              ` : ''}
            </div>
            ${accionesAdmin}
          `;
        } else {
          // --- TARJETA COMPLETA (Para Admin y Estudiantes dentro de la plataforma) ---
          let modulosHTML = '';
          if (trayecto.modulos && trayecto.modulos.length > 0) {
            modulosHTML = trayecto.modulos.map(m => `
              <div class="modulo-card" style="margin-top: 0.5rem; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.6rem 0.8rem;">
                <strong style="color: #f8fafc; font-size: 0.85rem;">${m.nombre}</strong> 
                <span style="color: #fbbf24; font-size: 0.75rem;">(${m.codigo || 'S/C'})</span>
                <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem;">
                  📅 ${m.fecha_inicio || 'A definir'} | ${m.fecha_fin || 'A definir'}
                </div>
              </div>
            `).join('');
          } else {
            modulosHTML = '<small style="color: #94a3b8;">Sin módulos asignados</small>';
          }

          const cantidadModulos = trayecto.modulos ? trayecto.modulos.length : 0;

          card.innerHTML = `
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                  <h3 style="color: #f8fafc; margin: 0; font-size: 1.2rem; font-weight: 600;">${trayecto.nombre}</h3>
                  <span style="font-size: 0.8rem; color: #fbbf24; font-weight: 600;">
                    Sector: ${trayecto.sector || 'General'}
                  </span>
                </div>
              </div>

              ${trayecto.certificacion || trayecto.resolucion ? `
                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.75rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 6px;">
                  📜 <strong>Certificación:</strong> ${trayecto.certificacion || 'S/D'}<br>
                  📑 <strong>Resolución:</strong> ${trayecto.resolucion || 'S/D'}
                </div>
              ` : ''}

              <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.75rem; line-height: 1.4;">
                ${trayecto.descripcion || 'Sin descripción disponible.'}
              </p>

              ${trayecto.requisitos ? `
                <div style="background: rgba(251, 191, 36, 0.08); border-left: 3px solid #fbbf24; padding: 0.5rem 0.75rem; border-radius: 4px; margin-bottom: 0.75rem;">
                  <strong style="color: #fbbf24; font-size: 0.75rem; display: block;">📋 Requisitos:</strong>
                  <span style="color: #f8fafc; font-size: 0.8rem;">${trayecto.requisitos}</span>
                </div>
              ` : ''}

              <div style="font-size: 0.8rem; color: #38bdf8; font-weight: 600; margin-bottom: 0.5rem;">
                📚 ${cantidadModulos} Módulo(s)
              </div>

              <div style="margin-top: 0.5rem;">
                ${modulosHTML}
              </div>
            </div>
            ${accionesAdmin}
          `;
        }

        grid.appendChild(card);
      });

      contenedor.appendChild(grid);
    });
  },

  // Guarda un nuevo trayecto y sus módulos en Supabase
  async guardarTrayecto() {
    const nombre = document.getElementById('trayecto-nombre')?.value.trim();
    const sector = document.getElementById('trayecto-sector')?.value.trim();
    const certificacion = document.getElementById('trayecto-certificacion')?.value.trim() || '';
    const resolucion = document.getElementById('trayecto-resolucion')?.value.trim() || '';
    const descripcion = document.getElementById('trayecto-descripcion')?.value.trim() || '';
    const requisitos = document.getElementById('trayecto-requisitos')?.value.trim() || '';

    if (!nombre) {
      if (typeof alertError === 'function') {
        alertError('Campo requerido', 'El nombre del trayecto es obligatorio.');
      } else {
        alert('El nombre del trayecto es obligatorio.');
      }
      return;
    }

    try {
      // 1. Guardar el Trayecto principal
      const { data: trayectoGuardado, error: errTrayecto } = await supabase
        .from('trayectos')
        .insert([{ nombre, sector, certificacion, resolucion, descripcion, requisitos }])
        .select()
        .single();

      if (errTrayecto) throw errTrayecto;

      // 2. Extraer los datos de las filas de módulos
      const modulosCards = document.querySelectorAll('#contenedor-modulos .modulo-card, #contenedor-modulos .modulo-item-card');
      const modulosAInsertar = [];

      modulosCards.forEach(card => {
        const modNombre = card.querySelector('.mod-nombre')?.value.trim();
        const modCodigo = card.querySelector('.mod-codigo')?.value.trim();
        const modInicio = card.querySelector('.mod-inicio')?.value || null;
        const modFin = card.querySelector('.mod-fin')?.value || null;

        if (modNombre) {
          modulosAInsertar.push({
            trayecto_id: trayectoGuardado.id,
            nombre: modNombre,
            codigo: modCodigo,
            fecha_inicio: modInicio || null,
            fecha_fin: modFin || null
          });
        }
      });

      // 3. Insertar módulos asociados
      if (modulosAInsertar.length > 0) {
        const { error: errModulos } = await supabase
          .from('modulos')
          .insert(modulosAInsertar);

        if (errModulos) throw errModulos;
      }

      if (typeof alertSuccess === 'function') {
        alertSuccess('¡Éxito!', 'El trayecto y sus módulos fueron registrados correctamente.');
      } else {
        alert('Trayecto guardado con éxito.');
      }
      
      // Resetear el formulario
      const form = document.getElementById('form-trayecto');
      if (form) form.reset();

      const contenedorMod = document.getElementById('contenedor-modulos');
      if (contenedorMod) contenedorMod.innerHTML = '';
      if (typeof UI !== 'undefined' && UI.agregarFilaModulo) {
        UI.agregarFilaModulo();
      }

      // Recargar datos y navegar
      await this.cargarTrayectos();

      if (typeof UI !== 'undefined' && UI.showTab) {
        UI.showTab('trayectos');
      }

    } catch (err) {
      console.error('Error al guardar trayecto:', err);
      if (typeof alertError === 'function') {
        alertError('Error', err.message || 'No se pudo guardar el trayecto.');
      } else {
        alert('Error al guardar: ' + (err.message || 'Error de conexión'));
      }
    }
  },

  // Elimina un trayecto por su ID
  async eliminarTrayecto(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este trayecto? Esta acción borra también sus módulos asociados.')) {
      return;
    }
try {
      const { error } = await supabase
        .from('trayectos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (typeof notify === 'function') notify('success', 'Trayecto eliminado correctamente');
      await this.cargarTrayectos();
    } catch (err) {
      console.error('Error al eliminar trayecto:', err);
      if (typeof alertError === 'function') alertError('Error', 'No se pudo eliminar el trayecto.');
    }
  }
}; // <-- Cierra el objeto Trayectos

// Evento fuera del objeto Trayectos
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Trayectos !== 'undefined' && Trayectos.cargarTrayectos) {
    Trayectos.cargarTrayectos();
  }
});

// Exportación global doble para garantizar retrocompatibilidad
window.Trayectos = Trayectos;
window.TrayectosAdmin = Trayectos;
