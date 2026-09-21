const PDFDocument = require('pdfkit');
const db = require('../database');

// Helper para consultas SQL preparadas con Promesas
const executeQuery = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => (err ? reject(err) : resolve(results)));
});

/**
 * Genera y transmite en stream el Acta de Movimiento / Entrega Patrimonial en formato PDF
 * GET /api/comprobantes/:idMovimiento/pdf
 */
const generarActaMovimientoPDF = async (req, res) => {
    const { idMovimiento } = req.params;
    const movimientoId = parseInt(idMovimiento, 10);

    if (isNaN(movimientoId)) {
        return res.status(400).json({ 
            message: 'El identificador de movimiento (idMovimiento) debe ser un número entero válido.' 
        });
    }

    try {
        // 1. Consultar cabecera del movimiento con JOIN al usuario operador
        const queryMovimiento = `
            SELECT 
                m.idMovimiento,
                DATE_FORMAT(m.fechaHora, '%d/%m/%Y %H:%i') AS fechaHora,
                m.tipoMovimiento,
                m.comprobanteRef,
                m.agenteReceptor,
                m.estado,
                u.username AS operador,
                u.rolAcceso AS operadorRol
            FROM Movimientos m
            LEFT JOIN Usuarios u ON m.idUsuario = u.idUsuario
            WHERE m.idMovimiento = ?
        `;

        const [movimiento] = await executeQuery(queryMovimiento, [movimientoId]);

        if (!movimiento) {
            return res.status(404).json({ 
                message: `El movimiento con ID ${movimientoId} no existe en el sistema.` 
            });
        }

        // 2. Consultar los detalles de insumos y equipos con sus sectores asociados
        const queryDetalles = `
            SELECT 
                d.idDetalle,
                d.cantidadAfectada,
                d.idInsumo,
                i.codigoInterno AS insumoCodigo,
                i.descripcion AS insumoDescripcion,
                i.categoria AS insumoCategoria,
                d.idEquipoDestino,
                e.codPatrimonial AS equipoCodPatrimonial,
                e.tipoEquipo,
                e.marcaModelo AS equipoModelo,
                e.numeroSerie AS equipoNumeroSerie,
                s.nombreOficina AS sectorDestino
            FROM Detalle_Movimientos d
            LEFT JOIN Insumos i ON d.idInsumo = i.idInsumo
            LEFT JOIN Equipos e ON d.idEquipoDestino = e.idEquipo
            LEFT JOIN Sectores s ON e.idSector = s.idSector
            WHERE d.idMovimiento = ?
            ORDER BY d.idDetalle ASC
        `;

        const detalles = await executeQuery(queryDetalles, [movimientoId]);

        // Determinar sector origen y destino predeterminado
        const esIngreso = (movimiento.tipoMovimiento || '').toLowerCase().includes('ingreso');
        const sectorOrigen = esIngreso 
            ? 'Proveedor Externo / Adquisición Institucional' 
            : 'Depósito Central / Pañol Informático TEP';
        
        // Extraer sector destino del equipo o del receptor
        const sectorDestinoEquipo = detalles.find(d => d.sectorDestino)?.sectorDestino;
        const sectorDestino = sectorDestinoEquipo || movimiento.agenteReceptor || 'Oficina Receptora TEP';

        // 3. Configurar headers HTTP para stream de PDF
        const nombreArchivo = `Acta_Movimiento_${movimiento.comprobanteRef || movimientoId}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);

        // 4. Inicializar documento PDF (A4, márgenes formales)
        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 40,
            info: {
                Title: `Acta de Movimiento N° ${movimiento.comprobanteRef || movimientoId}`,
                Author: 'Tribunal Electoral Permanente - Sistema de Inventario',
                Subject: 'Acta de Entrega Patrimonial y Reasignación',
                Keywords: 'TEP, Inventario, Acta, Entrega, Equipos, Insumos'
            }
        });

        // Conectar el stream del PDF a la respuesta HTTP
        doc.pipe(res);

        // --- ENCABEZADO INSTITUCIONAL ---
        // Barra decorativa superior
        doc.rect(40, 40, 515, 4).fill('#1A365D');

        doc.fillColor('#4A5568')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text('PODER JUDICIAL DE LA PROVINCIA', 40, 52, { align: 'center', characterSpacing: 1 });

        doc.fillColor('#1A365D')
           .fontSize(15)
           .font('Helvetica-Bold')
           .text('TRIBUNAL ELECTORAL PERMANENTE', 40, 64, { align: 'center', characterSpacing: 1.5 });

        doc.fillColor('#2B6CB0')
           .fontSize(10)
           .font('Helvetica')
           .text('DEPARTAMENTO DE INFORMÁTICA Y SISTEMAS - CONTROL PATRIMONIAL', 40, 82, { align: 'center' });

        doc.fillColor('#2D3748')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('ACTA DE MOVIMIENTO Y ENTREGA PATRIMONIAL', 40, 98, { align: 'center' });

        // Línea divisoria
        doc.moveTo(40, 115).lineTo(555, 115).lineWidth(1).strokeColor('#CBD5E0').stroke();

        // Si el movimiento está anulado, advertencia visible
        if (movimiento.estado === 'Anulado') {
            doc.rect(40, 120, 515, 20).fill('#FED7D7');
            doc.fillColor('#C53030')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('⚠️ ESTE MOVIMIENTO SE ENCUENTRA ANULADO (BAJA LÓGICA POR AUDITORÍA)', 40, 126, { align: 'center' });
        }

        // --- CUADRO DE METADATOS DEL MOVIMIENTO ---
        const metaY = movimiento.estado === 'Anulado' ? 148 : 125;
        doc.rect(40, metaY, 515, 95).fillAndStroke('#F7FAFC', '#E2E8F0');

        doc.fillColor('#1A202C').fontSize(9).font('Helvetica-Bold');
        
        // Fila 1
        doc.text('N° de Comprobante / Ref:', 50, metaY + 10);
        doc.font('Helvetica').text(movimiento.comprobanteRef || `MOV-${movimiento.idMovimiento}`, 175, metaY + 10);

        doc.font('Helvetica-Bold').text('Fecha y Hora:', 330, metaY + 10);
        doc.font('Helvetica').text(movimiento.fechaHora || 'No registrada', 410, metaY + 10);

        // Fila 2
        doc.font('Helvetica-Bold').text('Tipo de Movimiento:', 50, metaY + 28);
        doc.font('Helvetica-Bold').fillColor('#2B6CB0').text(movimiento.tipoMovimiento.toUpperCase(), 175, metaY + 28);
        doc.fillColor('#1A202C');

        doc.font('Helvetica-Bold').text('Estado Operativo:', 330, metaY + 28);
        doc.font('Helvetica-Bold')
           .fillColor(movimiento.estado === 'Anulado' ? '#C53030' : '#2F855A')
           .text(movimiento.estado.toUpperCase(), 410, metaY + 28);
        doc.fillColor('#1A202C');

        // Fila 3: Origen y Destino
        doc.font('Helvetica-Bold').text('Sector Origen:', 50, metaY + 46);
        doc.font('Helvetica').text(sectorOrigen, 175, metaY + 46, { width: 330 });

        doc.font('Helvetica-Bold').text('Sector / Oficina Destino:', 50, metaY + 62);
        doc.font('Helvetica').text(sectorDestino, 175, metaY + 62, { width: 330 });

        // Fila 4: Operador y Receptor
        doc.font('Helvetica-Bold').text('Operador Emisor:', 50, metaY + 78);
        doc.font('Helvetica').text(`${movimiento.operador || 'admin'} (${movimiento.operadorRol || 'Operador'})`, 175, metaY + 78);

        doc.font('Helvetica-Bold').text('Agente Receptor:', 330, metaY + 78);
        doc.font('Helvetica').text(movimiento.agenteReceptor || 'Mesa de Entradas', 410, metaY + 78);

        // --- TABLA DE DETALLES (BIENES E INSUMOS) ---
        const tableTopY = metaY + 110;
        doc.fillColor('#1A365D')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('DETALLE DE ELEMENTOS E INSUMOS AFECTADOS', 40, tableTopY);

        // Cabecera de la tabla
        const headerY = tableTopY + 16;
        doc.rect(40, headerY, 515, 22).fill('#2B6CB0');

        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
        doc.text('ÍTEM', 45, headerY + 7, { width: 25, align: 'center' });
        doc.text('CÓDIGO', 75, headerY + 7, { width: 70 });
        doc.text('DESCRIPCIÓN DEL BIEN / INSUMO', 150, headerY + 7, { width: 190 });
        doc.text('CANT.', 345, headerY + 7, { width: 35, align: 'center' });
        doc.text('EQUIPO / SERIE DESTINO', 385, headerY + 7, { width: 165 });

        let currentY = headerY + 22;

        if (detalles.length === 0) {
            doc.rect(40, currentY, 515, 20).fillAndStroke('#FFFFFF', '#E2E8F0');
            doc.fillColor('#718096')
               .fontSize(8)
               .font('Helvetica-Oblique')
               .text('No se registraron líneas de detalle asociadas a este comprobante.', 50, currentY + 6);
            currentY += 20;
        } else {
            detalles.forEach((det, index) => {
                const isEven = index % 2 === 0;
                const rowHeight = 24;

                // Fondo alternado
                doc.rect(40, currentY, 515, rowHeight).fillAndStroke(isEven ? '#FFFFFF' : '#F7FAFC', '#E2E8F0');

                // Datos de la fila
                doc.fillColor('#2D3748').fontSize(8).font('Helvetica');
                
                // Ítem
                doc.text(String(index + 1), 45, currentY + 7, { width: 25, align: 'center' });

                // Código
                const codigo = det.insumoCodigo || det.equipoCodPatrimonial || 'S/C';
                doc.font('Helvetica-Bold').text(codigo, 75, currentY + 7, { width: 70 });
                doc.font('Helvetica');

                // Descripción
                const descripcion = det.insumoDescripcion 
                    ? `${det.insumoDescripcion} (${det.insumoCategoria || 'Insumo'})`
                    : (det.equipoModelo ? `${det.equipoModelo} (${det.tipoEquipo || 'Equipo'})` : 'Elemento de inventario');
                doc.text(descripcion, 150, currentY + 7, { width: 190, lineBreak: false, ellipsis: true });

                // Cantidad
                doc.font('Helvetica-Bold').text(String(det.cantidadAfectada), 345, currentY + 7, { width: 35, align: 'center' });
                doc.font('Helvetica');

                // Destino / Serie
                let destinoStr = 'Stock General';
                if (det.equipoModelo) {
                    destinoStr = `${det.equipoModelo} [S/N: ${det.equipoNumeroSerie || 'S/N'}]`;
                } else if (det.sectorDestino) {
                    destinoStr = det.sectorDestino;
                }
                doc.text(destinoStr, 385, currentY + 7, { width: 165, lineBreak: false, ellipsis: true });

                currentY += rowHeight;
            });
        }

        // --- CLÁUSULA FORMAL INSTITUCIONAL ---
        currentY += 15;
        doc.rect(40, currentY, 515, 45).fillAndStroke('#EDF2F7', '#CBD5E0');
        doc.fillColor('#2D3748')
           .fontSize(8)
           .font('Helvetica-Oblique')
           .text(
               'Por medio de la presente acta se deja formal constancia de la entrega y recepción de los bienes e insumos detallados precedentemente, en perfecto estado de conservación y funcionamiento. El agente receptor asume la custodia, uso oficial y responsabilidad patrimonial de los mismos conforme a las reglamentaciones vigentes del Tribunal Electoral Permanente.',
               48,
               currentY + 8,
               { width: 499, align: 'justify' }
           );

        currentY += 60;

        // --- SECCIÓN DE FIRMAS FORMALES ---
        // Línea divisoria de firmas
        const firmaY = Math.max(currentY + 30, 680);

        // Firma Entregado por
        doc.moveTo(60, firmaY).lineTo(230, firmaY).lineWidth(1).strokeColor('#4A5568').stroke();
        doc.fillColor('#1A202C')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('Entregado por (Firma y Aclaración)', 60, firmaY + 6, { width: 170, align: 'center' });
        doc.fillColor('#4A5568')
           .fontSize(8)
           .font('Helvetica')
           .text(`Operador: ${movimiento.operador || 'admin'}`, 60, firmaY + 20, { width: 170, align: 'center' })
           .text('Dpto. Informática y Sistemas TEP', 60, firmaY + 30, { width: 170, align: 'center' });

        // Firma Recibido por
        doc.moveTo(365, firmaY).lineTo(535, firmaY).lineWidth(1).strokeColor('#4A5568').stroke();
        doc.fillColor('#1A202C')
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('Recibido por (Firma y Aclaración)', 365, firmaY + 6, { width: 170, align: 'center' });
        doc.fillColor('#4A5568')
           .fontSize(8)
           .font('Helvetica')
           .text(`Receptor: ${movimiento.agenteReceptor || 'Agente Judicial'}`, 365, firmaY + 20, { width: 170, align: 'center' })
           .text(sectorDestino, 365, firmaY + 30, { width: 170, align: 'center' });

        // --- PIE DE PÁGINA AUDITABLE ---
        const footerY = 790;
        doc.moveTo(40, footerY - 8).lineTo(555, footerY - 8).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
        doc.fillColor('#A0AEC0')
           .fontSize(7)
           .font('Helvetica')
           .text(
               `Documento digital oficial emitido por el Sistema de Gestión de Inventario TEP - Fecha de impresión: ${new Date().toLocaleString()} - Comprobante: ${movimiento.comprobanteRef || movimientoId}`,
               40,
               footerY,
               { align: 'center', width: 515 }
           );

        // Finalizar y enviar el PDF
        doc.end();

    } catch (error) {
        console.error('Error al generar comprobante PDF:', error);
        if (!res.headersSent) {
            return res.status(500).json({ 
                message: 'Error interno al generar el acta de entrega en PDF.',
                error: error.message 
            });
        }
    }
};

module.exports = {
    generarActaMovimientoPDF
};
