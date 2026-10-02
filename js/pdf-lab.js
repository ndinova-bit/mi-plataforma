/* ==========================================================================
   LABORATORIO DE IMPRESIÓN Y EMISIÓN DE CERTIFICADOS (PDF-LAB)
   ========================================================================== */

/**
 * Genera y descarga el certificado PDF oficial usando pdf-lib
 * @param {Object} datosCertificado
 */
async function emitirCertificadoPDF(datosCertificado) {
  const {
    estudianteNombre,
    estudianteDNI,
    trayectoNombre,
    horas,
    resolucion,
    cursoNum,
    fechaEmision
  } = datosCertificado;

  try {
    const { PDFDocument, rgb, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Apagado / Horizontal
    
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Marco exterior decorativo
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderWidth: 2,
      borderColor: rgb(0.06, 0.71, 0.83), // Accent Cyan
      color: rgb(0.98, 0.98, 0.99)
    });

    // Encabezado
    page.drawText('DIRECCIÓN GENERAL DE CULTURA Y EDUCACIÓN - PBA', {
      x: 180, y: 520, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText('CENTRO DE FORMACIÓN PROFESIONAL N° 403 LUJÁN', {
      x: 150, y: 490, size: 18, font: fontBold, color: rgb(0.05, 0.15, 0.3)
    });

    // Subtítulo
    page.drawText('OTORGA EL PRESENTE CERTIFICADO A:', {
      x: 280, y: 420, size: 11, font: fontRegular, color: rgb(0.4, 0.4, 0.4)
    });

    // Nombre del Alumno
    page.drawText(estudianteNombre.toUpperCase(), {
      x: 160, y: 375, size: 20, font: fontBold, color: rgb(0.02, 0.5, 0.9)
    });

    if (estudianteDNI) {
      page.drawText(`D.N.I. N°: ${estudianteDNI}`, {
        x: 160, y: 355, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3)
      });
    }

    // Cuerpo del Certificado
    page.drawText(`Por haber aprobado el Trayecto Formativo / Curso:`, {
      x: 160, y: 310, size: 12, font: fontRegular, color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText(trayectoNombre, {
      x: 160, y: 285, size: 15, font: fontBold, color: rgb(0.1, 0.1, 0.1)
    });

    // Datos Técnicos y Normativos provenientes del alta de Trayectos
    page.drawText(`Carga Horaria: ${horas || '-'} Hs. Reloj   |   Resolución: ${resolucion || 'S/D'}`, {
      x: 160, y: 240, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3)
    });

    if (cursoNum) {
      page.drawText(`Reg. Curso N°: ${cursoNum}`, {
        x: 160, y: 220, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3)
      });
    }

    // Pie de página y fecha
    const fechaTexto = fechaEmision || 'Luján, Provincia de Buenos Aires';
    page.drawText(fechaTexto, {
      x: 160, y: 150, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3)
    });

    // Descargar PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Certificado_${estudianteNombre.replace(/\s+/g, '_')}.pdf`;
    link.click();

  } catch (error) {
    console.error('Error al generar certificado:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error en PDF-Lab',
      text: 'No se pudo generar el documento: ' + error.message
    });
  }
}
