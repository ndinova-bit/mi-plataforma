/* ==========================================================================
   LABORATORIO DE EMISIÓN DE CERTIFICADOS SOBRE PLANTILLA OFICIAL (PDF-LAB)
   ========================================================================== */

/**
 * Carga la plantilla PDF oficial y escribe los datos del estudiante/egresado
 * @param {Object} datos
 */
async function emitirCertificadoPDF(datos) {
  const {
    estudianteNombre,
    estudianteDNI,
    trayectoNombre,
    horas,
    numEgresado,
    modulos = [],
    fechaEgreso = new Date().toLocaleDateString('es-AR')
  } = datos;

  try {
    // 1. Cargar el PDF base de plantilla.pdf
    const response = await fetch('plantilla.pdf');
    if (!response.ok) throw new Error('No se pudo cargar plantilla.pdf desde el servidor.');
    const arrayBuffer = await response.arrayBuffer();

    const { PDFDocument, rgb, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    
    const page1 = pages[0];
    const page2 = pages[1] || null;

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Color del texto oficial (Azul oscuro / Negro)
    const colorTexto = rgb(0.05, 0.1, 0.25);

    // --- PÁGINA 1: DATOS PRINCIPALES ---
    // Nombre del Alumno (Sustituye 'Por cuanto ...')
    page1.drawText(estudianteNombre.toUpperCase(), {
      x: 180,
      y: 395,
      size: 13,
      font: fontBold,
      color: colorTexto
    });

    // DNI / DU
    if (estudianteDNI) {
      page1.drawText(String(estudianteDNI), {
        x: 140,
        y: 373,
        size: 11,
        font: fontRegular,
        color: colorTexto
      });
    }

    // Nombre del Trayecto / Curso
    page1.drawText(trayectoNombre, {
      x: 200,
      y: 285,
      size: 12,
      font: fontBold,
      color: colorTexto
    });

    // Horas de duración
    page1.drawText(String(horas || '---'), {
      x: 150,
      y: 238,
      size: 11,
      font: fontRegular,
      color: colorTexto
    });

    // Fecha de emisión/egreso (Día, Mes, Año)
    const partesFecha = fechaEgreso.split('/');
    if (partesFecha.length === 3) {
      page1.drawText(partesFecha[0], { x: 260, y: 195, size: 10, font: fontRegular, color: colorTexto });
      page1.drawText(partesFecha[1], { x: 310, y: 195, size: 10, font: fontRegular, color: colorTexto });
      page1.drawText(partesFecha[2], { x: 380, y: 195, size: 10, font: fontRegular, color: colorTexto });
    }

    // --- PÁGINA 2: MÓDULOS Y N° DE EGRESADO ---
    if (page2) {
      // Listado de módulos
      let startY = 380;
      modulos.slice(0, 10).forEach((mod, idx) => {
        page2.drawText(`${idx + 1}. ${mod.nombre || mod}`, {
          x: 100,
          y: startY - (idx * 20),
          size: 9,
          font: fontRegular,
          color: colorTexto
        });
      });

      // Fecha de egreso
      page2.drawText(fechaEgreso, {
        x: 180,
        y: 140,
        size: 10,
        font: fontRegular,
        color: colorTexto
      });

      // N° de Egresado
      if (numEgresado) {
        page2.drawText(String(numEgresado), {
          x: 180,
          y: 118,
          size: 11,
          font: fontBold,
          color: rgb(0.8, 0.1, 0.1) // Destacado en rojo o azul
        });
      }
    }

    // Guardar y descargar
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Certificado_${numEgresado ? 'Egresado_' + numEgresado + '_' : ''}${estudianteNombre.replace(/\s+/g, '_')}.pdf`;
    link.click();

    if (typeof notify === 'function') notify('Certificado generado correctamente', 'success');

  } catch (error) {
    console.error('Error al emitir certificado sobre plantilla:', error);
    alertError('Error al emitir certificado: ' + error.message);
  }
}
