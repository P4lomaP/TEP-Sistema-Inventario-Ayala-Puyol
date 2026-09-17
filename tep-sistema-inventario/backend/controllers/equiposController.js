const db = require('../database');

/**
 * Obtener todos los equipos registrados con JOIN a Sectores
 * GET /api/equipos
 */
const obtenerEquipos = (req, res) => {
    // JOIN con la tabla Sectores para traer el nombre de la oficina/sector asignado
    const query = `
        SELECT 
            e.idEquipo,
            e.codPatrimonial,
            e.marcaModelo,
            e.numeroSerie,
            e.ipFija,
            e.mascaraSubred,
            e.workgroup,
            e.estadoOperativo,
            e.idSector,
            COALESCE(s.nombreOficina, 'Sin sector asignado') AS nombreSector,
            COALESCE(s.nombreOficina, 'Sin sector asignado') AS nombreOficina,
            e.procesador,
            e.memoriaRAM,
            e.almacenamiento,
            e.sistemaOperativo
        FROM Equipos e
        LEFT JOIN Sectores s ON e.idSector = s.idSector
        ORDER BY e.idEquipo DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al listar equipos:', err);
            return res.status(500).json({ 
                message: 'Error interno al consultar el catálogo de equipos.' 
            });
        }

        return res.status(200).json(results);
    });
};

/**
 * Crear un nuevo equipo informático
 * POST /api/equipos
 */
const crearEquipo = (req, res) => {
    const {
        codPatrimonial,
        marcaModelo,
        numeroSerie,
        ipFija,
        mascaraSubred,
        workgroup,
        estadoOperativo,
        idSector,
        procesador,
        memoriaRAM,
        almacenamiento,
        sistemaOperativo
    } = req.body;

    // Validaciones básicas de campos esenciales
    if (!marcaModelo || !numeroSerie || !idSector) {
        return res.status(400).json({ 
            message: 'Marca/Modelo, Número de Serie y el ID del Sector son obligatorios.' 
        });
    }

    // Valores por defecto seguros
    const codPat = codPatrimonial ? codPatrimonial.trim() : null; // Opcional según RN-03
    const ip = ipFija ? ipFija.trim() : '0.0.0.0';
    const mascara = mascaraSubred ? mascaraSubred.trim() : '255.255.255.0';
    const grupo = workgroup ? workgroup.trim() : 'WORKGROUP';
    const estado = estadoOperativo ? estadoOperativo.trim() : 'Operativo';
    const proc = procesador ? procesador.trim() : 'N/A';
    const ram = memoriaRAM ? memoriaRAM.trim() : 'N/A';
    const alm = almacenamiento ? almacenamiento.trim() : 'N/A';
    const so = sistemaOperativo ? sistemaOperativo.trim() : 'Windows 10 Pro';

    const query = `
        INSERT INTO Equipos (
            codPatrimonial,
            marcaModelo,
            numeroSerie,
            ipFija,
            mascaraSubred,
            workgroup,
            estadoOperativo,
            idSector,
            procesador,
            memoriaRAM,
            almacenamiento,
            sistemaOperativo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        codPat,
        marcaModelo.trim(),
        numeroSerie.trim(),
        ip,
        mascara,
        grupo,
        estado,
        parseInt(idSector, 10),
        proc,
        ram,
        alm,
        so
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al registrar equipo:', err);

            // Control de clave foránea inválida (el sector no existe)
            if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                return res.status(400).json({ 
                    message: `El sector con ID ${idSector} no existe en la base de datos.` 
                });
            }

            return res.status(500).json({ 
                message: 'Error interno al registrar el nuevo equipo.' 
            });
        }

        return res.status(201).json({
            message: 'Equipo registrado exitosamente.',
            equipo: {
                idEquipo: result.insertId,
                codPatrimonial: codPat,
                marcaModelo: marcaModelo.trim(),
                numeroSerie: numeroSerie.trim(),
                ipFija: ip,
                mascaraSubred: mascara,
                workgroup: grupo,
                estadoOperativo: estado,
                idSector: parseInt(idSector, 10),
                procesador: proc,
                memoriaRAM: ram,
                almacenamiento: alm,
                sistemaOperativo: so
            }
        });
    });
};

/**
 * Actualizar datos de un equipo existente
 * PUT /api/equipos/:id
 */
