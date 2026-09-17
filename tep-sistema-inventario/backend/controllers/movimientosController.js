const db = require('../database');

// Helpers basados en promesas para gestionar transacciones ACID de forma limpia
const beginTransaction = () => new Promise((resolve, reject) => {
    db.beginTransaction(err => err ? reject(err) : resolve());
});

const commit = () => new Promise((resolve, reject) => {
    db.commit(err => err ? reject(err) : resolve());
});

const rollback = () => new Promise((resolve) => {
    db.rollback(() => resolve());
});

const executeQuery = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => err ? reject(err) : resolve(results));
});

/**
 * Obtener listado de movimientos con JOIN a Usuarios
 * GET /api/movimientos
 */
const obtenerMovimientos = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.idMovimiento,
                DATE_FORMAT(m.fechaHora, '%Y-%m-%d %H:%i:%s') AS fechaHora,
                m.tipoMovimiento,
                m.comprobanteRef,
                m.agenteReceptor,
                m.idUsuario,
                u.username AS usuarioNombre,
                u.rolAcceso AS usuarioRol
            FROM Movimientos m
            LEFT JOIN Usuarios u ON m.idUsuario = u.idUsuario
            ORDER BY m.fechaHora DESC
        `;

        const movimientos = await executeQuery(query);
        return res.status(200).json(movimientos);
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        return res.status(500).json({ 
            message: 'Error interno al consultar el historial de movimientos.' 
        });
    }
};

/**
 * Obtener un movimiento específico con su lista de detalles
 * GET /api/movimientos/:id
 */
const obtenerMovimientoPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const cabeceraQuery = `
            SELECT 
                m.idMovimiento,
                DATE_FORMAT(m.fechaHora, '%Y-%m-%d %H:%i:%s') AS fechaHora,
                m.tipoMovimiento,
                m.comprobanteRef,
                m.agenteReceptor,
                m.idUsuario,
                u.username AS usuarioNombre,
                u.rolAcceso AS usuarioRol
            FROM Movimientos m
            LEFT JOIN Usuarios u ON m.idUsuario = u.idUsuario
            WHERE m.idMovimiento = ?
        `;

        const [movimiento] = await executeQuery(cabeceraQuery, [id]);

        if (!movimiento) {
            return res.status(404).json({ message: 'Movimiento no encontrado.' });
        }

        const detallesQuery = `
            SELECT 
                dm.idDetalle,
                dm.cantidadAfectada,
                dm.idInsumo,
                i.codigoInterno,
                i.descripcion AS insumoDescripcion,
                i.categoria AS insumoCategoria,
                dm.idEquipoDestino,
                e.codPatrimonial AS equipoCodPatrimonial,
                e.marcaModelo AS equipoModelo
            FROM Detalle_Movimientos dm
            LEFT JOIN Insumos i ON dm.idInsumo = i.idInsumo
            LEFT JOIN Equipos e ON dm.idEquipoDestino = e.idEquipo
            WHERE dm.idMovimiento = ?
        `;

        const detalles = await executeQuery(detallesQuery, [id]);

        return res.status(200).json({
            ...movimiento,
            detalles
        });
    } catch (error) {
        console.error('Error al obtener detalle del movimiento:', error);
        return res.status(500).json({ 
            message: 'Error al consultar el detalle del movimiento.' 
        });
    }
};

/**
 * Registrar un nuevo movimiento (Maestro-Detalle) con Transacción SQL
 * POST /api/movimientos
 */
const registrarMovimiento = async (req, res) => {
    const {
        tipoMovimiento,
        comprobanteRef,
        agenteReceptor,
        idUsuario,
        detalles
    } = req.body;

    // 1. Validaciones de la cabecera
    if (!tipoMovimiento || !comprobanteRef || !idUsuario) {
        return res.status(400).json({ 
            message: 'tipoMovimiento, comprobanteRef e idUsuario son campos obligatorios.' 
        });
    }

    const tipoNormalizado = tipoMovimiento.trim();
    const esIngreso = tipoNormalizado.toLowerCase() === 'ingreso';
    const esEgreso = tipoNormalizado.toLowerCase() === 'egreso';

    if (!esIngreso && !esEgreso) {
        return res.status(400).json({ 
            message: "tipoMovimiento debe ser exactamente 'Ingreso' o 'Egreso'." 
        });
    }

    // 2. Validaciones de los detalles
    if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ 
            message: 'El movimiento debe contener al menos un detalle en el array "detalles".' 
        });
    }

    // Iniciar Transacción SQL (BEGIN TRANSACTION)
    try {
        await beginTransaction();

        // 3. Insertar la cabecera en Movimientos
        const queryMovimiento = `
            INSERT INTO Movimientos (
                fechaHora,
                tipoMovimiento,
                comprobanteRef,
                agenteReceptor,
                idUsuario
            ) VALUES (NOW(), ?, ?, ?, ?)
        `;

        const valuesMovimiento = [
            tipoNormalizado,
            comprobanteRef.trim(),
            agenteReceptor ? agenteReceptor.trim() : null,
            parseInt(idUsuario, 10)
        ];

        const resultMovimiento = await executeQuery(queryMovimiento, valuesMovimiento);
        const idMovimiento = resultMovimiento.insertId;

        // 4. Procesar cada detalle
        for (const item of detalles) {
            const idInsumo = parseInt(item.idInsumo, 10);
            const cantidad = parseInt(item.cantidadAfectada, 10);
            const idEquipoDestino = item.idEquipoDestino ? parseInt(item.idEquipoDestino, 10) : null;

            if (isNaN(idInsumo) || isNaN(cantidad) || cantidad <= 0) {
                throw new Error(`Datos inválidos en el detalle: el insumo ${item.idInsumo} tiene una cantidad inválida (${item.cantidadAfectada}).`);
            }

            // Verificar existencia y disponibilidad de stock en caso de Egreso
            const [insumo] = await executeQuery(
                'SELECT idInsumo, descripcion, stockActual, estadoActivo FROM Insumos WHERE idInsumo = ?', 
                [idInsumo]
            );

            if (!insumo) {
                throw new Error(`El insumo con ID ${idInsumo} no existe en el catálogo.`);
            }

            if (insumo.estadoActivo !== 1) {
                throw new Error(`El insumo "${insumo.descripcion}" está dado de baja.`);
            }

            if (esEgreso && insumo.stockActual < cantidad) {
                throw new Error(`Stock insuficiente para "${insumo.descripcion}". Stock actual: ${insumo.stockActual}, solicitado: ${cantidad}.`);
            }

            // Insertar en Detalle_Movimientos
            const queryDetalle = `
                INSERT INTO Detalle_Movimientos (
                    cantidadAfectada,
                    idMovimiento,
                    idInsumo,
                    idEquipoDestino
                ) VALUES (?, ?, ?, ?)
            `;

            await executeQuery(queryDetalle, [
                cantidad,
                idMovimiento,
                idInsumo,
                idEquipoDestino
            ]);

            // Actualizar stock en la tabla Insumos (+ si es Ingreso, - si es Egreso)
            const queryStock = esIngreso
                ? 'UPDATE Insumos SET stockActual = stockActual + ? WHERE idInsumo = ?'
                : 'UPDATE Insumos SET stockActual = stockActual - ? WHERE idInsumo = ?';

            await executeQuery(queryStock, [cantidad, idInsumo]);
        }

        // 5. Si todo salió a la perfección, confirmamos la transacción (COMMIT)
        await commit();

        return res.status(201).json({
            message: 'Movimiento y actualización de stock registrados exitosamente.',
            idMovimiento,
            tipoMovimiento: tipoNormalizado,
            totalItems: detalles.length
        });

    } catch (error) {
        // En caso de cualquier fallo, revertimos todos los cambios (ROLLBACK)
        await rollback();
        console.error('Transacción abortada (ROLLBACK ejecutado):', error.message);

        return res.status(500).json({ 
            message: 'Error al procesar la transacción de movimiento.',
            error: error.message 
        });
    }
};

module.exports = {
    obtenerMovimientos,
    obtenerMovimientoPorId,
    registrarMovimiento
};
