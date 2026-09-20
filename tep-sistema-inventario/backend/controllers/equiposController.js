const db = require('../database');
const { registrarAuditoria } = require('../utils/auditoriaHelper');
const { registrarHistorialEquipo } = require('../utils/historialHelper');

/**
 * Obtener todos los equipos registrados con JOIN a Sectores e Insumos compatibles
 * GET /api/equipos
 */
const obtenerEquipos = (req, res) => {
    const query = `
        SELECT 
            e.idEquipo,
            e.codPatrimonial,
            e.tipoEquipo,
            e.marcaModelo,
            e.numeroSerie,
            e.ipFija,
            e.mascaraSubred,
            e.workgroup,
            e.estadoOperativo,
            e.idSector,
            COALESCE(s.nombreOficina, 'Sin sector asignado') AS nombreSector,
            COALESCE(s.nombreOficina, 'Sin sector asignado') AS nombreOficina,
            -- Atributos de Computadora
            e.procesador,
            e.memoriaRAM,
            e.almacenamiento,
            e.sistemaOperativo,
            -- Atributos de Impresora
            e.tecnologiaImpresion,
            e.tipoConexion,
            e.formatoPapel,
            e.idInsumoCompatible,
            i.descripcion AS insumoCompatibleDescripcion
        FROM Equipos e
        LEFT JOIN Sectores s ON e.idSector = s.idSector
        LEFT JOIN Insumos i ON e.idInsumoCompatible = i.idInsumo
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
 * Obtener el historial completo de traslados y bajas de un equipo específico
 * GET /api/equipos/:id/historial
 */
const obtenerHistorialEquipo = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Debe especificar el ID del equipo.' });
    }

    const query = `
        SELECT 
            h.idHistorial,
            DATE_FORMAT(h.fechaCambio, '%Y-%m-%d %H:%i:%s') AS fechaCambio,
            h.motivoBaja,
            h.idEquipo,
            e.codPatrimonial,
            e.tipoEquipo,
            e.marcaModelo,
            h.idSectorAnterior,
            COALESCE(sAnt.nombreOficina, 'Alta inicial') AS sectorAnterior,
            h.idSectorNuevo,
            COALESCE(sNue.nombreOficina, 'Baja patrimonial / Descarte') AS sectorNuevo
        FROM Historial_Equipos h
        JOIN Equipos e ON h.idEquipo = e.idEquipo
        LEFT JOIN Sectores sAnt ON h.idSectorAnterior = sAnt.idSector
        LEFT JOIN Sectores sNue ON h.idSectorNuevo = sNue.idSector
        WHERE h.idEquipo = ?
        ORDER BY h.fechaCambio DESC
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener historial del equipo:', err);
            return res.status(500).json({ 
                message: 'Error interno al consultar el historial del equipo.' 
            });
        }

        return res.status(200).json(results);
    });
};

/**
 * Crear un nuevo equipo informático (Computadora o Impresora)
 * POST /api/equipos
 */
