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
      this.renderizarTrayectos();
    } catch (err) {
      console.error('Error al cargar trayectos:', err);
      alertError('Error', 'No se pudieron cargar los trayectos formativos.');
    }
  },

  renderizarTrayectos() {
    const contenedor = document.getElementById('lista-trayectos-cards');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (this.listaTrayectos.length === 0) {
      contenedor.innerHTML = '<p class="text-muted">No hay trayectos publicados aún.</p>';
      return;
    }

    this.listaTrayectos.forEach(trayecto => {
      const card = document.createElement('div');
      card.className = 'card';
      
      let modulosHTML = '';
      if (trayecto.modulos && trayecto.modulos.length > 0) {
        modulosHTML = trayecto.modulos.map(m => `
          <div class="modulo-card">
            <strong>${m.nombre}</strong> (${m.codigo || 'S/C'})
            <br>
            <small>Inicio: ${m.fecha_inicio || 'A definir'} | Fin: ${m.fecha_fin || 'A definir'}</small>
          </div>
        `).join('');
      } else {
        modulosHTML = '<small class="text-muted">Sin módulos asignados</small>';
      }

      card.innerHTML = `
        <h3>${trayecto.nombre}</h3>
        <p><strong>Sector:</strong> ${trayecto.sector || 'General'}</p>
        <p>${trayecto.descripcion || ''}</p>
        <hr style="margin: 1rem 0; border: none; border-top: 1px solid var(--border);">
        <h4>Módulos:</h4>
        ${modulosHTML}
      `;

      contenedor.appendChild(card);
    });
  },

  async guardarTrayecto() {
    const nombre = document.getElementById('trayecto-nombre').value.trim();
    const sector = document.getElementById('trayecto-sector').value.trim();
    const descripcion = document.getElementById('trayecto-descripcion').value.trim();

    if (!nombre) {
      alertError('Campo requerido', 'El nombre del trayecto es obligatorio.');
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

      alertSuccess('¡Éxito!', 'El trayecto y sus módulos fueron registrados correctamente.');
      document.getElementById('form-trayecto').reset();
      
      // Limpiar contenedor de módulos dejando uno solo vacío
      document.getElementById('contenedor-modulos').innerHTML = '';
      UI.agregarFilaModulo();

      this.cargarTrayectos();

    } catch (err) {
      console.error('Error al guardar:', err);
      alertError('Error', err.message || 'No se pudo guardar el trayecto.');
    }
  }
};
