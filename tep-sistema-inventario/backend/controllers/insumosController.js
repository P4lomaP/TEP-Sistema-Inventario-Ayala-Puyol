const PDFDocument = require('pdfkit');
const db = require('../database');
const { registrarAuditoria } = require('../utils/auditoriaHelper');

/**
 * Obtener todos los insumos activos (estadoActivo = 1)
 * GET /api/insumos
 */
const obtenerInsumos = (req, res) => {
    const query = `
        SELECT 
            idInsumo,
            codigoInterno,
            descripcion,
            categoria,
            stockActual,
            stockSeguridad,
            estadoActivo,
            ubicacionFila,
            ubicacionColumna,
            DATE_FORMAT(fechaVencimiento, '%Y-%m-%d') AS fechaVencimiento
        FROM Insumos
        WHERE estadoActivo = 1
        ORDER BY descripcion ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al listar insumos:', err);
            return res.status(500).json({ 
                message: 'Error interno al consultar los insumos.' 
            });
        }

        return res.status(200).json(results);
    });
};

/**
 * Registrar un nuevo insumo
 * POST /api/insumos
 */
const crearInsumo = (req, res) => {
    const {
        codigoInterno,
        descripcion,
        categoria,
        stockActual,
        stockSeguridad,
        ubicacionFila,
        ubicacionColumna,
        fechaVencimiento
    } = req.body;

    // Validaciones de campos obligatorios
    if (!codigoInterno || !descripcion || !categoria) {
        return res.status(400).json({ 
            message: 'Código interno, descripción y categoría son obligatorios.' 
        });
    }

    // Por defecto estadoActivo es 1; valores numéricos por defecto a 0 si no vienen definidos
    const stockAct = stockActual !== undefined ? parseInt(stockActual, 10) : 0;
    const stockSeg = stockSeguridad !== undefined ? parseInt(stockSeguridad, 10) : 0;
    const fila = ubicacionFila ? ubicacionFila.trim() : '';
    const columna = ubicacionColumna ? ubicacionColumna.trim() : '';

    // Los periféricos no llevan fecha de vencimiento (valor NULL). Para insumos consumibles, si no se especifica, se guarda NULL.
    const esPeriferico = categoria.trim().toLowerCase().startsWith('perif');
    const fecha = esPeriferico || !fechaVencimiento || fechaVencimiento === '9999-12-31' ? null : fechaVencimiento;

    const query = `
        INSERT INTO Insumos (
            codigoInterno,
            descripcion,
            categoria,
            stockActual,
            stockSeguridad,
            estadoActivo,
            ubicacionFila,
            ubicacionColumna,
            fechaVencimiento
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    `;

    const values = [
        codigoInterno.trim(),
        descripcion.trim(),
        categoria.trim(),
        stockAct,
        stockSeg,
        fila,
        columna,
        fecha
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al registrar insumo:', err);

            // Control de código interno duplicado (Unique Key)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ 
                    message: `El código interno "${codigoInterno}" ya está registrado.` 
                });
            }

            return res.status(500).json({ 
                message: 'Error interno al crear el insumo.' 
            });
        }

        return res.status(201).json({
            message: 'Insumo creado exitosamente.',
            insumo: {
                idInsumo: result.insertId,
                codigoInterno: codigoInterno.trim(),
                descripcion: descripcion.trim(),
                categoria: categoria.trim(),
                stockActual: stockAct,
                stockSeguridad: stockSeg,
                estadoActivo: 1,
                ubicacionFila: fila,
                ubicacionColumna: columna,
                fechaVencimiento: fecha
            }
        });
    });
};

/**
 * Actualizar datos de un insumo específico
 * PUT /api/insumos/:id
 */
const actualizarInsumo = (req, res) => {
    const { id } = req.params;
    const {
        codigoInterno,
        descripcion,
        categoria,
        stockActual,
        stockSeguridad,
        ubicacionFila,
        ubicacionColumna,
        fechaVencimiento
    } = req.body;

    if (!id) {
        return res.status(400).json({ 
            message: 'Debe especificar el ID del insumo a actualizar.' 
        });
    }

    const campos = [];
    const values = [];

    if (codigoInterno !== undefined) {
        campos.push('codigoInterno = ?');
        values.push(codigoInterno.trim());
    }
    if (descripcion !== undefined) {
        campos.push('descripcion = ?');
        values.push(descripcion.trim());
    }
    if (categoria !== undefined) {
        campos.push('categoria = ?');
        values.push(categoria.trim());
    }
    if (stockActual !== undefined) {
        campos.push('stockActual = ?');
        values.push(parseInt(stockActual, 10));
    }
    if (stockSeguridad !== undefined) {
        campos.push('stockSeguridad = ?');
        values.push(parseInt(stockSeguridad, 10));
    }
    if (ubicacionFila !== undefined) {
        campos.push('ubicacionFila = ?');
        values.push(ubicacionFila.trim());
    }
    if (ubicacionColumna !== undefined) {
        campos.push('ubicacionColumna = ?');
        values.push(ubicacionColumna.trim());
    }

    // Manejo de fecha de vencimiento: si la categoría es periférico, forzar a NULL
    const esPeriferico = categoria && categoria.trim().toLowerCase().startsWith('perif');
    if (esPeriferico) {
        campos.push('fechaVencimiento = NULL');
    } else if (fechaVencimiento !== undefined) {
        if (!fechaVencimiento || fechaVencimiento === '9999-12-31') {
            campos.push('fechaVencimiento = NULL');
        } else {
            campos.push('fechaVencimiento = ?');
            values.push(fechaVencimiento);
        }
    }

    if (campos.length === 0) {
        return res.status(400).json({ 
            message: 'No se enviaron campos válidos para actualizar.' 
        });
    }

    values.push(id);
    const query = `UPDATE Insumos SET ${campos.join(', ')} WHERE idInsumo = ? AND estadoActivo = 1`;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar insumo:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ 
                    message: `El código interno "${codigoInterno}" ya está en uso por otro insumo.` 
                });
            }

            return res.status(500).json({ 
                message: 'Error interno al actualizar el insumo.' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Insumo no encontrado o dado de baja.' 
            });
        }

        return res.status(200).json({
            message: 'Insumo actualizado exitosamente.',
            idInsumo: Number(id)
        });
    });
};

/**
 * Dar de baja lógica a un insumo (estadoActivo = 0)
 * PUT /api/insumos/:id/baja (o PUT /api/insumos/:id con estadoActivo=0)
 */
const darDeBajaInsumo = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ 
            message: 'Debe especificar el ID del insumo a dar de baja.' 
        });
    }

    const query = 'UPDATE Insumos SET estadoActivo = 0 WHERE idInsumo = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al dar de baja el insumo:', err);
            return res.status(500).json({ 
                message: 'Error interno al procesar la baja del insumo.' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Insumo no encontrado.' 
            });
        }

        return res.status(200).json({
            message: 'Insumo dado de baja lógicamente con éxito.',
            idInsumo: Number(id),
            estadoActivo: 0
        });
    });
};

/**
 * Exportar Catálogo Oficial de Insumos y Periféricos en formato PDF (PDFKit)
 * GET /api/insumos/pdf
 */
const exportarPDFInsumos = async (req, res) => {
    try {
        const query = `
            SELECT 
                codigoInterno,
                descripcion,
                categoria,
                stockActual,
                stockSeguridad,
                ubicacionFila,
                ubicacionColumna,
                DATE_FORMAT(fechaVencimiento, '%d/%m/%Y') AS fechaVenc
            FROM Insumos
            WHERE estadoActivo = 1
            ORDER BY categoria ASC, descripcion ASC
        `;

        const insumos = await new Promise((resolve, reject) => {
            db.query(query, (err, rows) => (err ? reject(err) : resolve(rows)));
        });

        const fechaHoy = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Catalogo_Insumos_TEP_${fechaHoy}.pdf"`);

        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 40,
            bufferPages: true,
            info: {
                Title: 'Tribunal Electoral Permanente - Catálogo de Insumos',
                Author: 'Sistema de Inventario TEP',
                Subject: 'Catálogo Oficial de Insumos y Periféricos'
            }
        });

        doc.pipe(res);

        const renderEncabezado = () => {
            doc.rect(40, 40, 515, 4).fill('#1A365D');

            doc.fillColor('#1A365D')
               .fontSize(13)
               .font('Helvetica-Bold')
               .text('Tribunal Electoral Permanente - Catálogo Oficial de Insumos y Periféricos', 40, 52, { align: 'center' });

            doc.fillColor('#4A5568')
               .fontSize(8.5)
               .font('Helvetica')
               .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')} | Total de artículos activos: ${insumos.length}`, 40, 72, { align: 'center' });

            doc.moveTo(40, 88).lineTo(555, 88).lineWidth(1).strokeColor('#CBD5E0').stroke();
        };

        const renderCabeceraTabla = (y) => {
            doc.rect(40, y, 515, 20).fill('#2B6CB0');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            doc.text('N°', 45, y + 6, { width: 25, align: 'center' });
            doc.text('CÓDIGO', 75, y + 6, { width: 65 });
            doc.text('DESCRIPCIÓN', 145, y + 6, { width: 175 });
            doc.text('CATEGORÍA', 325, y + 6, { width: 75 });
            doc.text('UBICACIÓN', 405, y + 6, { width: 55, align: 'center' });
            doc.text('STOCK', 465, y + 6, { width: 45, align: 'center' });
            doc.text('ESTADO', 515, y + 6, { width: 35, align: 'center' });
            return y + 20;
        };

        renderEncabezado();
        let currentY = renderCabeceraTabla(98);

        if (insumos.length === 0) {
            doc.rect(40, currentY, 515, 25).fillAndStroke('#FFFFFF', '#E2E8F0');
            doc.fillColor('#718096')
               .fontSize(9)
               .font('Helvetica-Oblique')
               .text('No se encontraron insumos activos registrados en el catálogo.', 50, currentY + 8);
        } else {
            insumos.forEach((item, index) => {
                if (currentY + 22 > 780) {
                    doc.addPage();
                    renderEncabezado();
                    currentY = renderCabeceraTabla(98);
                }

                const isEven = index % 2 === 0;
                const rowHeight = 20;

                doc.rect(40, currentY, 515, rowHeight)
                   .fillAndStroke(isEven ? '#FFFFFF' : '#F7FAFC', '#E2E8F0');

                doc.fillColor('#2D3748').fontSize(8).font('Helvetica');
                doc.text(String(index + 1), 45, currentY + 6, { width: 25, align: 'center' });

                doc.font('Helvetica-Bold').text(item.codigoInterno || 'S/C', 75, currentY + 6, { width: 65 });
                doc.font('Helvetica');

                doc.text(item.descripcion || 'Sin descripción', 145, currentY + 6, { width: 175, lineBreak: false, ellipsis: true });
                doc.text(item.categoria || 'Insumo', 325, currentY + 6, { width: 75 });

                const ubi = (item.ubicacionFila && item.ubicacionColumna) ? `F:${item.ubicacionFila} C:${item.ubicacionColumna}` : '-';
                doc.text(ubi, 405, currentY + 6, { width: 55, align: 'center' });

                const stockNum = Number(item.stockActual) || 0;
                const minNum = Number(item.stockSeguridad) || 0;
                const esCritico = stockNum <= minNum;

                doc.text(String(stockNum), 465, currentY + 6, { width: 45, align: 'center' });

                doc.font('Helvetica-Bold')
                   .fillColor(esCritico ? '#E53E3E' : '#2F855A')
                   .text(esCritico ? 'CRÍT' : 'OK', 515, currentY + 6, { width: 35, align: 'center' });

                currentY += rowHeight;
            });
        }

        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            doc.moveTo(40, 800).lineTo(555, 800).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
            doc.fillColor('#A0AEC0')
               .fontSize(7)
               .font('Helvetica')
               .text(
                   `Página ${i + 1} de ${range.count} - Sistema de Inventario TEP - Catálogo Oficial de Suministros`,
                   40,
                   806,
                   { align: 'center', width: 515 }
               );
        }

        registrarAuditoria(
            req.usuario?.idUsuario,
            `Generación de catálogo oficial de insumos en PDF (${insumos.length} artículos)`,
            'Insumos'
        ).catch(() => {});

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF de catálogo de insumos:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Error interno al generar el PDF del catálogo de insumos.',
                error: error.message
            });
        }
    }
};

module.exports = {
    obtenerInsumos,
    crearInsumo,
    actualizarInsumo,
    darDeBajaInsumo,
    exportarPDFInsumos
};
