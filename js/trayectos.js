/* ==========================================================================
   MÓDULO DE TRAYECTOS FORMATIVOS POR CICLO LECTIVO (CON EDICIÓN)
   Archivo: js/trayectos.js
   ========================================================================== */

const Trayectos = {
  listaTrayectos: [],

  // Popula el desplegable con el año en curso dinámico
  poblarDesplegableCiclos() {
    const selectFiltro = document.getElementById('filtro-ciclo-lectivo');
    if (!selectFiltro) return;

    const anioActual = new Date().getFullYear();
    const anioInicio = 2024;
    const anioFin = anioActual + 10;

    const seleccionPrevia = selectFiltro.value;

    let opcionesHTML = `<option value="TODOS">Todos los Ciclos</option>`;

    for (let anio = anioFin; anio >= anioInicio; anio--) {
      const esAnioActual = (anio === anioActual) ? 'selected' : '';
      opcionesHTML += `<option value="${anio}" ${esAnioActual}>Ciclo Lectivo ${anio}</option>`;
    }

    selectFiltro.innerHTML = opcionesHTML;

    if (seleccionPrevia) {
      selectFiltro.value = seleccionPrevia;
    }
  },

  // Puebla el selector de docentes en el formulario de creación/edición
  async poblarComboDocentes() {
    const selectDocente = document.getElementById('trayecto-docente');
    if (!selectDocente) return;

    try {
      const { data: docentes, error } = await supabase
        .from('usuarios')
        .select('usuario, nombre, apellido')
        .eq('rol', 'docente');

      if (error) throw error;

      selectDocente.innerHTML = '<option value="">Sin docente asignado</option>';
      (docentes || []).forEach(doc => {
        const idDocente = String(doc.usuario || '').trim();
        if (!idDocente) return;

        const nombreCompleto = `${doc.apellido || ''} ${doc.nombre || ''}`.trim() || idDocente;
        const opt = document.createElement('option');
        opt.value = idDocente;
        opt.textContent = `${nombreCompleto} (${idDocente})`;
        selectDocente.appendChild(opt);
      });
    } catch (err) {
      console.error('Error al cargar la lista de docentes:', err);
    }
  },

  // Carga los trayectos filtrados
  async cargarTrayectos() {
    try {
      const selectCiclo = document.getElementById('filtro-ciclo-lectivo');
      if (selectCiclo && selectCiclo.children.length === 0) {
        this.poblarDesplegableCiclos();
      }

      await this.poblarComboDocentes();

      // Verificamos si estamos en la vista de la Plataforma/App o en la Landing Pública
      const appScreen = document.getElementById('app-screen');
      const estaEnPlataforma = appScreen && appScreen.style.display !== 'none';

      // Solo leemos el perfil si el usuario está dentro de la plataforma logueado
      let perfil = {};
      if (estaEnPlataforma) {
        const perfilRaw = localStorage.getItem('usuario_actual') || 
                          localStorage.getItem('usuario_logueado') || 
                          sessionStorage.getItem('usuario_logueado');
        perfil = perfilRaw ? JSON.parse(perfilRaw) : {};
      }

      const rolNorm = String(perfil.rol || '').toLowerCase().trim();
      const esEstudiante = rolNorm === 'estudiante';
      const esDocente = rolNorm === 'docente';

      const anioActual = new Date().getFullYear();
      let cicloSeleccionado = selectCiclo ? selectCiclo.value : String(anioActual);

      if (estaEnPlataforma && esEstudiante) {
        const idEstudiante = perfil.usuario || perfil.dni || perfil.id;

        if (!idEstudiante) {
          this.listaTrayectos = [];
          this.renderizarTrayectos();
          return;
        }

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

        const idsTrayectos = inscripciones.map(i => i.trayecto_id);

        let query = supabase
          .from('trayectos')
          .select(`*, modulos (*)`)
          .in('id', idsTrayectos);

        if (cicloSeleccionado && cicloSeleccionado !== 'TODOS') {
          query = query.eq('ciclo_lectivo', Number(cicloSeleccionado));
        }

        const { data: trayectosEstudiante, error: errTray } = await query.order('created_at', { ascending: false });
        if (errTray) throw errTray;

        this.listaTrayectos = trayectosEstudiante || [];

      } else if (estaEnPlataforma && esDocente) {
        const posiblesIDs = [
          perfil.usuario,
          perfil.dni,
          perfil.id
        ].filter(id => id !== undefined && id !== null && String(id).trim() !== '').map(String);

        if (posiblesIDs.length === 0) {
          this.listaTrayectos = [];
          this.renderizarTrayectos();
          return;
        }

        let query = supabase
          .from('trayectos')
          .select(`*, modulos (*)`)
          .in('docente_user', posiblesIDs);

        if (cicloSeleccionado && cicloSeleccionado !== 'TODOS') {
          query = query.eq('ciclo_lectivo', Number(cicloSeleccionado));
        }

        const { data: trayectosDocente, error: errDoc } = await query.order('created_at', { ascending: false });
        if (errDoc) throw errDoc;

        this.listaTrayectos = trayectosDocente || [];

      } else {
        // Oferta pública general (Landing) o vista Administrador
        let query = supabase
          .from('trayectos')
          .select(`*, modulos (*)`);

        if (cicloSeleccionado && cicloSeleccionado !== 'TODOS') {
          query = query.eq('ciclo_lectivo', Number(cicloSeleccionado));
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        this.listaTrayectos = data || [];
      }

      this.renderizarTrayectos();
    } catch (err) {
      console.error('Error al cargar trayectos:', err);
    }
  },
   
  renderizarTrayectos() {
    const contenedores = [
      document.getElementById('lista-trayectos-cards'),
      document.getElementById('lista-trayectos-admin'),
      document.getElementById('contenedor-trayectos-estudiante'),
      document.getElementById('contenedor-trayectos')
    ].filter(el => el !== null);

    if (contenedores.length === 0) return;

    const perfilRaw = localStorage.getItem('usuario_actual') || 
                      localStorage.getItem('usuario_logueado') || 
                      sessionStorage.getItem('usuario_logueado');
    const perfil = perfilRaw ? JSON.parse(perfilRaw) : {};
    const rolNorm = String(perfil.rol || '').toLowerCase().trim();
    const isAdmin = rolNorm === 'admin' || rolNorm === 'administrador';
    const esDocente = rolNorm === 'docente';

    contenedores.forEach(contenedor => {
      contenedor.innerHTML = '';

      const esVistaPublica = contenedor.id === 'lista-trayectos-cards' || contenedor.id === 'contenedor-trayectos';
       
      if (this.listaTrayectos.length === 0) {
        contenedor.innerHTML = `
          <div class="empty-state-card fade-in" style="text-align: center; padding: 3rem; background: rgba(30,41,59,0.5); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); grid-column: 1 / -1;">
            <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
            <h3 class="empty-state-title" style="color: #f8fafc; margin-bottom: 0.5rem;">No hay trayectos disponibles para este ciclo lectivo</h3>
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

      const mostrarAccionesAdmin = isAdmin && !esVistaPublica;

      this.listaTrayectos.forEach(trayecto => {
        const card = document.createElement('div');
        card.className = 'course-card fade-in';
        card.style.background = '#1e293b';
        card.style.borderRadius = '12px';
        card.style.padding = '1.5
