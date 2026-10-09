const ClasesModulo = {
  trayectoActualId: null,

  async abrirGestor(trayectoId, nombreTrayecto) {
    this.trayectoActualId = trayectoId
    
    // Crear el modal dinámicamente si no existe en el DOM
    let modal = document.getElementById('modal-gestor-clases')
    if (!modal) {
      modal = document.createElement('div')
      modal.id = 'modal-gestor-clases'
      modal.className = 'modal'
      modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center; padding:1rem;'
      document.body.appendChild(modal)
    }

    modal.innerHTML = `
      <div style="background:#1e293b; border:1px solid rgba(255,255,255,0.1); border-radius:12px; width:100%; max-width:800px; max-height:90vh; display:flex; flex-direction:column; overflow:hidden; color:#f8fafc;">
        <div style="padding:1.2rem 1.5rem; background:#0f172a; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:1.2rem;">📚 Clases y Actividades: <span style="color:#38bdf8;">${nombreTrayecto}</span></h3>
          <button onclick="ClasesModulo.cerrarGestor()" style="background:none; border:none; color:#94a3b8; font-size:1.5rem; cursor:pointer;">&times;</button>
        </div>

        <div style="padding:1.5rem; overflow-y:auto; flex:1;">
          <!-- Formulario para Nueva Clase -->
          <details style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:1rem; margin-bottom:1.5rem;">
            <summary style="cursor:pointer; font-weight:600; color:#38bdf8;">➕ Cargar Nueva Clase / Recurso</summary>
            <form onsubmit="ClasesModulo.guardarClase(event)" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.8rem;">
              <input type="text" id="clase-titulo" placeholder="Título de la Clase (ej: Clase 1: HTML Básico)" required class="form-control" style="width:100%; padding:0.6rem; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px;">
              <textarea id="clase-descripcion" placeholder="Descripción breve o consigna..." rows="2" class="form-control" style="width:100%; padding:0.6rem; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px;"></textarea>
              <input type="url" id="clase-url" placeholder="Link al recurso (Google Drive, YouTube, etc.)" class="form-control" style="width:100%; padding:0.6rem; background:#0f172a; border:1px solid #334155; color:#fff; border-radius:6px;">
              <button type="submit" class="btn btn-gold" style="align-self:flex-end; padding:0.5rem 1.2rem; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer;">Guardar Clase</button>
            </form>
          </details>

          <!-- Listado de Clases Cargadas -->
          <div id="lista-clases-cargadas">
            <p style="color:#94a3b8; text-align:center;">Cargando clases...</p>
          </div>
        </div>
      </div>
    `

    modal.style.display = 'flex'
    await this.cargarListaClases()
  },

  cerrarGestor() {
    const modal = document.getElementById('modal-gestor-clases')
    if (modal) modal.style.display = 'none'
  },

  async cargarListaClases() {
    const contenedor = document.getElementById('lista-clases-cargadas')
    if (!contenedor) return

    try {
      const { data: clases, error } = await supabase
        .from('clases')
        .select('*')
        .eq('trayecto_id', this.trayectoActualId)
        .order('orden', { ascending: true })

      if (error) throw error

      if (!clases || clases.length === 0) {
        contenedor.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:1rem;">Aún no se han publicado clases para este trayecto.</p>'
        return
      }

      contenedor.innerHTML = clases.map((c, index) => `
        <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:1rem; margin-bottom:0.8rem; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h4 style="margin:0 0 0.3rem 0; color:#f8fafc; font-size:1rem;">#${index + 1} - ${c.titulo}</h4>
            <p style="margin:0 0 0.5rem 0; color:#cbd5e1; font-size:0.85rem;">${c.descripcion || 'Sin descripción'}</p>
            ${c.url_recurso ? `<a href="${c.url_recurso}" target="_blank" style="color:#38bdf8; font-size:0.82rem; text-decoration:none;">🔗 Ver Recurso Adjunto</a>` : ''}
          </div>
          <button onclick="ClasesModulo.eliminarClase(${c.id})" style="background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#f87171; border-radius:6px; padding:0.3rem 0.6rem; cursor:pointer; font-size:0.8rem;">🗑️</button>
        </div>
      `).join('')

    } catch (err) {
      console.error('Error al cargar clases:', err)
      contenedor.innerHTML = '<p style="color:#f87171; text-align:center;">Error al cargar las clases.</p>'
    }
  },

  async guardarClase(e) {
    if (e) e.preventDefault()

    const titulo = document.getElementById('clase-titulo')?.value.trim()
    const descripcion = document.getElementById('clase-descripcion')?.value.trim()
    const url = document.getElementById('clase-url')?.value.trim()

    if (!titulo) {
      alert('Por favor ingresá al menos el título de la clase.')
      return
    }

    try {
      const { error } = await supabase
        .from('clases')
        .insert([{
          trayecto_id: this.trayectoActualId,
          titulo: titulo,
          descripcion: descripcion,
          url_recurso: url
        }])

      if (error) throw error

      alert('✅ Clase publicada correctamente.')
      document.getElementById('clase-titulo').value = ''
      document.getElementById('clase-descripcion').value = ''
      document.getElementById('clase-url').value = ''
      
      await this.cargarListaClases()

    } catch (err) {
      console.error('Error al guardar clase:', err)
      alert('Error al guardar la clase: ' + err.message)
    }
  },

  async eliminarClase(idClase) {
    if (!confirm('¿Querés eliminar esta clase?')) return

    try {
      const { error } = await supabase
        .from('clases')
        .delete()
        .eq('id', idClase)

      if (error) throw error
      await this.cargarListaClases()
    } catch (err) {
      console.error('Error al eliminar clase:', err)
      alert('Error al eliminar la clase: ' + err.message)
    }
  }
}

window.ClasesModulo = ClasesModulo
