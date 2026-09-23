const db = require('../database');

// Helper para consultas a BD con promesas
const executeQuery = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => (err ? reject(err) : resolve(results)));
});

/**
 * Obtener métricas consolidadas, KPIs, distribución mensual y últimos movimientos para el Dashboard
 * GET /api/dashboard
 */
const obtenerDashboard = async (req, res) => {
    try {
        // 1. KPIs de Equipos Activos vs Total
        const [equiposStats] = await executeQuery(`
            SELECT 
                COUNT(*) AS totalEquipos,
                COALESCE(SUM(CASE WHEN estadoOperativo = 'Operativo' THEN 1 ELSE 0 END), 0) AS equiposActivos
            FROM Equipos
            WHERE estadoOperativo != 'Baja'
        `);

        // 2. KPIs de Insumos y Stock en Almacén
        const [insumosStats] = await executeQuery(`
            SELECT 
                COUNT(*) AS totalInsumos,
                COALESCE(SUM(stockActual), 0) AS totalStockUnidades,
                COALESCE(SUM(CASE WHEN stockActual <= stockSeguridad THEN 1 ELSE 0 END), 0) AS insumosCriticos
            FROM Insumos
            WHERE estadoActivo = 1
        `);

        // 3. Distribución mensual de insumos despachados / movidos en el año corriente
        const movimientosMes = await executeQuery(`
            SELECT 
                MONTH(m.fechaHora) AS mesNum,
                COALESCE(SUM(dm.cantidadAfectada), 0) AS totalUnidades
            FROM Movimientos m
            JOIN Detalle_Movimientos dm ON m.idMovimiento = dm.idMovimiento
            WHERE YEAR(m.fechaHora) = YEAR(CURDATE()) AND m.estado != 'Anulado'
            GROUP BY MONTH(m.fechaHora)
        `);

        // Construir arreglo de los 12 meses
        const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const mapaMeses = {};
        movimientosMes.forEach(row => {
            mapaMeses[row.mesNum] = Number(row.totalUnidades) || 0;
        });

        // Encontrar el valor máximo para calcular la altura porcentual relativa
        const valoresArray = Object.values(mapaMeses);
        const maxUnidades = valoresArray.length > 0 ? Math.max(...valoresArray, 1) : 1;

        const distribucionMensual = nombresMeses.map((mes, idx) => {
            const mesNum = idx + 1;
            const unidades = mapaMeses[mesNum] || 0;
            // Altura relativa entre 12% y 100% para visualización de barras
            const alturaPorcentaje = unidades > 0 ? Math.max(15, Math.round((unidades / maxUnidades) * 100)) : 8;
            return {
                mes,
                mesNum,
                unidades,
                valor: alturaPorcentaje
            };
        });

        // 4. Últimos 5 movimientos con detalle institucional
        const ultimosMovimientos = await executeQuery(`
            SELECT 
                m.idMovimiento,
                m.comprobanteRef,
                DATE_FORMAT(m.fechaHora, '%d/%m/%Y %H:%i') AS fechaHora,
                m.tipoMovimiento,
                COALESCE(s.nombreOficina, m.agenteReceptor, 'Depósito Central') AS agenteReceptor,
                COALESCE(u.username, 'Sistema') AS usuarioNombre,
                COALESCE(u.rolAcceso, 'Operador') AS usuarioRol
            FROM Movimientos m
            LEFT JOIN Usuarios u ON m.idUsuario = u.idUsuario
            LEFT JOIN Detalle_Movimientos dm ON m.idMovimiento = dm.idMovimiento
            LEFT JOIN Equipos e ON dm.idEquipoDestino = e.idEquipo
            LEFT JOIN Sectores s ON e.idSector = s.idSector
            WHERE m.estado != 'Anulado'
            GROUP BY m.idMovimiento, m.comprobanteRef, m.fechaHora, m.tipoMovimiento, m.agenteReceptor, u.username, u.rolAcceso, s.nombreOficina
            ORDER BY m.fechaHora DESC
            LIMIT 5
        `);

        return res.status(200).json({
            kpis: {
                equiposActivos: Number(equiposStats?.equiposActivos) || 0,
                totalEquipos: Number(equiposStats?.totalEquipos) || 0,
                totalInsumos: Number(insumosStats?.totalInsumos) || 0,
                totalStockUnidades: Number(insumosStats?.totalStockUnidades) || 0,
                insumosCriticos: Number(insumosStats?.insumosCriticos) || 0
            },
            distribucionMensual,
            ultimosMovimientos
        });

    } catch (error) {
        console.error('Error al obtener datos del Dashboard:', error);
        return res.status(500).json({
            message: 'Error interno al consultar datos del Dashboard.',
            error: error.message
        });
    }
};

module.exports = {
    obtenerDashboard
};
