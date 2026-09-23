const PDFDocument = require('pdfkit');
const db = require('../database');
const { registrarAuditoria } = require('../utils/auditoriaHelper');

// Helper para consultas con Promesas
const executeQuery = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => (err ? reject(err) : resolve(results)));
});

/**
 * 1. Obtener reporte analítico consolidado con filtros de fecha, sector y tipo
 * GET /api/reportes
 */
const obtenerReporteConsolidado = async (req, res) => {
    try {
        const { fechaDesde, fechaHasta, sector, tipo } = req.query;

        let conditions = ["m.estado != 'Anulado'"];
        let values = [];

        if (fechaDesde && fechaDesde.trim() !== '') {
            conditions.push("DATE(m.fechaHora) >= ?");
            values.push(fechaDesde.trim());
        }

        if (fechaHasta && fechaHasta.trim() !== '') {
            conditions.push("DATE(m.fechaHora) <= ?");
            values.push(fechaHasta.trim());
        }

        if (tipo && tipo.trim() !== '' && tipo.trim().toLowerCase() !== 'todos') {
            conditions.push("LOWER(m.tipoMovimiento) = LOWER(?)");
            values.push(tipo.trim());
        }

        if (sector && sector.trim() !== '' && sector.trim().toLowerCase() !== 'todos') {
            conditions.push("(m.agenteReceptor LIKE ? OR s.nombreOficina LIKE ?)");
            values.push(`%${sector.trim()}%`);
            values.push(`%${sector.trim()}%`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // 1. Obtener registros detallados de movimientos
        const queryDetalles = `
            SELECT 
                m.idMovimiento,
                DATE_FORMAT(m.fechaHora, '%Y-%m-%d %H:%i:%s') AS fechaHora,
                DATE_FORMAT(m.fechaHora, '%d/%m/%Y') AS fechaCorta,
                m.tipoMovimiento,
                m.comprobanteRef,
                m.agenteReceptor,
                m.estado,
                COALESCE(u.username, 'Operador') AS usuarioNombre,
                COALESCE(u.rolAcceso, 'Técnico') AS usuarioRol,
                dm.idDetalle,
                dm.cantidadAfectada,
                i.idInsumo,
                i.codigoInterno,
                i.descripcion AS insumoDescripcion,
                i.categoria AS insumoCategoria,
                e.idEquipo,
                e.codPatrimonial AS equipoCodPatrimonial,
                e.marcaModelo AS equipoModelo,
                e.tipoEquipo,
                s.nombreOficina AS equipoSector
            FROM Movimientos m
            JOIN Detalle_Movimientos dm ON m.idMovimiento = dm.idMovimiento
            JOIN Insumos i ON dm.idInsumo = i.idInsumo
            LEFT JOIN Equipos e ON dm.idEquipoDestino = e.idEquipo
            LEFT JOIN Sectores s ON e.idSector = s.idSector
            LEFT JOIN Usuarios u ON m.idUsuario = u.idUsuario
            ${whereClause}
            ORDER BY m.fechaHora DESC
        `;

        const transacciones = await executeQuery(queryDetalles, values);

        // 2. Calcular KPIs analíticos sobre los registros filtrados
        const totalRegistros = transacciones.length;
        const totalUnidades = transacciones.reduce((acc, t) => acc + (Number(t.cantidadAfectada) || 0), 0);
        
        const movimientosUnicos = new Set(transacciones.map(t => t.idMovimiento));
        const totalMovimientos = movimientosUnicos.size;

        const sectoresUnicos = new Set();
        transacciones.forEach(t => {
            const dest = t.equipoSector || t.agenteReceptor;
            if (dest && dest.trim() !== '') {
                sectoresUnicos.add(dest.trim());
            }
        });
        const totalOficinasAtendidas = sectoresUnicos.size;

        // 3. Obtener alertas de stock crítico del inventario
        const [stockCriticoResult] = await executeQuery(`
            SELECT COUNT(*) AS criticos 
            FROM Insumos 
            WHERE estadoActivo = 1 AND stockActual <= stockSeguridad
        `);
        const insumosCriticos = stockCriticoResult ? stockCriticoResult.criticos : 0;

        // 4. Calcular distribución por dependencia / sector
        const acumuladorSectores = {};
        transacciones.forEach(t => {
            let nombre = t.equipoSector || t.agenteReceptor || 'General / Almacén';
            if (nombre.includes('-')) {
                nombre = nombre.split('-')[0].trim();
            }
            acumuladorSectores[nombre] = (acumuladorSectores[nombre] || 0) + Number(t.cantidadAfectada);
        });

        const sectoresArray = Object.keys(acumuladorSectores).map(nombre => ({
            nombre,
            unidades: acumuladorSectores[nombre],
            porcentaje: totalUnidades > 0 ? Math.round((acumuladorSectores[nombre] / totalUnidades) * 100) : 0
        })).sort((a, b) => b.unidades - a.unidades);

        // Paleta de colores institucionales para el gráfico
        const colores = ['#1E3A8A', '#0D9488', '#84CC16', '#F59E0B', '#6366F1', '#EC4899'];
        const distribucionSectores = sectoresArray.slice(0, 5).map((s, idx) => ({
            ...s,
            color: colores[idx % colores.length]
        }));

        return res.status(200).json({
            kpis: {
                totalRegistros,
                totalMovimientos,
                totalUnidades,
                totalOficinasAtendidas,
                insumosCriticos
            },
            distribucionSectores,
            transacciones
        });

    } catch (error) {
        console.error('Error al generar reporte consolidado:', error);
        return res.status(500).json({ 
            message: 'Error al generar el reporte analítico.', 
            error: error.message 
        });
    }
};

/**
 * 2. Exportar Reporte de Inventario de Equipos en formato PDF (Oficial TEP)
 * Consulta los equipos activos (estadoOperativo != 'Baja') y genera un PDF al vuelo con pdfkit.
 * GET /api/reportes/pdf-equipos
 */
const exportarPDF = async (req, res) => {
    try {
        const query = `
            SELECT 
                COALESCE(codPatrimonial, 'S/C') AS codPatrimonial,
                tipoEquipo,
                marcaModelo,
                estadoOperativo
            FROM Equipos
            WHERE estadoOperativo != 'Baja'
            ORDER BY tipoEquipo ASC, codPatrimonial ASC, idEquipo ASC
        `;

        const equipos = await executeQuery(query);

        const fechaHoy = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Reporte_Inventario_${fechaHoy}.pdf"`);

        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 40,
            bufferPages: true,
            info: {
                Title: 'Tribunal Electoral Permanente - Reporte de Inventario',
                Author: 'Sistema de Inventario TEP',
                Subject: 'Reporte Oficial de Equipos Activos'
            }
        });

        doc.pipe(res);

        const renderEncabezado = () => {
            doc.rect(40, 40, 515, 4).fill('#1A365D');

            doc.fillColor('#1A365D')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Tribunal Electoral Permanente - Reporte de Inventario', 40, 52, { align: 'center' });

            doc.fillColor('#4A5568')
               .fontSize(9)
               .font('Helvetica')
               .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')} | Total de equipos activos: ${equipos.length}`, 40, 72, { align: 'center' });

            doc.moveTo(40, 88).lineTo(555, 88).lineWidth(1).strokeColor('#CBD5E0').stroke();
        };

        const renderCabeceraTabla = (y) => {
            doc.rect(40, y, 515, 20).fill('#2B6CB0');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            doc.text('N°', 45, y + 6, { width: 25, align: 'center' });
            doc.text('CÓD. PATRIMONIAL', 75, y + 6, { width: 110 });
            doc.text('TIPO DE EQUIPO', 190, y + 6, { width: 95 });
            doc.text('MARCA / MODELO', 290, y + 6, { width: 160 });
            doc.text('ESTADO OPERATIVO', 455, y + 6, { width: 95, align: 'center' });
            return y + 20;
        };

        renderEncabezado();
        let currentY = renderCabeceraTabla(98);

        if (equipos.length === 0) {
            doc.rect(40, currentY, 515, 25).fillAndStroke('#FFFFFF', '#E2E8F0');
            doc.fillColor('#718096')
               .fontSize(9)
               .font('Helvetica-Oblique')
               .text('No se encontraron equipos activos registrados en el inventario.', 50, currentY + 8);
        } else {
            equipos.forEach((equipo, index) => {
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

                doc.font('Helvetica-Bold').text(equipo.codPatrimonial, 75, currentY + 6, { width: 110 });
                doc.font('Helvetica');

                doc.text(equipo.tipoEquipo || 'Equipo', 190, currentY + 6, { width: 95 });
                doc.text(equipo.marcaModelo || 'No especificado', 290, currentY + 6, { width: 160, lineBreak: false, ellipsis: true });

                const estadoColor = equipo.estadoOperativo === 'Operativo' ? '#2F855A' : '#D69E2E';
                doc.font('Helvetica-Bold')
                   .fillColor(estadoColor)
                   .text(equipo.estadoOperativo || 'N/A', 455, currentY + 6, { width: 95, align: 'center' });

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
                   `Página ${i + 1} de ${range.count} - Sistema de Inventario TEP - Documento emitido por auditoría`,
                   40,
                   806,
                   { align: 'center', width: 515 }
               );
        }

        registrarAuditoria(
            req.usuario?.idUsuario,
            `Generación de reporte PDF de inventario de equipos (${equipos.length} equipos activos)`,
            'Equipos'
        ).catch(() => {});

        doc.end();

    } catch (error) {
        console.error('Error al generar reporte PDF de inventario:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Error interno al generar el reporte de inventario en PDF.',
                error: error.message
            });
        }
    }
};

module.exports = {
    obtenerReporteConsolidado,
    exportarPDF
};
