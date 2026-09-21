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
                e.estadoOperativo,
                m.idInsumo,
                i.codigoInterno,
                i.descripcion AS insumoDescripcion,
                i.categoria AS insumoCategoria,
                i.stockActual,
                i.stockSeguridad,
                i.estadoActivo AS insumoEstadoActivo
            FROM matriz_compatibilidad m
            JOIN Equipos e ON m.idEquipo = e.idEquipo
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

        // 3. Verificar existencia del insumo
        const [insumo] = await executeQuery(
            'SELECT idInsumo, codigoInterno, descripcion, categoria, estadoActivo FROM Insumos WHERE idInsumo = ?',
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

        // 4. Prevenir duplicados (regla de unicidad)
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

        // 5. Inserción en la tabla intermedia
        const insertResult = await executeQuery(
            'INSERT INTO matriz_compatibilidad (idInsumo, idEquipo) VALUES (?, ?)',
            [insumoId, equipoId]
        );

        const idRegla = insertResult.insertId;

        // 6. Side-effect: Registrar en auditoría
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

module.exports = {
    obtenerTodasLasCompatibilidades,
    obtenerInsumosPorEquipo,
    obtenerEquiposPorInsumo,
    crearCompatibilidad,
    eliminarCompatibilidad
};
