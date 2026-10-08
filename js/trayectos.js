/* ==========================================================================
   MÓDULO DE TRAYECTOS FORMATIVOS POR CICLO LECTIVO
   Archivo: js/trayectos.js
   ========================================================================== */

const Trayectos = {
  listaTrayectos: [],

  // Popula el desplegable con el año en curso dinámico
  poblarDesplegableCiclos() {
    const selectFiltro = document.getElementById('filtro-ciclo-lectivo');
    if (!selectFiltro) return;

    const anioActual = new Date().getFullYear(); // Detecta automáticamente el año (ej: 2026, 2027...)
    const anioInicio = 2024;
    const anioFin = anioActual + 20;

    // Si el usuario ya eligió una opción guardamos esa, si no, SELECCIONAMOS EL AÑO ACTUAL POR DEFECTO
    const seleccionPrevia = selectFiltro.value;

    let opcionesHTML = `<option value="TODOS">Todos los Ciclos</option>`;

    for (let anio = anioFin; anio >= anioInicio; anio--) {
      // Marcamos 'selected' el año actual si no había selección previa
      const esAnioActual = anio === anioActual ? 'selected' : '';
      opcionesHTML += `<option value="${anio}" ${esAnioActual}>Ciclo Lectivo ${anio}</option>`;
    }

    selectFiltro.innerHTML = opcionesHTML;

    if (seleccionPrevia) {
      selectFiltro.value = seleccionPrevia;
    }
  },

  // Carga los trayectos filtrados
  async cargarTrayectos() {
    try {
      // Nos aseguramos que el selector tenga cargadas las opciones
      const selectCiclo = document.getElementById('filtro-ciclo-lectivo');
      if (selectCiclo && selectCiclo.children.length === 0) {
        this.poblarDesplegableCiclos();
      }

      const perfilRaw = localStorage.getItem('usuario_actual');
      const perfil = perfilRaw ? JSON.parse(perfilRaw) : {};
      const rolNorm = String(perfil.rol || '').toLowerCase().trim();
      const esEstudiante = rolNorm === 'estudiante';

      const cicloSeleccionado = selectCiclo ? selectCiclo.value : 'TODOS';

      if (esEstudiante) {
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
      } else {
        // Visitantes y Admins
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

    const perfilRaw = localStorage.getItem('usuario_actual');
    const perfil = perfilRaw ? JSON.parse(perfilRaw) : {};
    const rolNorm = String(perfil.rol || '').toLowerCase().trim();
    const isAdmin = rolNorm === 'admin' || rolNorm === 'administrador';

    contenedores.forEach(contenedor => {
      contenedor.innerHTML = '';

      const esVistaPublica = contenedor.id === 'lista-trayectos-cards' || contenedor.id === 'contenedor-trayectos';
       
      if (this.listaTrayectos.length === 0) {
        contenedor.innerHTML = `
          <div class="empty-state-card fade-in" style="text-align: center; padding: 3rem; background: rgba(30,41,59,0.5); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); grid-column: 1 / -1;">
            <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
            <h3 class="empty-state-title" style="color: #f8fafc; margin-bottom: 0.5rem;">No hay trayectos registrados para este ciclo</h3>
            <p class="empty-state-text" style="color: #94a3b8;">
              Podés cambiar el filtro a "Todos los Ciclos" o seleccionar otro año.
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
