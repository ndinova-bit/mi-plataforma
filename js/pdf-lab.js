/* ==========================================================================
   js/pdf-lab.js - Generación de Certificados PDF
   ========================================================================== */

async function generarCertificadoPDF_v3(trayectoJson, alumnoNombre, usuarioDni, inscripcionId) {
  try {
    const trayecto = typeof trayectoJson === 'object' ? trayectoJson : JSON.parse(decodeURIComponent(trayectoJson));
    const alumno = decodeURIComponent(alumnoNombre);

    const inputNumEg = document.getElementById(`num-eg-${inscripcionId}`);
    let numEgresadoDef = inputNumEg ? inputNumEg.value.trim() : '';

    if (!numEgresadoDef) {
      const { value: egVal } = await Swal.fire({
        title: 'N° de Egresado',
        input: 'text',
        inputValue: '01',
        inputLabel: 'Ingrese N° de Egresado asignado:',
        showCancelButton: true
      });
      if (!egVal) return;
      numEgresadoDef = egVal;
    }

    const { value: fEgreso } = await Swal.fire({
      title: 'Fecha de Egreso',
      input: 'text',
      inputValue: '27 de Noviembre de 2026',
      inputLabel: 'Ingrese Fecha de Egreso para el acta:',
      showCancelButton: true
    });
    if (!fEgreso) return;

    let dniFormateado = String(usuarioDni).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    if (!dniFormateado) {
      const { value: dniManual } = await Swal.fire({
        title: 'DNI / D.U.',
        input: 'text',
        inputValue: '12345678',
        inputLabel: 'Ingrese el DNI/D.U. del alumno:',
        showCancelButton: true
      });
      if (!dniManual) return;
      dniFormateado = dniManual.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    let cfpVal = '403';
    let distritoVal = 'Luján';
    if (trayecto.descripcion) {
      const matchCfp = trayecto.descripcion.match(/CFP N° (.*?) -/);
      const matchDist = trayecto.descripcion.match(/Distrito: (.*?) \|/);
      if (matchCfp) cfpVal = matchCfp[1];
      if (matchDist) distritoVal = matchDist[1];
    }

    let hsReloj = trayecto.horas || '60';
    let fechaEmision = trayecto.fecha_entrega || '23 de Septiembre de 2026';

    const resBytes = await fetch('./plantilla.pdf');
    if (!resBytes.ok) throw new Error('No se encontró plantilla.pdf en el servidor.');
    const plantillaBytes = await resBytes.arrayBuffer();

    const pdfDoc = await PDFLib.PDFDocument.load(plantillaBytes);
    const fuenteBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const fuenteRegular = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const colorNegro = PDFLib.rgb(0, 0, 0);

    const paginas = pdfDoc.getPages();
    const frente = paginas[0];
    const reverso = paginas.length > 1 ? paginas[1] : frente;

    function dibujaRenglonPunteado(pagina, texto, xStart, yPos, xMax, font, size) {
      pagina.drawText(texto, { x: xStart, y: yPos, size: size, font: font, color: colorNegro });
      const textWidth = font.widthOfTextAtSize(texto, size);
      let puntoX = xStart + textWidth + 5;
      while (puntoX < xMax) {
        pagina.drawText('.', { x: puntoX, y: yPos, size: size, font: font, color: colorNegro });
        puntoX += 4;
      }
    }

    let diaE = '23', mesE = 'Septiembre', anioE = '26';
    if (fechaEmision) {
      const partesF = fechaEmision.split('de');
      if (partesF.length === 3) {
        diaE = partesF[0].trim();
        mesE = partesF[1].trim();
        anioE = partesF[2].trim().slice(-2);
      }
    }

    const tamanoNombre = 14;
    const xInicioLineaNombre = 130;
    const xFinLineaNombre = 532;
    const centroLineaNombre = xInicioLineaNombre + (xFinLineaNombre - xInicioLineaNombre) / 2;
    
    const textoAlumno = alumno.toUpperCase();
    const anchoTextoAlumno = fuenteBold.widthOfTextAtSize(textoAlumno, tamanoNombre);
    const xNombreCentrado = centroLineaNombre - (anchoTextoAlumno / 2);

    frente.drawText(textoAlumno, { x: xNombreCentrado, y: 232, size: tamanoNombre, font: fuenteBold, color: colorNegro });
    frente.drawText(dniFormateado, { x: 115, y: 207, size: 12, font: fuenteRegular, color: colorNegro });
    dibujaRenglonPunteado(frente, (trayecto.nombre || '').toUpperCase(), 91, 182, 400, fuenteRegular, 12);
    frente.drawText(String(hsReloj), { x: 425, y: 182, size: 12, font: fuenteRegular, color: colorNegro });

    let baseNombreCert = (trayecto.certificacion || trayecto.nombre || '').toUpperCase().trim();
    let resTextoLimpio = (trayecto.resolucion || '').toUpperCase().trim();

    baseNombreCert = baseNombreCert.split(/SEGÚN\s+RESOLUCIÓN|SEGUN\s+RESOLUCION/i)[0].trim();

    if (resTextoLimpio) {
      if (baseNombreCert) resTextoLimpio = resTextoLimpio.replaceAll(baseNombreCert, '').trim();
      if (resTextoLimpio.includes('RESFC')) {
        resTextoLimpio = 'RESFC' + resTextoLimpio.split('RESFC').pop().trim();
      } else {
        resTextoLimpio = resTextoLimpio.replace(/^(RESOLUCIÓN|RESOLUCION)\s*/i, '').replace(/^(NRO\.|NRO|N°|NO\.)\s*/i, '').trim();
      }
    }

    let textoCert = baseNombreCert;
    if (resTextoLimpio) {
      textoCert += resTextoLimpio.startsWith('RESFC') || resTextoLimpio.startsWith('NRO') ? ` SEGÚN RESOLUCIÓN ${resTextoLimpio}` : ` SEGÚN RESOLUCIÓN NRO. ${resTextoLimpio}`;
    }

    const tamanoCert = 10.5;
    const xMaxGeneral = 520;
    const configRenglones = [{ x: 320, y: 159 }, { x: 68, y: 135 }, { x: 68, y: 117 }];

    const palabras = textoCert.split(' ').filter(Boolean);
    const lineas = ['', '', ''];
    let lineaActual = 0;

    for (const palabra of palabras) {
      let xInicio = configRenglones[lineaActual].x;
      let anchoDisponible = xMaxGeneral - xInicio;
      let prueba = lineas[lineaActual] ? `${lineas[lineaActual]} ${palabra}` : palabra;
      if (fuenteRegular.widthOfTextAtSize(prueba, tamanoCert) <= anchoDisponible) {
        lineas[lineaActual] = prueba;
      } else {
        lineaActual++;
        if (lineaActual > 2) break;
        lineas[lineaActual] = palabra;
      }
    }

    let ultimaLineaIndice = -1;
    for (let i = 2; i >= 0; i--) {
      if (lineas[i].trim() !== '') { ultimaLineaIndice = i; break; }
    }

    configRenglones.forEach((r, idx) => {
      let textoRenglon = lineas[idx];
      if (textoRenglon && textoRenglon.trim() !== '') {
        if (idx === ultimaLineaIndice) {
          dibujaRenglonPunteado(frente, textoRenglon, r.x, r.y, xMaxGeneral, fuenteRegular, tamanoCert);
        } else {
          frente.drawText(textoRenglon, { x: r.x, y: r.y, size: tamanoCert, font: fuenteRegular, color: colorNegro });
        }
      }
    });

    frente.drawText(String(diaE),  { x: 250, y: 98, size: 12, font: fuenteRegular, color: colorNegro });
    frente.drawText(String(mesE),  { x: 320, y: 98, size: 12, font: fuenteRegular, color: colorNegro });
    frente.drawText(String(anioE), { x: 495, y: 98, size: 12, font: fuenteRegular, color: colorNegro });

    let modulosArr = [];
    try { modulosArr = typeof trayecto.modulos === 'string' ? JSON.parse(trayecto.modulos) : (trayecto.modulos || []); } catch (e) {}

    const yInicial = 370;
    const pasoEntreItems = 30.5; 
    const altoRenglonSecundario = 12;
    const tamanoFuenteMod = 9.0;
    const maxAnchoCol = 235;

    function dividirEnDosLineas(texto, font, size, maxAncho) {
      const palabras = texto.split(' ').filter(Boolean);
      let l1 = '', l2 = '';
      for (let p of palabras) {
        let prueba = l1 ? l1 + ' ' + p : p;
        if (font.widthOfTextAtSize(prueba, size) <= maxAncho) { l1 = prueba; } else { l2 = l2 ? l2 + ' ' + p : p; }
      }
      return [l1, l2];
    }

    modulosArr.slice(0, 10).forEach((mod, index) => {
      const nombreMod = typeof mod === 'string' ? mod : (mod.nombre || mod.titulo || mod.modulo || '');
      const codigoMod = mod.codigo ? ` (${mod.codigo})` : '';
      const modTextoCompleto = `${nombreMod}${codigoMod}`.toUpperCase();
      const [linea1, linea2] = dividirEnDosLineas(modTextoCompleto, fuenteRegular, tamanoFuenteMod, maxAnchoCol);

      const esColumnaDerecha = index >= 5;
      const idxFila = esColumnaDerecha ? (index - 5) : index;
      const xPos = esColumnaDerecha ? 318 : 42; 
      const yBase = yInicial - (idxFila * pasoEntreItems);          

      if (linea1) reverso.drawText(linea1, { x: xPos, y: yBase, size: tamanoFuenteMod, font: fuenteRegular, color: colorNegro });
      if (linea2) reverso.drawText(linea2, { x: xPos, y: yBase - altoRenglonSecundario, size: tamanoFuenteMod, font: fuenteRegular, color: colorNegro });
    });

    if (fEgreso) reverso.drawText(fEgreso, { x: 140, y: 202, size: 12, font: fuenteRegular, color: colorNegro });
    if (numEgresadoDef) reverso.drawText(String(numEgresadoDef), { x: 420, y: 202, size: 12, font: fuenteRegular, color: colorNegro });
    if (cfpVal) reverso.drawText(String(cfpVal), { x: 150, y: 72, size: 12, font: fuenteRegular, color: colorNegro });
    if (distritoVal) reverso.drawText(String(distritoVal), { x: 390, y: 72, size: 12, font: fuenteRegular, color: colorNegro });

    const pdfBytesFinal = await pdfDoc.save();
    const blob = new Blob([pdfBytesFinal], { type: 'application/pdf' });
    const pdfUrl = URL.createObjectURL(blob);
    window.open(pdfUrl, '_blank');

    if (typeof Toast !== 'undefined') {
      Toast.fire({ icon: 'success', title: 'Certificado PDF generado' });
    }

  } catch (err) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({ icon: 'error', title: 'Error al generar PDF', text: err.message });
    } else {
      console.error(err);
    }
  }
}

// Alias para mantener compatibilidad si en el HTML llamas a emitirCertificadoPDF
const emitirCertificadoPDF = (opts) => {
  return generarCertificadoPDF_v3(
    opts.trayecto || opts,
    opts.estudianteNombre || opts.alumnoNombre,
    opts.estudianteDNI || opts.usuarioDni,
    opts.inscripcionId
  );
};
