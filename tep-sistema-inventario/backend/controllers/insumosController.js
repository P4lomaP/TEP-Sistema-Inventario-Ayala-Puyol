const db = require('../database');

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

module.exports = {
    obtenerInsumos,
    crearInsumo,
    actualizarInsumo,
    darDeBajaInsumo
};
