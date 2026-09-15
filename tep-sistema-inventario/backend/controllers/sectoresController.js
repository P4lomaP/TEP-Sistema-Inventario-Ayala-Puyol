const db = require('../database');

/**
 * Obtener todos los sectores activos (estadoActivo = 1)
 * GET /api/sectores
 */
const obtenerSectores = (req, res) => {
    // La columna física en la BD es 'nombreOficina', se devuelve también con alias 'nombreSector'
    const query = `
        SELECT idSector, nombreOficina, nombreOficina AS nombreSector, estadoActivo 
        FROM Sectores 
        WHERE estadoActivo = 1 
        ORDER BY nombreOficina ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener sectores:', err);
            return res.status(500).json({ 
                message: 'Error al consultar la lista de sectores.' 
            });
        }

        return res.status(200).json(results);
    });
};

/**
 * Crear un nuevo sector
 * POST /api/sectores
 */
const crearSector = (req, res) => {
    // Acepta tanto 'nombreSector' como 'nombreOficina'
    const nombre = req.body.nombreSector || req.body.nombreOficina;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ 
            message: 'El nombre del sector es obligatorio.' 
        });
    }

    const query = 'INSERT INTO Sectores (nombreOficina, estadoActivo) VALUES (?, 1)';

    db.query(query, [nombre.trim()], (err, result) => {
        if (err) {
            console.error('Error al crear sector:', err);
            return res.status(500).json({ 
                message: 'Error interno al registrar el nuevo sector.' 
            });
        }

        return res.status(201).json({
            message: 'Sector creado exitosamente.',
            sector: {
                idSector: result.insertId,
                nombreSector: nombre.trim(),
                nombreOficina: nombre.trim(),
                estadoActivo: 1
            }
        });
    });
};

/**
 * Dar de baja lógica a un sector (estadoActivo = 0)
 * PUT /api/sectores/:id (o /api/sectores/:id/baja)
 */
const darDeBajaSector = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ 
            message: 'Debe especificar el ID del sector a dar de baja.' 
        });
    }

    const query = 'UPDATE Sectores SET estadoActivo = 0 WHERE idSector = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al dar de baja el sector:', err);
            return res.status(500).json({ 
                message: 'Error interno al procesar la baja del sector.' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'No se encontró el sector especificado.' 
            });
        }

        return res.status(200).json({
            message: 'Sector dado de baja lógicamente con éxito.',
            idSector: Number(id),
            estadoActivo: 0
        });
    });
};

/**
 * Actualizar datos de un sector (nombre o estado)
 * PUT /api/sectores/:id/editar
 */
const actualizarSector = (req, res) => {
    const { id } = req.params;
    const nombre = req.body.nombreSector || req.body.nombreOficina;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ 
            message: 'El nombre del sector no puede estar vacío.' 
        });
    }

    const query = 'UPDATE Sectores SET nombreOficina = ? WHERE idSector = ?';

    db.query(query, [nombre.trim(), id], (err, result) => {
        if (err) {
            console.error('Error al actualizar sector:', err);
            return res.status(500).json({ 
                message: 'Error al actualizar el sector.' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'No se encontró el sector especificado.' 
            });
        }

        return res.status(200).json({
            message: 'Sector actualizado exitosamente.',
            sector: {
                idSector: Number(id),
                nombreSector: nombre.trim(),
                nombreOficina: nombre.trim()
            }
        });
    });
};

module.exports = {
    obtenerSectores,
    crearSector,
    darDeBajaSector,
    actualizarSector
};