const crearEquipo = (req, res) => {
    const {
        codPatrimonial,
        tipoEquipo,
        marcaModelo,
        numeroSerie,
        ipFija,
        mascaraSubred,
        workgroup,
        estadoOperativo,
        idSector,
        // Específicos de PC
        procesador,
        memoriaRAM,
        almacenamiento,
        sistemaOperativo,
        // Específicos de Impresora
        tecnologiaImpresion,
        tipoConexion,
        formatoPapel,
        idInsumoCompatible,
        // Auditoría
        idUsuario
    } = req.body;

    // 1. Validaciones obligatorias
    if (!tipoEquipo || !tipoEquipo.trim()) {
        return res.status(400).json({ 
            message: "El tipo de equipo ('tipoEquipo') es obligatorio (ej: 'Computadora', 'Impresora')." 
        });
    }

    if (!marcaModelo || !marcaModelo.trim()) {
        return res.status(400).json({ 
            message: 'La marca y modelo del equipo son obligatorios.' 
        });
    }

    if (!numeroSerie || !numeroSerie.trim()) {
        return res.status(400).json({ 
            message: 'El número de serie es obligatorio.' 
        });
    }

    if (!idSector) {
        return res.status(400).json({ 
            message: 'El ID del sector asignado es obligatorio.' 
        });
    }

    // 2. Normalización de valores comunes
    const tipo = tipoEquipo.trim();
    const codPat = codPatrimonial && codPatrimonial.trim() ? codPatrimonial.trim() : null; // RN-03
    const marca = marcaModelo.trim();
    const serie = numeroSerie.trim();
    const ip = ipFija && ipFija.trim() ? ipFija.trim() : '0.0.0.0';
    const mascara = mascaraSubred && mascaraSubred.trim() ? mascaraSubred.trim() : '255.255.255.0';
    const grupo = workgroup && workgroup.trim() ? workgroup.trim() : 'WORKGROUP';
    const estado = estadoOperativo && estadoOperativo.trim() ? estadoOperativo.trim() : 'Operativo';
    const sector = parseInt(idSector, 10);

    // 3. Normalización de campos específicos (permiten NULL)
    const proc = procesador && procesador.trim() ? procesador.trim() : null;
    const ram = memoriaRAM && memoriaRAM.trim() ? memoriaRAM.trim() : null;
    const alm = almacenamiento && almacenamiento.trim() ? almacenamiento.trim() : null;
    const so = sistemaOperativo && sistemaOperativo.trim() ? sistemaOperativo.trim() : null;

    const tecImp = tecnologiaImpresion && tecnologiaImpresion.trim() ? tecnologiaImpresion.trim() : null;
    const conImp = tipoConexion && tipoConexion.trim() ? tipoConexion.trim() : null;
    const formPap = formatoPapel && formatoPapel.trim() ? formatoPapel.trim() : null;
    const insumoComp = idInsumoCompatible ? parseInt(idInsumoCompatible, 10) : null;

    const query = `
        INSERT INTO Equipos (
            codPatrimonial,
            tipoEquipo,
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
            sistemaOperativo,
            tecnologiaImpresion,
            tipoConexion,
            formatoPapel,
            idInsumoCompatible
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        codPat,
        tipo,
        marca,
        serie,
        ip,
        mascara,
        grupo,
        estado,
        sector,
        proc,
        ram,
        alm,
        so,
        tecImp,
        conImp,
        formPap,
        insumoComp
    ];

    const ejecutarInsercion = () => {
        db.query(query, values, async (err, result) => {
            if (err) {
                console.error('Error al registrar equipo:', err);

                if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                    return res.status(400).json({ 
                        message: `El sector ID ${idSector} o el insumo compatible ID ${idInsumoCompatible} no existe en la base de datos.` 
                    });
                }

                return res.status(500).json({ 
                    message: 'Error interno al registrar el nuevo equipo.' 
                });
            }

            const idNuevo = result.insertId;

            // Side-effects de Auditoría e Historial
            try {
                await registrarHistorialEquipo(
                    idNuevo, 
                    null, 
                    sector, 
                    `Alta inicial de ${tipo} en sistema`
                );
                await registrarAuditoria(
                    idUsuario, 
                    `Alta de equipo ID ${idNuevo} [${tipo}]: ${marca} (S/N: ${serie})`, 
                    'Equipos'
                );
            } catch (sideErr) {
                console.error('Advertencia en registro de side-effects de creación:', sideErr);
            }

            return res.status(201).json({
                message: `${tipo} registrada exitosamente.`,
                equipo: {
                    idEquipo: idNuevo,
                    codPatrimonial: codPat,
                    tipoEquipo: tipo,
                    marcaModelo: marca,
                    numeroSerie: serie,
                    ipFija: ip,
                    mascaraSubred: mascara,
                    workgroup: grupo,
                    estadoOperativo: estado,
                    idSector: sector,
                    procesador: proc,
                    memoriaRAM: ram,
                    almacenamiento: alm,
                    sistemaOperativo: so,
                    tecnologiaImpresion: tecImp,
                    tipoConexion: conImp,
                    formatoPapel: formPap,
                    idInsumoCompatible: insumoComp
                }
            });
        });
    };

    // 1. Validación de Número de Serie Único (S/N de fábrica)
    db.query(
        "SELECT idEquipo, marcaModelo, codPatrimonial FROM Equipos WHERE LOWER(numeroSerie) = LOWER(?) LIMIT 1",
        [serie],
        (errSerie, rowsSerie) => {
            if (errSerie) {
                console.error('Error al verificar número de serie:', errSerie);
                return res.status(500).json({ message: 'Error interno al validar número de serie.' });
            }
            if (rowsSerie && rowsSerie.length > 0) {
                return res.status(409).json({
                    message: `El número de serie "${serie}" ya pertenece al equipo "${rowsSerie[0].marcaModelo}" (ID: ${rowsSerie[0].idEquipo}). Cada dispositivo físico debe tener un número de serie único.`
                });
            }

            // 2. Validación de Código Patrimonial Único (si se suministró)
            const validarCodPatrimonial = () => {
                if (!codPat) {
                    return validarIp();
                }
                db.query(
                    "SELECT idEquipo, marcaModelo, numeroSerie FROM Equipos WHERE LOWER(codPatrimonial) = LOWER(?) LIMIT 1",
                    [codPat],
                    (errPat, rowsPat) => {
                        if (errPat) {
                            console.error('Error al verificar código patrimonial:', errPat);
                            return res.status(500).json({ message: 'Error interno al validar código patrimonial.' });
                        }
                        if (rowsPat && rowsPat.length > 0) {
                            return res.status(409).json({
                                message: `El código patrimonial "${codPat}" ya está asignado al equipo "${rowsPat[0].marcaModelo}" (ID: ${rowsPat[0].idEquipo}). Cada bien patrimonial del TEP debe tener un código único.`
                            });
                        }
                        validarIp();
                    }
                );
            };

            // 3. Validación de Conflicto de IP Fija (dos dispositivos activos no pueden tener la misma IP en red)
            const validarIp = () => {
                const esIpMonitoreada = ip !== '0.0.0.0' && 
                                       ip.toLowerCase() !== 'dhcp' && 
                                       !ip.toLowerCase().includes('no aplica');

                if (esIpMonitoreada && estado.toLowerCase() !== 'baja') {
                    db.query(
                        "SELECT idEquipo, marcaModelo, tipoEquipo FROM Equipos WHERE ipFija = ? AND LOWER(estadoOperativo) != 'baja' LIMIT 1",
                        [ip],
                        (checkErr, checkResults) => {
                            if (checkErr) {
                                console.error('Error al validar unicidad de IP:', checkErr);
                                return res.status(500).json({ message: 'Error interno al validar dirección IP.' });
                            }

                            if (checkResults.length > 0) {
                                const existente = checkResults[0];
                                return res.status(409).json({
                                    message: `Conflicto de red: La dirección IP ${ip} ya está asignada al equipo "${existente.marcaModelo}" (${existente.tipoEquipo}). Dos dispositivos activos no pueden compartir la misma IP.`
                                });
                            }

                            ejecutarInsercion();
                        }
                    );
                } else {
                    ejecutarInsercion();
                }
            };

            validarCodPatrimonial();
        }
    );
};

/**
 * Actualizar datos de un equipo existente con soporte polimórfico (PC / Impresora)
 * PUT /api/equipos/:id
 */
const actualizarEquipo = (req, res) => {
    const { id } = req.params;
    const {
        codPatrimonial,
        tipoEquipo,
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
        sistemaOperativo,
        tecnologiaImpresion,
        tipoConexion,
        formatoPapel,
        idInsumoCompatible,
        motivoBaja,
        idUsuario
    } = req.body;

    if (!id) {
        return res.status(400).json({ 
            message: 'Debe especificar el ID del equipo a actualizar.' 
        });
    }

    // 1. Consultar estado previo del equipo
    db.query('SELECT idSector, marcaModelo, tipoEquipo, codPatrimonial, estadoOperativo FROM Equipos WHERE idEquipo = ?', [id], (findErr, findResults) => {
        if (findErr) {
            console.error('Error al consultar equipo para actualización:', findErr);
            return res.status(500).json({ message: 'Error interno al consultar el equipo.' });
        }

        if (findResults.length === 0) {
            return res.status(404).json({ message: 'No se encontró el equipo especificado.' });
        }

        const equipoPrevio = findResults[0];

        // 2. Construir dinámicamente campos a actualizar respetando NULLs
        const campos = [];
        const values = [];

        if (codPatrimonial !== undefined) {
            campos.push('codPatrimonial = ?');
            values.push(codPatrimonial && codPatrimonial.trim() ? codPatrimonial.trim() : null);
        }
        if (tipoEquipo !== undefined) {
            campos.push('tipoEquipo = ?');
            values.push(tipoEquipo.trim());
        }
        if (marcaModelo !== undefined) {
            campos.push('marcaModelo = ?');
            values.push(marcaModelo.trim());
        }
        if (numeroSerie !== undefined) {
            campos.push('numeroSerie = ?');
            values.push(numeroSerie.trim());
        }
        if (ipFija !== undefined) {
            campos.push('ipFija = ?');
            values.push(ipFija.trim());
        }
        if (mascaraSubred !== undefined) {
            campos.push('mascaraSubred = ?');
            values.push(mascaraSubred.trim());
        }
        if (workgroup !== undefined) {
            campos.push('workgroup = ?');
            values.push(workgroup.trim());
        }
        if (estadoOperativo !== undefined) {
            campos.push('estadoOperativo = ?');
            values.push(estadoOperativo.trim());
        }
        if (idSector !== undefined) {
            campos.push('idSector = ?');
            values.push(parseInt(idSector, 10));
        }

        // Atributos de Computadora
        if (procesador !== undefined) {
            campos.push('procesador = ?');
            values.push(procesador && procesador.trim() ? procesador.trim() : null);
        }
        if (memoriaRAM !== undefined) {
            campos.push('memoriaRAM = ?');
            values.push(memoriaRAM && memoriaRAM.trim() ? memoriaRAM.trim() : null);
        }
        if (almacenamiento !== undefined) {
            campos.push('almacenamiento = ?');
            values.push(almacenamiento && almacenamiento.trim() ? almacenamiento.trim() : null);
        }
        if (sistemaOperativo !== undefined) {
            campos.push('sistemaOperativo = ?');
            values.push(sistemaOperativo && sistemaOperativo.trim() ? sistemaOperativo.trim() : null);
        }

        // Atributos de Impresora
        if (tecnologiaImpresion !== undefined) {
            campos.push('tecnologiaImpresion = ?');
            values.push(tecnologiaImpresion && tecnologiaImpresion.trim() ? tecnologiaImpresion.trim() : null);
        }
        if (tipoConexion !== undefined) {
            campos.push('tipoConexion = ?');
            values.push(tipoConexion && tipoConexion.trim() ? tipoConexion.trim() : null);
        }
        if (formatoPapel !== undefined) {
            campos.push('formatoPapel = ?');
            values.push(formatoPapel && formatoPapel.trim() ? formatoPapel.trim() : null);
        }
        if (idInsumoCompatible !== undefined) {
            campos.push('idInsumoCompatible = ?');
            values.push(idInsumoCompatible ? parseInt(idInsumoCompatible, 10) : null);
        }

        if (campos.length === 0) {
            return res.status(400).json({ message: 'No se enviaron campos para actualizar.' });
        }

        const ejecutarActualizacion = () => {
            const query = `UPDATE Equipos SET ${campos.join(', ')} WHERE idEquipo = ?`;
            values.push(id);

            db.query(query, values, async (err, result) => {
                if (err) {
                    console.error('Error al actualizar equipo:', err);

                    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                        return res.status(400).json({ 
                            message: 'El nuevo sector o insumo compatible especificado no existe.' 
                        });
                    }

                    return res.status(500).json({ 
                        message: 'Error interno al actualizar el equipo.' 
                    });
                }

                // 3. Side-effects: Disparar Historial de traslado o baja si hubo cambio
                try {
                    const nuevoSectorId = idSector !== undefined ? parseInt(idSector, 10) : equipoPrevio.idSector;
                    const nuevoEstado = estadoOperativo !== undefined ? estadoOperativo.trim() : equipoPrevio.estadoOperativo;

                    // Caso A: Cambio de Sector físico (Traslado)
                    if (idSector !== undefined && nuevoSectorId !== equipoPrevio.idSector) {
                        await registrarHistorialEquipo(
                            id,
                            equipoPrevio.idSector,
                            nuevoSectorId,
                            motivoBaja || 'Traslado de sector'
                        );
                    }

                    // Caso B: El estado cambió a 'Baja'
                    if (estadoOperativo !== undefined && nuevoEstado.toLowerCase() === 'baja' && equipoPrevio.estadoOperativo.toLowerCase() !== 'baja') {
                        await registrarHistorialEquipo(
                            id,
                            equipoPrevio.idSector,
                            null,
                            motivoBaja || 'Baja definitiva del equipo (RN-02)'
                        );
                    }

                    // Registro en Log_Auditoria
                    await registrarAuditoria(
                        idUsuario,
                        `Actualización de equipo ID ${id} [${tipoEquipo || equipoPrevio.tipoEquipo}]: ${marcaModelo || equipoPrevio.marcaModelo}`,
                        'Equipos'
                    );

                } catch (sideErr) {
                    console.error('Advertencia en side-effects de actualización:', sideErr);
                }

                return res.status(200).json({
                    message: 'Equipo actualizado exitosamente.',
                    idEquipo: Number(id)
                });
            });
        };

        // 1. Validar unicidad de número de serie si se actualizó
        const validarSerie = (callback) => {
            if (numeroSerie === undefined || !numeroSerie.trim()) return callback();
            const serieTarget = numeroSerie.trim();
            db.query(
                "SELECT idEquipo, marcaModelo FROM Equipos WHERE LOWER(numeroSerie) = LOWER(?) AND idEquipo != ? LIMIT 1",
                [serieTarget, id],
                (errS, rowsS) => {
                    if (errS) {
                        console.error('Error al validar número de serie:', errS);
                        return res.status(500).json({ message: 'Error interno al validar número de serie.' });
                    }
                    if (rowsS && rowsS.length > 0) {
                        return res.status(409).json({
                            message: `El número de serie "${serieTarget}" ya está registrado en el equipo "${rowsS[0].marcaModelo}" (ID: ${rowsS[0].idEquipo}). Cada dispositivo debe tener un número de serie único.`
                        });
                    }
                    callback();
                }
            );
        };

        // 2. Validar unicidad de código patrimonial si se actualizó
        const validarCodPatrimonial = (callback) => {
            if (codPatrimonial === undefined || !codPatrimonial || !codPatrimonial.trim()) return callback();
            const patTarget = codPatrimonial.trim();
            db.query(
                "SELECT idEquipo, marcaModelo FROM Equipos WHERE LOWER(codPatrimonial) = LOWER(?) AND idEquipo != ? LIMIT 1",
                [patTarget, id],
                (errP, rowsP) => {
                    if (errP) {
                        console.error('Error al validar código patrimonial:', errP);
                        return res.status(500).json({ message: 'Error interno al validar código patrimonial.' });
                    }
                    if (rowsP && rowsP.length > 0) {
                        return res.status(409).json({
                            message: `El código patrimonial "${patTarget}" ya está asignado al equipo "${rowsP[0].marcaModelo}" (ID: ${rowsP[0].idEquipo}). Los códigos patrimoniales son únicos en el Tribunal.`
                        });
                    }
                    callback();
                }
            );
        };

        // 3. Validación de duplicidad de IP en actualización
        const validarIp = () => {
            const ipAValidar = ipFija !== undefined ? ipFija.trim() : null;
            const estadoAValidar = estadoOperativo !== undefined ? estadoOperativo.trim() : equipoPrevio.estadoOperativo;
            const esIpMonitoreada = ipAValidar && 
                                   ipAValidar !== '0.0.0.0' && 
                                   ipAValidar.toLowerCase() !== 'dhcp' && 
                                   !ipAValidar.toLowerCase().includes('no aplica');

            if (esIpMonitoreada && estadoAValidar.toLowerCase() !== 'baja') {
                db.query(
                    "SELECT idEquipo, marcaModelo, tipoEquipo FROM Equipos WHERE ipFija = ? AND LOWER(estadoOperativo) != 'baja' AND idEquipo != ? LIMIT 1",
                    [ipAValidar, id],
                    (checkErr, checkResults) => {
                        if (checkErr) {
                            console.error('Error al validar unicidad de IP en actualización:', checkErr);
                            return res.status(500).json({ message: 'Error interno al validar IP.' });
                        }

                        if (checkResults.length > 0) {
                            const eq = checkResults[0];
                            return res.status(409).json({
                                message: `Conflicto de red: La dirección IP ${ipAValidar} ya está asignada al equipo "${eq.marcaModelo}" (${eq.tipoEquipo}). Dos dispositivos activos no pueden compartir la misma IP.`
                            });
                        }

                        ejecutarActualizacion();
                    }
                );
            } else {
                ejecutarActualizacion();
            }
        };

        validarSerie(() => validarCodPatrimonial(validarIp));
    });
};

/**
 * Eliminar o dar de baja a un equipo
 * DELETE /api/equipos/:id
 */
const eliminarEquipo = (req, res) => {
    const { id } = req.params;
    const { fisico } = req.query;
    const motivo = req.body?.motivoBaja || req.query?.motivoBaja || 'Baja patrimonial / descarte definitivo';
    const usuarioId = req.body?.idUsuario || req.query?.idUsuario;

    if (!id) {
        return res.status(400).json({ 
            message: 'Debe especificar el ID del equipo.' 
        });
    }

    db.query('SELECT idSector, marcaModelo, tipoEquipo FROM Equipos WHERE idEquipo = ?', [id], (findErr, findResults) => {
        if (findErr) {
            console.error('Error al consultar equipo para baja:', findErr);
            return res.status(500).json({ message: 'Error interno al consultar el equipo.' });
        }

        if (findResults.length === 0) {
            return res.status(404).json({ message: 'Equipo no encontrado.' });
        }

        const equipoPrevio = findResults[0];

        // Borrado físico explícito
        if (fisico === 'true') {
            const queryFisico = 'DELETE FROM Equipos WHERE idEquipo = ?';
            db.query(queryFisico, [id], async (err, result) => {
                if (err) {
                    console.error('Error al eliminar equipo físicamente:', err);
                    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                        return res.status(409).json({ 
                            message: 'No se puede eliminar físicamente el equipo porque posee historial o movimientos asociados (RNF-03). Se sugiere aplicar baja lógica.' 
                        });
                    }
                    return res.status(500).json({ 
                        message: 'Error al intentar eliminar el registro físicamente.' 
                    });
                }

                try {
                    await registrarAuditoria(
                        usuarioId,
                        `Eliminación física de equipo ID ${id} (${equipoPrevio.marcaModelo})`,
                        'Equipos'
                    );
                } catch (sideErr) {
                    console.error('Advertencia en auditoría física:', sideErr);
                }

                return res.status(200).json({ 
                    message: 'Equipo eliminado físicamente de la base de datos.',
                    idEquipo: Number(id)
                });
            });
            return;
        }

        // Baja lógica estándar
        const queryBaja = "UPDATE Equipos SET estadoOperativo = 'Baja' WHERE idEquipo = ?";

        db.query(queryBaja, [id], async (err, result) => {
            if (err) {
                console.error('Error al dar de baja el equipo:', err);
                return res.status(500).json({ 
                    message: 'Error interno al procesar la baja del equipo.' 
                });
            }

            try {
                await registrarHistorialEquipo(
                    id,
                    equipoPrevio.idSector,
                    null,
                    motivo
                );

                await registrarAuditoria(
                    usuarioId,
                    `Baja lógica de equipo ID ${id} [${equipoPrevio.tipoEquipo}]: ${equipoPrevio.marcaModelo}. Motivo: ${motivo}`,
                    'Equipos'
                );
            } catch (sideErr) {
                console.error('Advertencia en side-effects de baja:', sideErr);
            }

            return res.status(200).json({
                message: "Equipo dado de baja lógicamente con éxito (estadoOperativo: 'Baja').",
                idEquipo: Number(id),
                estadoOperativo: 'Baja',
                motivoBaja: motivo
            });
        });
    });
};

module.exports = {
    obtenerEquipos,
    obtenerHistorialEquipo,
    crearEquipo,
    actualizarEquipo,
    eliminarEquipo
};
