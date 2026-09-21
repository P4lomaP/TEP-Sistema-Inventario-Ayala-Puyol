const db = require('../database');
const { registrarAuditoria } = require('../utils/auditoriaHelper');

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
 * Obtener listado de movimientos con JOIN a Usuarios e indicador de estado (Activo / Anulado)
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
                m.estado,
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
                m.estado,
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

        // 3. Insertar la cabecera en Movimientos con estado 'Activo'
        const queryMovimiento = `
            INSERT INTO Movimientos (
                fechaHora,
                tipoMovimiento,
                comprobanteRef,
                agenteReceptor,
                idUsuario,
                estado
            ) VALUES (NOW(), ?, ?, ?, ?, 'Activo')
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

        // 5. Confirmar la transacción (COMMIT)
        await commit();

        // 6. Registrar en auditoría
        registrarAuditoria(
            idUsuario,
            `Registro de movimiento ID ${idMovimiento} (${tipoNormalizado} - Ref: ${comprobanteRef.trim()})`,
            'Movimientos'
        ).catch(() => {});

        return res.status(201).json({
            message: 'Movimiento y actualización de stock registrados exitosamente.',
            idMovimiento,
            tipoMovimiento: tipoNormalizado,
            estado: 'Activo',
            totalItems: detalles.length
        });

    } catch (error) {
        await rollback();
        console.error('Transacción abortada (ROLLBACK ejecutado):', error.message);

        return res.status(500).json({ 
            message: 'Error al procesar la transacción de movimiento.',
            error: error.message 
        });
    }
};

/**
 * Modificar un movimiento existente (corrección de errores de tipeo humano)
 * Revierte el impacto del movimiento previo y aplica el nuevo recálculo atómico de stock
 * PUT /api/movimientos/:id
 */
const actualizarMovimiento = async (req, res) => {
    const { id } = req.params;
    const {
        tipoMovimiento,
        comprobanteRef,
        agenteReceptor,
        idUsuario,
        detalles
    } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Debe especificar el ID del movimiento a modificar.' });
    }

    try {
        await beginTransaction();

        // 1. Obtener el movimiento previo
        const [movimientoPrevio] = await executeQuery('SELECT * FROM Movimientos WHERE idMovimiento = ?', [id]);

        if (!movimientoPrevio) {
            await rollback();
            return res.status(404).json({ message: 'Movimiento no encontrado.' });
        }

        // No permitir modificar un movimiento que ya está anulado
        if (movimientoPrevio.estado === 'Anulado') {
            await rollback();
            return res.status(400).json({ 
                message: 'No se puede modificar un movimiento que ha sido anulado previamente.' 
            });
        }

        // 2. Obtener los detalles previos
        const detallesPrevios = await executeQuery('SELECT * FROM Detalle_Movimientos WHERE idMovimiento = ?', [id]);

        // 3. Revertir el impacto previo en el stock de Insumos
        const eraIngreso = movimientoPrevio.tipoMovimiento.toLowerCase().includes('ingreso');

        for (const oldItem of detallesPrevios) {
            // Si el movimiento previo era Ingreso, había sumado al stock; revertir implica restar.
            // Si era Egreso, había restado del stock; revertir implica devolver las unidades al pañol.
            const queryReversion = eraIngreso
                ? 'UPDATE Insumos SET stockActual = stockActual - ? WHERE idInsumo = ?'
                : 'UPDATE Insumos SET stockActual = stockActual + ? WHERE idInsumo = ?';

            await executeQuery(queryReversion, [oldItem.cantidadAfectada, oldItem.idInsumo]);
        }

        // 4. Actualizar la cabecera del movimiento
        const nuevoTipo = tipoMovimiento ? tipoMovimiento.trim() : movimientoPrevio.tipoMovimiento;
        const nuevoComprobante = comprobanteRef ? comprobanteRef.trim() : movimientoPrevio.comprobanteRef;
        const nuevoReceptor = agenteReceptor !== undefined ? (agenteReceptor ? agenteReceptor.trim() : null) : movimientoPrevio.agenteReceptor;
        const usuarioOperador = idUsuario ? parseInt(idUsuario, 10) : movimientoPrevio.idUsuario;

        const queryUpdateCabecera = `
            UPDATE Movimientos SET
                tipoMovimiento = ?,
                comprobanteRef = ?,
                agenteReceptor = ?,
                idUsuario = ?
            WHERE idMovimiento = ?
        `;

        await executeQuery(queryUpdateCabecera, [nuevoTipo, nuevoComprobante, nuevoReceptor, usuarioOperador, id]);

        // 5. Si se proporciona un nuevo conjunto de detalles, procesarlos
        if (Array.isArray(detalles) && detalles.length > 0) {
            // Eliminar detalles antiguos
            await executeQuery('DELETE FROM Detalle_Movimientos WHERE idMovimiento = ?', [id]);

            const esNuevoIngreso = nuevoTipo.toLowerCase().includes('ingreso');

            for (const item of detalles) {
                const idInsumo = parseInt(item.idInsumo, 10);
                const cantidad = parseInt(item.cantidadAfectada, 10);
                const idEquipoDestino = item.idEquipoDestino ? parseInt(item.idEquipoDestino, 10) : null;

                if (isNaN(idInsumo) || isNaN(cantidad) || cantidad <= 0) {
                    throw new Error(`Cantidad inválida (${item.cantidadAfectada}) para el insumo ${item.idInsumo}.`);
                }

                // Consultar stock actual (ya revertido)
                const [insumo] = await executeQuery('SELECT idInsumo, descripcion, stockActual, estadoActivo FROM Insumos WHERE idInsumo = ?', [idInsumo]);

                if (!insumo) {
                    throw new Error(`El insumo con ID ${idInsumo} no existe.`);
                }

                if (!esNuevoIngreso && insumo.stockActual < cantidad) {
                    throw new Error(`Stock insuficiente para "${insumo.descripcion}" al corregir egreso. Stock disponible tras reversión: ${insumo.stockActual}, solicitado: ${cantidad}.`);
                }

                // Insertar nuevo detalle
                const insertDetalle = `
                    INSERT INTO Detalle_Movimientos (
                        cantidadAfectada,
                        idMovimiento,
                        idInsumo,
                        idEquipoDestino
                    ) VALUES (?, ?, ?, ?)
                `;
                await executeQuery(insertDetalle, [cantidad, id, idInsumo, idEquipoDestino]);

                // Aplicar el nuevo impacto al stock
                const queryAplicaStock = esNuevoIngreso
                    ? 'UPDATE Insumos SET stockActual = stockActual + ? WHERE idInsumo = ?'
                    : 'UPDATE Insumos SET stockActual = stockActual - ? WHERE idInsumo = ?';

                await executeQuery(queryAplicaStock, [cantidad, idInsumo]);
            }
        }

        // 6. Confirmar la transacción
        await commit();

        // 7. Registrar en Log_Auditoria
        registrarAuditoria(
            usuarioOperador,
            `Corrección de movimiento ID ${id} (${nuevoTipo} - Comprobante: ${nuevoComprobante}). Stock recalculado.`,
            'Movimientos'
        ).catch(() => {});

        return res.status(200).json({
            message: 'Movimiento corregido y stock recalculado exitosamente.',
            idMovimiento: Number(id),
            tipoMovimiento: nuevoTipo,
            estado: movimientoPrevio.estado
        });

    } catch (error) {
        await rollback();
        console.error('Error al actualizar movimiento (ROLLBACK ejecutado):', error.message);
        return res.status(500).json({ 
            message: 'Error al actualizar el movimiento y recalcular stock.',
            error: error.message 
        });
    }
};

/**
 * Anulación LÓGICA de un movimiento (Baja Lógica institucional / Auditoría legal)
 * NO realiza borrado físico (DELETE FROM), sino que actualiza estado = 'Anulado'
 * garantizando la reversión total y atómica del stock en la tabla Insumos.
 * DELETE /api/movimientos/:id
 */
const eliminarMovimiento = async (req, res) => {
    const { id } = req.params;
    const idUsuario = req.body?.idUsuario || req.query?.idUsuario;

    if (!id) {
        return res.status(400).json({ message: 'Debe especificar el ID del movimiento a anular.' });
    }

    try {
        await beginTransaction();

        // 1. Obtener el movimiento a anular
        const [movimiento] = await executeQuery('SELECT * FROM Movimientos WHERE idMovimiento = ?', [id]);

        if (!movimiento) {
            await rollback();
            return res.status(404).json({ message: 'Movimiento no encontrado.' });
        }

        // 2. Prevenir doble anulación
        if (movimiento.estado === 'Anulado') {
            await rollback();
            return res.status(400).json({ 
                message: 'El movimiento ya se encuentra anulado previamente.' 
            });
        }

        // 3. Obtener los detalles asociados para revertir las existencias
        const detalles = await executeQuery('SELECT * FROM Detalle_Movimientos WHERE idMovimiento = ?', [id]);

        // 4. Revertir el stock en la tabla Insumos
        const eraIngreso = movimiento.tipoMovimiento.toLowerCase().includes('ingreso');

        for (const item of detalles) {
            // Si era Ingreso, se descuentan las unidades que se habían sumado
            // Si era Egreso, se reincorporan las unidades al pañol
            const queryReversion = eraIngreso
                ? 'UPDATE Insumos SET stockActual = stockActual - ? WHERE idInsumo = ?'
                : 'UPDATE Insumos SET stockActual = stockActual + ? WHERE idInsumo = ?';

            await executeQuery(queryReversion, [item.cantidadAfectada, item.idInsumo]);
        }

        // 5. BAJA LÓGICA (No borrado físico): Actualizar estado a 'Anulado'
        const queryBajaLogica = "UPDATE Movimientos SET estado = 'Anulado' WHERE idMovimiento = ?";
        await executeQuery(queryBajaLogica, [id]);

        // 6. Confirmar la transacción
        await commit();

        // 7. Registrar en Log_Auditoria para cumplimiento de auditoría legal
        const usuarioOperador = idUsuario ? parseInt(idUsuario, 10) : movimiento.idUsuario;
        registrarAuditoria(
            usuarioOperador,
            `Anulación lógica de movimiento ID ${id} (${movimiento.tipoMovimiento} - Comprobante: ${movimiento.comprobanteRef}). Stock revertido al catálogo. Estado: Anulado.`,
            'Movimientos'
        ).catch(() => {});

        return res.status(200).json({
            message: "Movimiento anulado lógicamente con éxito (estado: 'Anulado') y existencias de insumos revertidas.",
            idMovimiento: Number(id),
            estado: 'Anulado'
        });

    } catch (error) {
        await rollback();
        console.error('Error al anular movimiento (ROLLBACK ejecutado):', error.message);
        return res.status(500).json({ 
            message: 'Error al anular el movimiento y revertir existencias.',
            error: error.message 
        });
    }
};

module.exports = {
    obtenerMovimientos,
    obtenerMovimientoPorId,
    registrarMovimiento,
    actualizarMovimiento,
    eliminarMovimiento
};