const actualizarEquipo = (req, res) => {
    const { id } = req.params;
    const {
        codPatrimonial,
        marcaModelo,
        numeroSerie,
        ipFija,
        mascaraSubred,
        workgroup,
        estadoOperativo,
        idSector,
        procesador,
        memoriaRAM,
        almacenamiento,
        sistemaOperativo
    } = req.body;

    if (!id) {
        return res.status(400).json({ 
            message: 'Debe especificar el ID del equipo a actualizar.' 
        });
    }

    const query = `
        UPDATE Equipos SET
            codPatrimonial = COALESCE(?, codPatrimonial),
            marcaModelo = COALESCE(?, marcaModelo),
            numeroSerie = COALESCE(?, numeroSerie),
            ipFija = COALESCE(?, ipFija),
            mascaraSubred = COALESCE(?, mascaraSubred),
            workgroup = COALESCE(?, workgroup),
            estadoOperativo = COALESCE(?, estadoOperativo),
            idSector = COALESCE(?, idSector),
            procesador = COALESCE(?, procesador),
            memoriaRAM = COALESCE(?, memoriaRAM),
            almacenamiento = COALESCE(?, almacenamiento),
            sistemaOperativo = COALESCE(?, sistemaOperativo)
        WHERE idEquipo = ?
    `;

    const values = [
        codPatrimonial !== undefined ? (codPatrimonial ? codPatrimonial.trim() : null) : null,
        marcaModelo !== undefined ? marcaModelo.trim() : null,
        numeroSerie !== undefined ? numeroSerie.trim() : null,
        ipFija !== undefined ? ipFija.trim() : null,
        mascaraSubred !== undefined ? mascaraSubred.trim() : null,
        workgroup !== undefined ? workgroup.trim() : null,
        estadoOperativo !== undefined ? estadoOperativo.trim() : null,
        idSector !== undefined ? parseInt(idSector, 10) : null,
        procesador !== undefined ? procesador.trim() : null,
        memoriaRAM !== undefined ? memoriaRAM.trim() : null,
        almacenamiento !== undefined ? almacenamiento.trim() : null,
        sistemaOperativo !== undefined ? sistemaOperativo.trim() : null,
        id
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar equipo:', err);

            if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                return res.status(400).json({ 
                    message: 'El nuevo sector especificado no existe.' 
                });
            }

            return res.status(500).json({ 
                message: 'Error interno al actualizar el equipo.' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'No se encontró el equipo especificado.' 
            });
        }

        return res.status(200).json({
            message: 'Equipo actualizado exitosamente.',
            idEquipo: Number(id)
        });
    });
};

/**
 * Eliminar o dar de baja a un equipo
 * DELETE /api/equipos/:id
 * 
 * Por defecto aplica BAJA LÓGICA (estadoOperativo = 'Baja') para cumplir con
 * las normativas del Tribunal y RNF-03 (integridad referencial e historial inmutable).
 * Si se envía el parámetro ?fisico=true intenta eliminación física si no tiene historial.
 */
const eliminarEquipo = (req, res) => {
    const { id } = req.params;
    const { fisico } = req.query;

    if (!id) {
        return res.status(400).json({ 
            message: 'Debe especificar el ID del equipo.' 
        });
    }

    // Si explícitamente se solicita borrado físico
    if (fisico === 'true') {
        const queryFisico = 'DELETE FROM Equipos WHERE idEquipo = ?';
        db.query(queryFisico, [id], (err, result) => {
            if (err) {
                console.error('Error al eliminar equipo físicamente:', err);
                // Si falla por integridad referencial (tiene historial o insumos vinculados)
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({ 
                        message: 'No se puede eliminar físicamente el equipo porque posee historial o movimientos asociados (RNF-03). Se sugiere aplicar baja lógica.' 
                    });
                }
                return res.status(500).json({ 
                    message: 'Error al intentar eliminar el registro físicamente.' 
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Equipo no encontrado.' });
            }

            return res.status(200).json({ 
                message: 'Equipo eliminado físicamente de la base de datos.',
                idEquipo: Number(id)
            });
        });
        return;
    }

    // Baja lógica recomendada (patrón institucional y normativo del Tribunal)
    const queryBaja = "UPDATE Equipos SET estadoOperativo = 'Baja' WHERE idEquipo = ?";

    db.query(queryBaja, [id], (err, result) => {
        if (err) {
            console.error('Error al dar de baja el equipo:', err);
            return res.status(500).json({ 
                message: 'Error interno al procesar la baja del equipo.' 
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                message: 'Equipo no encontrado.' 
            });
        }

        return res.status(200).json({
            message: "Equipo dado de baja lógicamente con éxito (estadoOperativo: 'Baja').",
            idEquipo: Number(id),
            estadoOperativo: 'Baja'
        });
    });
};

module.exports = {
    obtenerEquipos,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo
};
