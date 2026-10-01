const Trayectos = {
  listaTrayectos: [],

  async cargarTrayectos() {
    try {
      const { data, error } = await supabase
        .from('trayectos')
        .select(`
          *,
          modulos (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.listaTrayectos = data || [];
      this.renderizerTrayectos();
    } catch (err) {
      console.error('Error al cargar trayectos:', err);
      if (typeof alertError === 'function') {
        alertError('Error', 'No se pudieron cargar los trayectos formativos.');
      }
    }
  },

  renderizarTrayectos() {
    const contenedor = document.getElementById('lista-trayectos-cards');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    // Amiga ti No hay trayectos
    if (this.listaTrayectos.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state-card fade-in">
          <div class="empty-state-icon">
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3 class="empty-state-title">No hay trayectos publicados aún</h3>
          <p class="empty-state-text">
            Estamos preparando la nueva oferta académica. Volvé a consultar pronto para conocer los próximos cursos e inscripciones.
          </p>
        </div>
      `;
      return;
    }

    // Modern Grid Layout
    const grid = document.createElement('div');
    grid.className = 'trayectos-grid';

    this.listaTrayectos.forEach(trayecto => {
      const card = document.createElement('div');
      card.className = 'course-card fade-in';

      let modulosHTML = '';
      if (trayecto.modulos && trayecto.modulos.length > 0) {
        modulosHTML = trayecto.modulos.map(m => `
          <div class="modulo-card" style="margin-top: 0.5rem; background: rgba(15, 20, 28, 0.6); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem;">
            <strong style="color: var(--text-main); font-size: 0.9rem;">${m.nombre}</strong> 
            <span style="color: var(--accent-gold); font-size: 0.8rem;">(${m.codigo || 'S/C'})</span>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
              📅 Inicio: ${m.fecha_inicio || 'A definir'} | Fin: ${m.fecha_fin || 'A definir'}
            </div>
          </div>
        `).join('');
      } else {
        modulosHTML = '<small style="color: var(--text-muted);">Sin módulos asignados</small>';
      }

      const cantidadModulos = trayecto.modulos ? trayecto.modulos.length : 0;

      card.innerHTML = `
        <div>
          <div class="course-header">
            <div class="course-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
              </svg>
            </div>
            <div>
              <h3 class="course-title">${trayecto.nombre}</h3>
              <span style="font-size: 0.8rem; color: var(--text-gold); font-weight: 600;">
                Sector: ${trayecto.sector || 'General'}
              </span>
            </div>
          </div>

          <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.5;">
            ${trayecto.descripcion || 'Sin descripción disponible.'}
          </p>

          <div class="course-meta">
            <span>📚 ${cantidadModulos} Módulo(s)</span>
          </div>

          <div style="margin-top: 1rem;">
            <h4 style="font-size: 0.85rem; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem;">
              Módulos del Trayecto:
            </h4>
            ${modulosHTML}
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    contenedor.appendChild(grid);
  },

  async guardarTrayecto() {
    const nombre = document.getElementById('trayecto-nombre').value.trim();
    const sector = document.getElementById('trayecto-sector').value.trim();
    const descripcion = document.getElementById('trayecto-descripcion').value.trim();

    if (!nombre) {
      if (typeof alertError === 'function') {
        alertError('Campo requerido', 'El nombre del trayecto es obligatorio.');
      }
      return;
    }

    try {
      // 1. Insertar Trayecto
      const { data: trayectoGuardado, error: errTrayecto } = await supabase
        .from('trayectos')
        .insert([{ nombre, sector, descripcion }])
        .select()
        .single();

      if (errTrayecto) throw errTrayecto;

      // 2. Recolectar módulos cargados en el formulario
      const modulosCards = document.querySelectorAll('#contenedor-modulos .modulo-card');
      const modulosAInsertar = [];

      modulosCards.forEach(card => {
        const modNombre = card.querySelector('.mod-nombre').value.trim();
        const modCodigo = card.querySelector('.mod-codigo').value.trim();
        const modInicio = card.querySelector('.mod-inicio').value;
        const modFin = card.querySelector('.mod-fin').value;

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

      // 3. Insertar módulos si existen
      if (modulosAInsertar.length > 0) {
        const { error: errModulos } = await supabase
          .from('modulos')
          .insert(modulosAInsertar);

        if (errModulos) throw errModulos;
      }

      if (typeof alertSuccess === 'function') {
        alertSuccess('¡Éxito!', 'El trayecto y sus módulos fueron registrados correctamente.');
      }
      document.getElementById('form-trayecto').reset();
      
      // Limpiar contenedor de módulos dejando uno solo vacío
      document.getElementById('contenedor-modulos').innerHTML = '';
      if (typeof UI !== 'undefined' && UI.agregarFilaModulo) {
        UI.agregarFilaModulo();
      }

      this.cargarTrayectos();

    } catch (err) {
      console.error('Error al guardar:', err);
      if (typeof alertError === 'function') {
        alertError('Error', err.message || 'No se pudo guardar el trayecto.');
      }
    }
  }
};
