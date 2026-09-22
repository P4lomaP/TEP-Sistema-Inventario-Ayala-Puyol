const db = require('../database');
const { registrarAuditoria } = require('../utils/auditoriaHelper');
const { exportarSQL, exportarPDF } = require('./backupController');

// Helper para consultas con Promesas
const executeQuery = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => (err ? reject(err) : resolve(results)));
});

/**
 * Obtener reporte analítico consolidado con filtros de fecha, sector y tipo
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

module.exports = {
    obtenerReporteConsolidado,
    descargarBackupSQL: exportarSQL,
    exportarPDF
};
