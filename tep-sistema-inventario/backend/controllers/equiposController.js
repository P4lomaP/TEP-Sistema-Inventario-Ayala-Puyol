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
 * Formatea una fecha a formato institucional DD/MM/YYYY HH:mm
 */
const formatearFechaHito = (d) => {
    if (!d) return 'Fecha no disponible';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return String(d);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Obtener el historial completo y ciclo de vida patrimonial de un equipo específico
 * GET /api/equipos/:id/historial
 */
const obtenerHistorialEquipo = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Debe especificar el ID del equipo.' });
    }

    // 1. Obtener datos del equipo
    const qEquipo = `
        SELECT 
            e.idEquipo,
            e.codPatrimonial,
            e.tipoEquipo,
            e.marcaModelo,
            e.numeroSerie,
            e.estadoOperativo,
            e.idSector,
            COALESCE(s.nombreOficina, 'Sector no asignado') AS nombreSector
        FROM Equipos e
        LEFT JOIN Sectores s ON e.idSector = s.idSector
        WHERE e.idEquipo = ?
    `;

    db.query(qEquipo, [id], (errEq, eqResults) => {
        if (errEq) {
            console.error('Error al consultar equipo para historial:', errEq);
            return res.status(500).json({ message: 'Error al consultar datos del equipo.' });
        }

        if (eqResults.length === 0) {
            return res.status(404).json({ message: 'Equipo no encontrado.' });
        }

        const equipo = eqResults[0];

        // 2. Historial patrimonial (Altas, traslados y bajas de sector)
        const qHist = `
            SELECT 
                h.idHistorial,
                h.fechaCambio,
                h.motivoBaja,
                h.idSectorAnterior,
                COALESCE(sAnt.nombreOficina, 'Alta inicial') AS sectorAnterior,
                h.idSectorNuevo,
                COALESCE(sNue.nombreOficina, 'Baja patrimonial / Descarte') AS sectorNuevo
            FROM Historial_Equipos h
            LEFT JOIN Sectores sAnt ON h.idSectorAnterior = sAnt.idSector
            LEFT JOIN Sectores sNue ON h.idSectorNuevo = sNue.idSector
            WHERE h.idEquipo = ?
            ORDER BY h.fechaCambio DESC
        `;

        // 3. Movimientos de insumos asociados al equipo
        const qMov = `
            SELECT 
                dm.idDetalle,
                m.idMovimiento,
                m.fechaHora,
                m.tipoMovimiento,
                m.comprobanteRef,
                m.agenteReceptor,
                dm.cantidadAfectada,
                i.descripcion AS insumoDescripcion,
                i.codigoInterno AS insumoCodigo,
                COALESCE(u.username, 'Técnico de Guardia') AS operador
            FROM Detalle_Movimientos dm
            JOIN Movimientos m ON dm.idMovimiento = m.idMovimiento
            JOIN Insumos i ON dm.idInsumo = i.idInsumo
            LEFT JOIN Usuarios u ON m.idUsuario = u.idUsuario
            WHERE dm.idEquipoDestino = ?
            ORDER BY m.fechaHora DESC
        `;

        // 4. Auditoría de mantenimientos y cambios técnicos
        const qLog = `
            SELECT 
                l.idLog,
                l.fechaHora,
                l.accionRealizada,
                COALESCE(u.username, 'Administrador') AS operador
            FROM Log_Auditoria l
            LEFT JOIN Usuarios u ON l.idUsuario = u.idUsuario
            WHERE l.moduloAfectado = 'Equipos'
              AND (l.accionRealizada LIKE ? OR l.accionRealizada LIKE ?)
              AND (l.accionRealizada LIKE '%Mantenimiento%' OR l.accionRealizada LIKE '%Reparación%')
            ORDER BY l.fechaHora DESC
        `;

        db.query(qHist, [id], (errHist, histResults = []) => {
            if (errHist) {
                console.error('Error al obtener historial patrimonial:', errHist);
                return res.status(500).json({ message: 'Error interno al consultar historial.' });
            }

            db.query(qMov, [id], (errMov, movResults = []) => {
                if (errMov) {
                    console.error('Error al obtener movimientos del equipo:', errMov);
                    return res.status(500).json({ message: 'Error interno al consultar movimientos de insumos.' });
                }

                db.query(qLog, [`%equipo ID ${id} %`, `%equipo ID ${id}:%`], (errLog, logResults = []) => {
                    if (errLog) {
                        console.error('Error al obtener logs de mantenimiento:', errLog);
                        return res.status(500).json({ message: 'Error interno al consultar auditoría técnica.' });
                    }

                    const hitos = [];

                    // Procesar registros de Historial_Equipos
                    (histResults || []).forEach((h) => {
                        let tipoEvento = 'TRASLADO';
                        let titulo = 'Traslado de Dependencia';
                        let badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';
                        let dotColor = 'bg-amber-500';

                        const motivoLower = (h.motivoBaja || '').toLowerCase();

                        if (!h.idSectorAnterior) {
                            tipoEvento = 'ALTA';
                            titulo = 'Alta Inicial en Sistema';
                            badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                            dotColor = 'bg-emerald-500';
                        } else if (!h.idSectorNuevo || motivoLower.includes('baja')) {
                            tipoEvento = 'BAJA';
                            titulo = 'Baja Patrimonial Definitiva';
                            badgeColor = 'bg-rose-50 text-rose-600 border-rose-200';
                            dotColor = 'bg-rose-500';
                        } else if (motivoLower.includes('mantenimiento') || motivoLower.includes('reparación') || motivoLower.includes('técnico') || motivoLower.includes('retorno') || motivoLower.includes('operativo')) {
                            const esRetorno = motivoLower.includes('retorno') || motivoLower.includes('operativo') || motivoLower.includes('restablecido');
                            tipoEvento = 'MANTENIMIENTO';
                            titulo = esRetorno ? 'Retorno a Servicio Operativo' : 'Envío a Mantenimiento Técnico';
                            badgeColor = esRetorno ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-purple-50 text-purple-600 border-purple-200';
                            dotColor = esRetorno ? 'bg-emerald-500' : 'bg-purple-500';
                        } else if (motivoLower.includes('depósito') || motivoLower.includes('reserva')) {
                            tipoEvento = 'DEPÓSITO';
                            titulo = 'Reserva / Depósito Institucional';
                            badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
                            dotColor = 'bg-blue-500';
                        } else if (h.idSectorAnterior !== h.idSectorNuevo) {
                            tipoEvento = 'TRASLADO';
                            titulo = 'Traslado de Dependencia';
                            badgeColor = 'bg-amber-50 text-amber-600 border-amber-200';
                            dotColor = 'bg-amber-500';
                        }

                        const esTraslado = tipoEvento === 'TRASLADO';

                        hitos.push({
                            id: `hist-${h.idHistorial}`,
                            idHistorial: h.idHistorial,
                            tipoEvento,
                            titulo,
                            badgeColor,
                            dotColor,
                            fechaRaw: h.fechaCambio,
                            fecha: formatearFechaHito(h.fechaCambio),
                            fechaCambio: formatearFechaHito(h.fechaCambio),
                            descripcion: h.motivoBaja || (esTraslado ? `Reubicación física de ${h.sectorAnterior} a ${h.sectorNuevo}.` : 'Registro de movimiento patrimonial.'),
                            origen: esTraslado ? (h.idSectorAnterior ? h.sectorAnterior : null) : null,
                            destino: esTraslado ? (h.idSectorNuevo ? h.sectorNuevo : null) : null,
                            sectorAnterior: h.sectorAnterior || 'Alta inicial',
                            sectorNuevo: h.sectorNuevo || 'Baja patrimonial / Descarte',
                            motivoBaja: h.motivoBaja,
                            operador: 'Administración Patrimonial'
                        });
                    });

                    // Procesar movimientos de insumos
                    (movResults || []).forEach((m) => {
                        hitos.push({
                            id: `mov-${m.idDetalle}`,
                            idHistorial: `mov-${m.idDetalle}`,
                            tipoEvento: 'ENTREGA',
                            titulo: `Asignación de ${m.insumoDescripcion}`,
                            badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
                            dotColor: 'bg-blue-500',
                            fechaRaw: m.fechaHora,
                            fecha: formatearFechaHito(m.fechaHora),
                            fechaCambio: formatearFechaHito(m.fechaHora),
                            descripcion: `Asignación de ${m.cantidadAfectada} unidad(es) de ${m.insumoDescripcion} (${m.insumoCodigo || 'S/C'}). Ref: ${m.comprobanteRef || 'S/N'}. Destino: ${m.agenteReceptor || equipo.nombreSector}.`,
                            origen: 'Depósito Central',
                            destino: m.agenteReceptor || equipo.nombreSector,
                            sectorAnterior: 'Depósito Central',
                            sectorNuevo: m.agenteReceptor || equipo.nombreSector,
                            motivoBaja: `Asignación de insumo: ${m.insumoDescripcion}`,
                            operador: m.operador || 'Técnico TEP'
                        });
                    });

                    // Procesar logs de mantenimiento
                    (logResults || []).forEach((l) => {
                        const esIngreso = l.accionRealizada.toLowerCase().includes('en mantenimiento');
                        hitos.push({
                            id: `log-${l.idLog}`,
                            idHistorial: `log-${l.idLog}`,
                            tipoEvento: 'MANTENIMIENTO',
                            titulo: esIngreso ? 'Envío a Mantenimiento Técnico' : 'Retorno a Servicio Operativo',
                            badgeColor: esIngreso ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
                            dotColor: esIngreso ? 'bg-purple-500' : 'bg-emerald-500',
                            fechaRaw: l.fechaHora,
                            fecha: formatearFechaHito(l.fechaHora),
                            fechaCambio: formatearFechaHito(l.fechaHora),
                            descripcion: l.accionRealizada,
                            origen: null,
                            destino: null,
                            sectorAnterior: 'Área Técnica',
                            sectorNuevo: equipo.nombreSector,
                            motivoBaja: l.accionRealizada,
                            operador: l.operador || 'Administrador'
                        });
                    });

                    // Si no tiene ningún hito de ALTA, sintetizar el hito inicial
                    const tieneAlta = hitos.some((h) => h.tipoEvento === 'ALTA');
                    if (!tieneAlta) {
                        hitos.push({
                            id: `alta-${equipo.idEquipo}`,
                            idHistorial: 0,
                            tipoEvento: 'ALTA',
                            titulo: 'Alta Patrimonial en Sistema',
                            badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                            dotColor: 'bg-emerald-500',
                            fechaRaw: new Date(0),
                            fecha: 'Registro Inicial',
                            fechaCambio: 'Registro Inicial',
                            descripcion: `Ingreso al inventario patrimonial del TEP: ${equipo.tipoEquipo} ${equipo.marcaModelo} (S/N: ${equipo.numeroSerie || 'S/N'}). Dependencia inicial: ${equipo.nombreSector}.`,
                            origen: null,
                            destino: equipo.nombreSector,
                            sectorAnterior: 'Alta patrimonial',
                            sectorNuevo: equipo.nombreSector,
                            motivoBaja: 'Ingreso inicial patrimonial',
                            operador: 'Administración TEP'
                        });
                    }

                    // Ordenar cronológicamente descendente
                    hitos.sort((a, b) => {
                        const dateA = a.fechaRaw ? new Date(a.fechaRaw).getTime() : 0;
                        const dateB = b.fechaRaw ? new Date(b.fechaRaw).getTime() : 0;
                        return dateB - dateA;
                    });

                    return res.status(200).json(hitos);
                });
            });
        });
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
    // Admite "Operativo", "En Reparación", "En Mantenimiento", "Baja", etc.
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

    // 4. Verificación de colisión de red (IP estática duplicada en equipos activos)
    const validarColisionIP = (callback) => {
        if (ip && ip !== '0.0.0.0') {
            const queryIP = "SELECT idEquipo, marcaModelo, estadoOperativo FROM Equipos WHERE ipFija = ? AND estadoOperativo != 'Baja' LIMIT 1";
            db.query(queryIP, [ip], (errIP, resultsIP) => {
                if (errIP) return callback(errIP);
                if (resultsIP.length > 0) {
                    const existente = resultsIP[0];
                    return callback({
                        isCollision: true,
                        message: `Conflicto de red: la dirección IP "${ip}" ya está asignada al equipo activo ID ${existente.idEquipo} (${existente.marcaModelo}).`
                    });
                }
                return callback(null);
            });
        } else {
            callback(null);
        }
    };

    validarColisionIP((errColision) => {
        if (errColision) {
            if (errColision.isCollision) {
                return res.status(409).json({ message: errColision.message });
            }
            console.error('Error al validar IP:', errColision);
            return res.status(500).json({ message: 'Error al verificar disponibilidad de IP.' });
        }

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

        db.query(query, values, async (err, result) => {
            if (err) {
                console.error('Error al registrar equipo:', err);

                // Control de duplicados MySQL (UNIQUE constraints) -> 409 Conflict
                if (err.code === 'ER_DUP_ENTRY') {
                    const sqlMsg = err.sqlMessage || '';
                    if (sqlMsg.includes('uq_codPatrimonial') || sqlMsg.includes('codPatrimonial')) {
                        return res.status(409).json({ 
                            message: `Conflicto de duplicidad: el código patrimonial "${codPat}" ya está registrado en otro equipo.` 
                        });
                    }
                    if (sqlMsg.includes('uq_numeroSerie') || sqlMsg.includes('numeroSerie')) {
                        return res.status(409).json({ 
                            message: `Conflicto de duplicidad: el número de serie "${serie}" ya está registrado en el sistema.` 
                        });
                    }
                    return res.status(409).json({ 
                        message: 'Conflicto de duplicidad: ya existe un equipo con ese código patrimonial o número de serie.' 
                    });
                }

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
                    `Alta inicial de ${tipo} en sistema (Estado: ${estado})`
                );
                await registrarAuditoria(
                    idUsuario, 
                    `Alta de equipo ID ${idNuevo} [${tipo}]: ${marca} (S/N: ${serie}, IP: ${ip})`, 
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
    });
};

/**
 * Actualizar datos de un equipo existente con soporte polimórfico, colisión de IP y control de duplicados
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
    db.query('SELECT idSector, marcaModelo, tipoEquipo, codPatrimonial, estadoOperativo, ipFija FROM Equipos WHERE idEquipo = ?', [id], (findErr, findResults) => {
        if (findErr) {
            console.error('Error al consultar equipo para actualización:', findErr);
            return res.status(500).json({ message: 'Error interno al consultar el equipo.' });
        }

        if (findResults.length === 0) {
            return res.status(404).json({ message: 'No se encontró el equipo especificado.' });
        }

        const equipoPrevio = findResults[0];

        // 2. Validar colisión de red (si se actualiza la IP a una distinta de 0.0.0.0)
        const nuevaIP = ipFija !== undefined ? (ipFija ? ipFija.trim() : '0.0.0.0') : equipoPrevio.ipFija;
        const nuevoEstado = estadoOperativo !== undefined ? estadoOperativo.trim() : equipoPrevio.estadoOperativo;

        const validarColision = (cb) => {
            if (ipFija !== undefined && nuevaIP !== '0.0.0.0' && nuevaIP !== '' && nuevoEstado !== 'Baja') {
                const queryColision = "SELECT idEquipo, marcaModelo FROM Equipos WHERE ipFija = ? AND idEquipo != ? AND estadoOperativo != 'Baja' LIMIT 1";
                db.query(queryColision, [nuevaIP, id], (errCol, resCol) => {
                    if (errCol) return cb(errCol);
                    if (resCol.length > 0) {
                        return cb({
                            isCollision: true,
                            message: `Conflicto de red: la dirección IP "${nuevaIP}" ya está asignada al equipo activo ID ${resCol[0].idEquipo} (${resCol[0].marcaModelo}).`
                        });
                    }
                    cb(null);
                });
            } else {
                cb(null);
            }
        };

        validarColision((errCol) => {
            if (errCol) {
                if (errCol.isCollision) {
                    return res.status(409).json({ message: errCol.message });
                }
                console.error('Error al verificar colisión de IP:', errCol);
                return res.status(500).json({ message: 'Error al verificar disponibilidad de IP.' });
            }

            // 3. Construir dinámicamente campos a actualizar respetando NULLs
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

            const query = `UPDATE Equipos SET ${campos.join(', ')} WHERE idEquipo = ?`;
            values.push(id);

            db.query(query, values, async (err, result) => {
                if (err) {
                    console.error('Error al actualizar equipo:', err);

                    // Captura de duplicidad en actualización -> 409 Conflict
                    if (err.code === 'ER_DUP_ENTRY') {
                        const sqlMsg = err.sqlMessage || '';
                        if (sqlMsg.includes('uq_codPatrimonial') || sqlMsg.includes('codPatrimonial')) {
                            return res.status(409).json({ 
                                message: 'Conflicto de duplicidad: el código patrimonial ingresado ya pertenece a otro equipo.' 
                            });
                        }
                        if (sqlMsg.includes('uq_numeroSerie') || sqlMsg.includes('numeroSerie')) {
                            return res.status(409).json({ 
                                message: 'Conflicto de duplicidad: el número de serie ingresado ya pertenece a otro equipo.' 
                            });
                        }
                        return res.status(409).json({ 
                            message: 'Conflicto de duplicidad: ya existe un equipo con ese código patrimonial o número de serie.' 
                        });
                    }

                    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
                        return res.status(400).json({ 
                            message: 'El nuevo sector o insumo compatible especificado no existe.' 
                        });
                    }

                    return res.status(500).json({ 
                        message: 'Error interno al actualizar el equipo.' 
                    });
                }

                // 4. Side-effects: Disparar Historial de traslado, mantenimiento o baja si hubo cambio
                try {
                    const usuarioId = req.body?.idUsuario || req.usuario?.idUsuario || 1;
                    const previoSectorId = equipoPrevio.idSector !== null ? parseInt(equipoPrevio.idSector, 10) : null;
                    const nuevoSectorId = idSector !== undefined && idSector !== null ? parseInt(idSector, 10) : previoSectorId;
                    const estadoPrev = (equipoPrevio.estadoOperativo || '').trim();
                    const estadoNuevo = (nuevoEstado || estadoPrev).trim();

                    // Caso A: Cambio de Sector físico (Traslado)
                    if (idSector !== undefined && nuevoSectorId !== previoSectorId) {
                        await registrarHistorialEquipo(
                            id,
                            previoSectorId,
                            nuevoSectorId,
                            motivoBaja || 'Traslado de sector'
                        );
                    }

                    // Caso B: El estado cambió a 'Baja'
                    if (estadoOperativo !== undefined && estadoNuevo.toLowerCase() === 'baja' && estadoPrev.toLowerCase() !== 'baja') {
                        await registrarHistorialEquipo(
                            id,
                            previoSectorId,
                            null,
                            motivoBaja || 'Baja definitiva del equipo (RN-02)'
                        );
                    } else if (estadoOperativo !== undefined && estadoNuevo.toLowerCase() !== estadoPrev.toLowerCase()) {
                        // Caso C: El estado cambió (e.g. En Mantenimiento, Operativo, En Depósito)
                        let motivoEstado = motivoBaja;
                        if (!motivoEstado) {
                            if (estadoNuevo.toLowerCase() === 'en mantenimiento') {
                                motivoEstado = 'Envío a mantenimiento técnico / reparación';
                            } else if (estadoNuevo.toLowerCase() === 'operativo' && estadoPrev.toLowerCase() === 'en mantenimiento') {
                                motivoEstado = 'Retorno de servicio técnico - Restablecido a Operativo';
                            } else if (estadoNuevo.toLowerCase() === 'en depósito') {
                                motivoEstado = 'Puesto en depósito / reserva técnica';
                            } else {
                                motivoEstado = `Cambio de estado operativo a ${estadoNuevo}`;
                            }
                        }

                        await registrarHistorialEquipo(
                            id,
                            previoSectorId,
                            previoSectorId,
                            motivoEstado
                        );
                    }

                    // Registro en Log_Auditoria
                    await registrarAuditoria(
                        usuarioId,
                        `Actualización de equipo ID ${id} [${tipoEquipo || equipoPrevio.tipoEquipo}]: ${marcaModelo || equipoPrevio.marcaModelo} (Estado: ${nuevoEstado})`,
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
        });
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

        // Baja lógica estándar (normativa judicial del Tribunal)
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
