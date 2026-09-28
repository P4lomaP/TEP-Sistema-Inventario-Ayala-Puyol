const PDFDocument = require('pdfkit');
const db = require('../database');
const { registrarAuditoria } = require('../utils/auditoriaHelper');

// Helper basado en promesas para consultas SQL preparadas
const executeQuery = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => (err ? reject(err) : resolve(results)));
});

/**
 * Obtener todas las reglas de compatibilidad del sistema
 * GET /api/compatibilidad
 */
const obtenerTodasLasCompatibilidades = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.idRegla,
                m.idEquipo,
                e.codPatrimonial,
                e.marcaModelo,
                e.tipoEquipo,
                e.numeroSerie,
                e.estadoOperativo,
                s.nombreOficina AS nombreSector,
                m.idInsumo,
                i.codigoInterno,
                i.descripcion AS insumoDescripcion,
                i.categoria AS insumoCategoria,
                i.stockActual,
                i.stockSeguridad,
                i.estadoActivo AS insumoEstadoActivo
            FROM matriz_compatibilidad m
            JOIN Equipos e ON m.idEquipo = e.idEquipo
            LEFT JOIN Sectores s ON e.idSector = s.idSector
            JOIN Insumos i ON m.idInsumo = i.idInsumo
            ORDER BY e.marcaModelo ASC, i.descripcion ASC
        `;

        const reglas = await executeQuery(query);
        return res.status(200).json(reglas);
    } catch (error) {
        console.error('Error al obtener todas las compatibilidades:', error);
        return res.status(500).json({ 
            message: 'Error interno al consultar las reglas de compatibilidad.',
            error: error.message 
        });
    }
};

/**
 * Obtener todos los insumos compatibles con una impresora / equipo específico
 * GET /api/compatibilidad/equipo/:idEquipo
 */
const obtenerInsumosPorEquipo = async (req, res) => {
    const { idEquipo } = req.params;
    const equipoId = parseInt(idEquipo, 10);

    if (isNaN(equipoId)) {
        return res.status(400).json({ 
            message: 'El identificador de equipo (idEquipo) debe ser un número entero válido.' 
        });
    }

    try {
        // 1. Verificar existencia del equipo
        const [equipo] = await executeQuery(
            'SELECT idEquipo, codPatrimonial, tipoEquipo, marcaModelo, estadoOperativo FROM Equipos WHERE idEquipo = ?',
            [equipoId]
        );

        if (!equipo) {
            return res.status(404).json({ 
                message: `El equipo con ID ${equipoId} no fue encontrado en el inventario.` 
            });
        }

        // 2. Obtener insumos compatibles activos asociados en la matriz
        const query = `
            SELECT 
                m.idRegla,
                m.idEquipo,
                i.idInsumo,
                i.codigoInterno,
                i.descripcion,
                i.categoria,
                i.stockActual,
                i.stockSeguridad,
                i.estadoActivo,
                i.ubicacionFila,
                i.ubicacionColumna,
                DATE_FORMAT(i.fechaVencimiento, '%Y-%m-%d') AS fechaVencimiento
            FROM matriz_compatibilidad m
            JOIN Insumos i ON m.idInsumo = i.idInsumo
            WHERE m.idEquipo = ? AND i.estadoActivo = 1
            ORDER BY i.descripcion ASC
        `;

        const insumosCompatibles = await executeQuery(query, [equipoId]);

        return res.status(200).json(insumosCompatibles);

    } catch (error) {
        console.error('Error al obtener insumos compatibles para el equipo:', error);
        return res.status(500).json({ 
            message: 'Error interno al consultar los insumos compatibles.',
            error: error.message 
        });
    }
};

/**
 * Obtener todos los equipos compatibles con un insumo específico (ej: tóners)
 * GET /api/compatibilidad/insumo/:idInsumo
 */
const obtenerEquiposPorInsumo = async (req, res) => {
    const { idInsumo } = req.params;
    const insumoId = parseInt(idInsumo, 10);

    if (isNaN(insumoId)) {
        return res.status(400).json({ 
            message: 'El identificador de insumo (idInsumo) debe ser un número entero válido.' 
        });
    }

    try {
        const [insumo] = await executeQuery(
            'SELECT idInsumo, descripcion, categoria, estadoActivo FROM Insumos WHERE idInsumo = ?',
            [insumoId]
        );

        if (!insumo) {
            return res.status(404).json({ 
                message: `El insumo con ID ${insumoId} no fue encontrado.` 
            });
        }

        const query = `
            SELECT 
                m.idRegla,
                m.idInsumo,
                e.idEquipo,
                e.codPatrimonial,
                e.tipoEquipo,
                e.marcaModelo,
                e.numeroSerie,
                e.ipFija,
                e.estadoOperativo,
                s.nombreOficina AS sector
            FROM matriz_compatibilidad m
            JOIN Equipos e ON m.idEquipo = e.idEquipo
            LEFT JOIN Sectores s ON e.idSector = s.idSector
            WHERE m.idInsumo = ? AND e.estadoOperativo != 'Baja'
            ORDER BY e.marcaModelo ASC
        `;

        const equiposCompatibles = await executeQuery(query, [insumoId]);
        return res.status(200).json(equiposCompatibles);

    } catch (error) {
        console.error('Error al obtener equipos compatibles para el insumo:', error);
        return res.status(500).json({ 
            message: 'Error interno al consultar los equipos compatibles.',
            error: error.message 
        });
    }
};

/**
 * Crear una nueva relación en la matriz de compatibilidad
 * POST /api/compatibilidad
 * Body: { idInsumo, idEquipo, idUsuario? }
 */
const crearCompatibilidad = async (req, res) => {
    const { idInsumo, idEquipo, idUsuario } = req.body;

    // 1. Validaciones de presencia
    if (!idInsumo || !idEquipo) {
        return res.status(400).json({ 
            message: 'Debe especificar tanto idInsumo como idEquipo para establecer la compatibilidad.' 
        });
    }

    const insumoId = parseInt(idInsumo, 10);
    const equipoId = parseInt(idEquipo, 10);

    if (isNaN(insumoId) || isNaN(equipoId)) {
        return res.status(400).json({ 
            message: 'Los valores de idInsumo e idEquipo deben ser numéricos.' 
        });
    }

    try {
        // 2. Verificar existencia del equipo
        const [equipo] = await executeQuery(
            'SELECT idEquipo, codPatrimonial, tipoEquipo, marcaModelo, estadoOperativo FROM Equipos WHERE idEquipo = ?',
            [equipoId]
        );

        if (!equipo) {
            return res.status(404).json({ 
                message: `El equipo con ID ${equipoId} no existe en el sistema.` 
            });
        }

        if (equipo.estadoOperativo === 'Baja') {
            return res.status(400).json({ 
                message: `El equipo "${equipo.marcaModelo}" (${equipo.codPatrimonial}) se encuentra dado de baja y no puede recibir nuevas compatibilidades.` 
            });
        }

        // 3. Verificar existencia del insumo
        const [insumo] = await executeQuery(
            'SELECT idInsumo, codigoInterno, descripcion, categoria, stockActual, stockSeguridad, estadoActivo FROM Insumos WHERE idInsumo = ?',
            [insumoId]
        );

        if (!insumo) {
            return res.status(404).json({ 
                message: `El insumo con ID ${insumoId} no existe en el catálogo.` 
            });
        }

        if (insumo.estadoActivo !== 1) {
            return res.status(400).json({ 
                message: `El insumo "${insumo.descripcion}" está dado de baja y no puede asociarse.` 
            });
        }

        // 4. Validación de coherencia técnica: Evitar asociaciones ilógicas
        const tipoEquipoLower = (equipo.tipoEquipo || '').toLowerCase();
        const categoriaInsumoLower = (insumo.categoria || '').toLowerCase();
        const descInsumoLower = (insumo.descripcion || '').toLowerCase();

        // A. Periféricos de cómputo (mouse, teclado) no corresponden a impresoras
        if (categoriaInsumoLower === 'periférico' && tipoEquipoLower === 'impresora') {
            return res.status(400).json({ 
                message: `Inconsistencia técnica: El insumo "${insumo.descripcion}" es un periférico de computación y no puede asociarse a una impresora.` 
            });
        }

        // B. Consumibles exclusivos de impresión (tóner, cartuchos, tintas, tambores) no corresponden a computadoras
        const esConsumibleImpresion = descInsumoLower.includes('tóner') || 
                                      descInsumoLower.includes('toner') || 
                                      descInsumoLower.includes('cartucho') || 
                                      descInsumoLower.includes('tinta') || 
                                      descInsumoLower.includes('tambor') || 
                                      descInsumoLower.includes('fusor') || 
                                      descInsumoLower.includes('cinta');

        if (esConsumibleImpresion && tipoEquipoLower === 'computadora') {
            return res.status(400).json({ 
                message: `Inconsistencia técnica: El insumo "${insumo.descripcion}" es un consumible de impresión y no puede asociarse directamente a una computadora.` 
            });
        }

        // 5. Prevenir duplicados (regla de unicidad)
        const [existente] = await executeQuery(
            'SELECT idRegla FROM matriz_compatibilidad WHERE idEquipo = ? AND idInsumo = ?',
            [equipoId, insumoId]
        );

        if (existente) {
            return res.status(409).json({ 
                message: `Conflicto de duplicidad: La compatibilidad entre el insumo "${insumo.descripcion}" y el equipo "${equipo.marcaModelo}" ya se encuentra registrada (Regla ID ${existente.idRegla}).`,
                idRegla: existente.idRegla
            });
        }

        // 6. Inserción en la tabla intermedia
        const insertResult = await executeQuery(
            'INSERT INTO matriz_compatibilidad (idInsumo, idEquipo) VALUES (?, ?)',
            [insumoId, equipoId]
        );

        const idRegla = insertResult.insertId;

        // 7. Side-effect: Registrar en auditoría
        registrarAuditoria(
            idUsuario,
            `Asociación de compatibilidad creada (Regla ID ${idRegla}): Insumo "${insumo.descripcion}" (ID ${insumoId}) asignado a Equipo "${equipo.marcaModelo}" (ID ${equipoId}).`,
            'Compatibilidad'
        ).catch(() => {});

        return res.status(201).json({
            message: 'Regla de compatibilidad creada exitosamente.',
            idRegla,
            idInsumo: insumoId,
            idEquipo: equipoId,
            codPatrimonial: equipo.codPatrimonial,
            marcaModelo: equipo.marcaModelo,
            tipoEquipo: equipo.tipoEquipo,
            estadoOperativo: equipo.estadoOperativo,
            codigoInterno: insumo.codigoInterno,
            insumoDescripcion: insumo.descripcion,
            insumoCategoria: insumo.categoria,
            stockActual: insumo.stockActual,
            stockSeguridad: insumo.stockSeguridad,
            equipo: {
                idEquipo: equipo.idEquipo,
                codPatrimonial: equipo.codPatrimonial,
                tipoEquipo: equipo.tipoEquipo,
                marcaModelo: equipo.marcaModelo
            },
            insumo: {
                idInsumo: insumo.idInsumo,
                codigoInterno: insumo.codigoInterno,
                descripcion: insumo.descripcion,
                categoria: insumo.categoria
            }
        });

    } catch (error) {
        console.error('Error al registrar compatibilidad:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                message: 'Conflicto: Ya existe una regla de compatibilidad registrada para este equipo e insumo.' 
            });
        }

        return res.status(500).json({ 
            message: 'Error interno al registrar la regla de compatibilidad.',
            error: error.message 
        });
    }
};

/**
 * Eliminar una regla de compatibilidad (Borrado físico permitido por ser tabla intermedia)
 * DELETE /api/compatibilidad/:idRegla
 */
const eliminarCompatibilidad = async (req, res) => {
    const { idRegla } = req.params;
    const reglaId = parseInt(idRegla, 10);
    const idUsuario = req.body?.idUsuario || req.query?.idUsuario;

    if (isNaN(reglaId)) {
        return res.status(400).json({ 
            message: 'El identificador de la regla (idRegla) debe ser un número entero válido.' 
        });
    }

    try {
        // 1. Obtener la regla existente con detalles para el log de auditoría
        const queryDetalle = `
            SELECT 
                m.idRegla,
                m.idInsumo,
                m.idEquipo,
                i.descripcion AS insumoDescripcion,
                e.marcaModelo AS equipoModelo,
                e.codPatrimonial
            FROM matriz_compatibilidad m
            LEFT JOIN Insumos i ON m.idInsumo = i.idInsumo
            LEFT JOIN Equipos e ON m.idEquipo = e.idEquipo
            WHERE m.idRegla = ?
        `;

        const [regla] = await executeQuery(queryDetalle, [reglaId]);

        if (!regla) {
            return res.status(404).json({ 
                message: `No se encontró la regla de compatibilidad con ID ${reglaId}.` 
            });
        }

        // 2. Borrado físico en la tabla intermedia matriz_compatibilidad
        await executeQuery('DELETE FROM matriz_compatibilidad WHERE idRegla = ?', [reglaId]);

        // 3. Side-effect: Registrar en auditoría
        registrarAuditoria(
            idUsuario,
            `Eliminación física de regla de compatibilidad ID ${reglaId} (Equipo: "${regla.equipoModelo || regla.idEquipo}", Insumo: "${regla.insumoDescripcion || regla.idInsumo}").`,
            'Compatibilidad'
        ).catch(() => {});

        return res.status(200).json({
            message: 'Regla de compatibilidad eliminada exitosamente.',
            idRegla: reglaId
        });

    } catch (error) {
        console.error('Error al eliminar regla de compatibilidad:', error);
        return res.status(500).json({ 
            message: 'Error interno al eliminar la regla de compatibilidad.',
            error: error.message 
        });
    }
};

/**
 * Exportar Matriz Oficial de Compatibilidad Técnica en formato PDF (PDFKit)
 * GET /api/compatibilidad/pdf
 */
const exportarPDFMatriz = async (req, res) => {
    try {
        const query = `
            SELECT 
                e.marcaModelo,
                COALESCE(e.codPatrimonial, 'S/C') AS codPatrimonial,
                COALESCE(e.tipoEquipo, 'Hardware') AS tipoEquipo,
                COALESCE(s.nombreOficina, 'Almacén / Sin sector') AS nombreSector,
                i.codigoInterno,
                i.descripcion AS insumoDescripcion,
                i.categoria AS insumoCategoria
            FROM matriz_compatibilidad m
            JOIN Equipos e ON m.idEquipo = e.idEquipo
            LEFT JOIN Sectores s ON e.idSector = s.idSector
            JOIN Insumos i ON m.idInsumo = i.idInsumo
            ORDER BY e.marcaModelo ASC, i.descripcion ASC
        `;

        const reglas = await executeQuery(query);
        const fechaHoy = new Date().toISOString().slice(0, 10);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Matriz_Compatibilidad_TEP_${fechaHoy}.pdf"`);

        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 40,
            bufferPages: true,
            info: {
                Title: 'Tribunal Electoral Permanente - Matriz de Compatibilidad',
                Author: 'Sistema de Inventario TEP',
                Subject: 'Matriz Oficial de Compatibilidad Técnica'
            }
        });

        doc.pipe(res);

        const renderEncabezado = () => {
            doc.rect(40, 40, 515, 4).fill('#1A365D');

            doc.fillColor('#1A365D')
               .fontSize(13)
               .font('Helvetica-Bold')
               .text('Tribunal Electoral Permanente - Matriz Oficial de Compatibilidad', 40, 52, { align: 'center' });

            doc.fillColor('#4A5568')
               .fontSize(8.5)
               .font('Helvetica')
               .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')} | Total de asociaciones válidas: ${reglas.length}`, 40, 72, { align: 'center' });

            doc.moveTo(40, 88).lineTo(555, 88).lineWidth(1).strokeColor('#CBD5E0').stroke();
        };

        const renderCabeceraTabla = (y) => {
            doc.rect(40, y, 515, 20).fill('#2B6CB0');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            doc.text('N°', 45, y + 6, { width: 25, align: 'center' });
            doc.text('EQUIPO (MARCA / MODELO)', 75, y + 6, { width: 130 });
            doc.text('CÓD. PATRIMONIAL', 210, y + 6, { width: 80 });
            doc.text('TIPO', 295, y + 6, { width: 65 });
            doc.text('SECTOR ASIGNADO', 365, y + 6, { width: 85 });
            doc.text('INSUMO COMPATIBLE', 455, y + 6, { width: 100 });
            return y + 20;
        };

        renderEncabezado();
        let currentY = renderCabeceraTabla(98);

        if (reglas.length === 0) {
            doc.rect(40, currentY, 515, 25).fillAndStroke('#FFFFFF', '#E2E8F0');
            doc.fillColor('#718096')
               .fontSize(9)
               .font('Helvetica-Oblique')
               .text('No se encontraron reglas de compatibilidad configuradas en la matriz.', 50, currentY + 8);
        } else {
            reglas.forEach((regla, index) => {
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

                doc.font('Helvetica-Bold').text(regla.marcaModelo || 'Equipo', 75, currentY + 6, { width: 130, lineBreak: false, ellipsis: true });
                doc.font('Helvetica');

                doc.text(regla.codPatrimonial, 210, currentY + 6, { width: 80 });
                doc.text(regla.tipoEquipo, 295, currentY + 6, { width: 65 });
                doc.text(regla.nombreSector, 365, currentY + 6, { width: 85, lineBreak: false, ellipsis: true });

                doc.font('Helvetica-Bold')
                   .fillColor('#2B6CB0')
                   .text(`${regla.codigoInterno ? `[${regla.codigoInterno}] ` : ''}${regla.insumoDescripcion}`, 455, currentY + 6, { width: 100, lineBreak: false, ellipsis: true });

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
                   `Página ${i + 1} de ${range.count} - Sistema de Inventario TEP - Matriz Técnica de Compatibilidad`,
                   40,
                   806,
                   { align: 'center', width: 515 }
               );
        }

        registrarAuditoria(
            req.usuario?.idUsuario,
            `Generación de matriz oficial de compatibilidad en PDF (${reglas.length} reglas)`,
            'Compatibilidad'
        ).catch(() => {});

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF de compatibilidad:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Error interno al generar el PDF de la matriz de compatibilidad.',
                error: error.message
            });
        }
    }
};

module.exports = {
    obtenerTodasLasCompatibilidades,
    obtenerInsumosPorEquipo,
    obtenerEquiposPorInsumo,
    crearCompatibilidad,
    eliminarCompatibilidad,
    exportarPDFMatriz
};
