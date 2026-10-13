const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { registrarAuditoria } = require('../utils/auditoriaHelper');

// Clave secreta para firmar el JWT obtenida desde variables de entorno (.env) o fallback seguro
const JWT_SECRET = process.env.JWT_SECRET || 'una_clave_larga_y_segura_para_el_tribunal';

/**
 * Controlador para el inicio de sesión (Login)
 * Token con expiración a 30m para cumplir con el cierre automático por inactividad
 */
const login = async (req, res) => {
    const { username, password } = req.body;

    // Validación básica de campos requeridos
    if (!username || !password) {
        return res.status(400).json({ 
            message: 'Por favor, ingrese usuario y contraseña.' 
        });
    }

    const query = 'SELECT * FROM Usuarios WHERE username = ?';

    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Error en la consulta de login:', err);
            return res.status(500).json({ 
                message: 'Error interno del servidor al consultar la base de datos.' 
            });
        }

        // Si no existe ningún usuario con ese username
        if (results.length === 0) {
            return res.status(401).json({ 
                message: 'Credenciales inválidas. Usuario no encontrado.' 
            });
        }

        const usuario = results[0];

        // Verificar si el usuario se encuentra activo (Baja lógica / Bloqueo)
        if (usuario.estadoActivo !== 1) {
            return res.status(403).json({ 
                message: 'Usuario inactivo o deshabilitado. Comuníquese con el Administrador.' 
            });
        }

        try {
            // Comparar contraseña ingresada con el hash almacenado
            const isMatch = await bcrypt.compare(password, usuario.password);
            
            if (!isMatch) {
                return res.status(401).json({ 
                    message: 'Credenciales inválidas. Contraseña incorrecta.' 
                });
            }

            // Generar token JWT con tiempo de expiración de 30 minutos renovable por actividad
            const token = jwt.sign(
                { 
                    idUsuario: usuario.idUsuario, 
                    username: usuario.username,
                    rolAcceso: usuario.rolAcceso 
                },
                JWT_SECRET,
                { expiresIn: '30m' }
            );

            // Registrar auditoría de inicio de sesión exitoso
            registrarAuditoria(usuario.idUsuario, `Inicio de sesión exitoso para ${usuario.username}`, 'Seguridad').catch(() => {});

            // Respuesta exitosa (sin exponer la contraseña ni el pin)
            return res.status(200).json({
                message: '¡Inicio de sesión exitoso!',
                token,
                usuario: {
                    idUsuario: usuario.idUsuario,
                    username: usuario.username,
                    rolAcceso: usuario.rolAcceso
                }
            });

        } catch (error) {
            console.error('Error al procesar la contraseña o generar token:', error);
            return res.status(500).json({ 
                message: 'Error al procesar la autenticación del usuario.' 
            });
        }
    });
};

/**
 * Controlador para el registro de nuevos operadores (Register)
 * Genera automáticamente un PIN numérico de 6 dígitos para recuperación interna de contraseñas.
 */
const register = async (req, res) => {
    const { username, password, rolAcceso } = req.body;

    // Validación de campos requeridos
    if (!username || !password) {
        return res.status(400).json({ 
            message: 'Por favor, complete todos los campos obligatorios.' 
        });
    }

    if (password.length < 8) {
        return res.status(400).json({ 
            message: 'La contraseña debe tener al menos 8 caracteres.' 
        });
    }

    // Validar y normalizar rol de acceso (soporta 'Administrador', 'ADMIN', 'admin', etc.)
    let rol = rolAcceso || 'Tecnico';
    const rolNorm = String(rol).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (['administrador', 'admin'].includes(rolNorm)) {
        rol = 'Administrador';
    } else if (['tecnico', 'tec'].includes(rolNorm)) {
        rol = 'Tecnico';
    } else if (['auditor'].includes(rolNorm)) {
        rol = 'Auditor';
    } else {
        return res.status(400).json({ 
            message: 'Rol de acceso inválido. Debe ser Administrador, Tecnico o Auditor.' 
        });
    }

    const checkQuery = 'SELECT idUsuario FROM Usuarios WHERE username = ?';

    db.query(checkQuery, [username], async (err, results) => {
        if (err) {
            console.error('Error al verificar existencia de usuario:', err);
            return res.status(500).json({ 
                message: 'Error interno del servidor al consultar la base de datos.' 
            });
        }

        if (results.length > 0) {
            return res.status(400).json({ 
                message: 'El nombre de usuario ya se encuentra registrado.' 
            });
        }

        try {
            // Hashear contraseña con bcrypt
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Generar PIN aleatorio de 6 dígitos numéricos (CSPRNG)
            const pinGenerado = crypto.randomInt(100000, 1000000).toString();

            const insertQuery = `
                INSERT INTO Usuarios (username, password, rolAcceso, estadoActivo, pinRecuperacion, fechaUltimoPin)
                VALUES (?, ?, ?, 1, ?, NOW())
            `;

            db.query(insertQuery, [username, hashedPassword, rol, pinGenerado], (errInsert, result) => {
                if (errInsert) {
                    console.error('Error al insertar nuevo usuario:', errInsert);
                    return res.status(500).json({ 
                        message: 'Error interno al registrar el usuario en la base de datos.' 
                    });
                }

                // Registrar evento en auditoría
                registrarAuditoria(
                    result.insertId,
                    `Alta de nuevo usuario: ${username} (Rol: ${rol}) con generación inicial de PIN`,
                    'Seguridad'
                ).catch(() => {});

                // Devolver el PIN en texto claro en la respuesta exitosa para que el frontend se lo notifique al usuario
                return res.status(201).json({
                    message: '¡Usuario registrado exitosamente! Guarde su PIN de recuperación en un lugar seguro.',
                    pinRecuperacion: pinGenerado,
                    usuario: {
                        idUsuario: result.insertId,
                        username,
                        rolAcceso: rol
                    }
                });
            });

        } catch (error) {
            console.error('Error al hashear la contraseña:', error);
            return res.status(500).json({ 
                message: 'Error al procesar la seguridad de la contraseña.' 
            });
        }
    });
};

/**
 * Validar si un PIN ingresado para recuperación es correcto antes de solicitar nueva contraseña
 * POST /api/auth/verificar-pin
 */
const verificarPin = async (req, res) => {
    const { username, pinRecuperacion } = req.body;

    if (!username || !pinRecuperacion) {
        return res.status(400).json({ 
            message: 'Por favor, ingrese su usuario y su PIN de recuperación.' 
        });
    }

    const query = 'SELECT idUsuario, username, pinRecuperacion, estadoActivo, fechaUltimoPin FROM Usuarios WHERE username = ?';

    db.query(query, [username.trim()], (err, results) => {
        if (err) {
            console.error('Error al verificar PIN:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'El usuario especificado no existe.' });
        }

        const usuario = results[0];

        if (usuario.estadoActivo !== 1) {
            return res.status(403).json({ message: 'Usuario inactivo o deshabilitado.' });
        }

        // Calcular días restantes de cooldown (política estricta de 30 días)
        let diasRestantes = 0;
        if (usuario.fechaUltimoPin) {
            const ahora = new Date();
            const fechaUltimo = new Date(usuario.fechaUltimoPin);
            const diferenciaMs = ahora.getTime() - fechaUltimo.getTime();
            const diasTranscurridos = diferenciaMs / (1000 * 60 * 60 * 24);
            const COOLDOWN_DIAS = 30;
            if (diasTranscurridos < COOLDOWN_DIAS) {
                diasRestantes = Math.ceil(COOLDOWN_DIAS - diasTranscurridos);
            }
        }

        if (!usuario.pinRecuperacion || usuario.pinRecuperacion.trim() !== String(pinRecuperacion).trim()) {
            return res.status(401).json({ 
                valido: false,
                message: 'El PIN de recuperación es incorrecto o no ha sido asignado.',
                diasRestantesCooldown: diasRestantes,
                puedeSolicitar: diasRestantes === 0
            });
        }

        return res.status(200).json({
            valido: true,
            message: 'PIN verificado exitosamente. Ahora puede modificar su contraseña.'
        });
    });
};

/**
 * Notificar al Administrador que un operador olvidó su PIN y solicita regeneración
 * Solo se permite si ya transcurrieron 30 días desde el último PIN (evita solicitudes frecuentes)
 * POST /api/auth/solicitar-pin
 */
const solicitarNuevoPin = async (req, res) => {
    const { username } = req.body;

    if (!username || !username.trim()) {
        return res.status(400).json({ message: 'Debe ingresar su nombre de usuario.' });
    }

    const query = 'SELECT idUsuario, username, estadoActivo, fechaUltimoPin FROM Usuarios WHERE username = ?';

    db.query(query, [username.trim()], (err, results) => {
        if (err) {
            console.error('Error al buscar usuario para solicitar PIN:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No se encontró ningún usuario con ese identificador.' });
        }

        const usuario = results[0];

        if (usuario.estadoActivo !== 1) {
            return res.status(403).json({ message: 'Usuario inactivo o deshabilitado.' });
        }

        // Regla estricta: No se puede solicitar otro PIN hasta que pasen 30 días
        let diasRestantes = 0;
        if (usuario.fechaUltimoPin) {
            const ahora = new Date();
            const fechaUltimo = new Date(usuario.fechaUltimoPin);
            const diferenciaMs = ahora.getTime() - fechaUltimo.getTime();
            const diasTranscurridos = diferenciaMs / (1000 * 60 * 60 * 24);
            const COOLDOWN_DIAS = 30;
            if (diasTranscurridos < COOLDOWN_DIAS) {
                diasRestantes = Math.ceil(COOLDOWN_DIAS - diasTranscurridos);
                return res.status(429).json({
                    message: `No podés solicitar un nuevo PIN aún. Debés esperar ${diasRestantes} día(s) restante(s). Por seguridad, el PIN dura 30 días obligando a recordarlo o anotarlo en lugar seguro.`,
                    diasRestantesCooldown: diasRestantes,
                    bloqueadoPorCooldown: true
                });
            }
        }

        // Marcar la solicitud en base de datos si ya cumplió los 30 días
        const updateQuery = 'UPDATE Usuarios SET solicitaPin = 1 WHERE idUsuario = ?';
        db.query(updateQuery, [usuario.idUsuario], async (updateErr) => {
            if (updateErr) {
                console.error('Error al registrar solicitud de PIN:', updateErr);
                return res.status(500).json({ message: 'Error al registrar la solicitud.' });
            }

            // Registrar en auditoría institucional
            await registrarAuditoria(
                usuario.idUsuario,
                `El usuario @${usuario.username} solicitó la regeneración de un nuevo PIN al Administrador tras cumplir los 30 días de cooldown`,
                'Seguridad'
            ).catch(() => {});

            return res.status(200).json({
                message: 'Solicitud enviada al Administrador con éxito. Ha cumplido el período de 30 días.',
                solicitado: true,
                diasRestantesCooldown: 0
            });
        });
    });
};

/**
 * Endpoint para blanquear/recuperar contraseña validando username y pinRecuperacion (Autogestión del usuario)
 * POST /api/auth/recuperar-password
 */
const recuperarPassword = async (req, res) => {
    const { username, pinRecuperacion, nuevaPassword, password } = req.body;
    const newPassword = nuevaPassword || password;

    if (!username || !pinRecuperacion || !newPassword) {
        return res.status(400).json({ 
            message: 'Nombre de usuario, PIN de recuperación y nueva contraseña son obligatorios.' 
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ 
            message: 'La nueva contraseña debe contener al menos 8 caracteres.' 
        });
    }

    const query = 'SELECT idUsuario, username, pinRecuperacion, estadoActivo FROM Usuarios WHERE username = ?';

    db.query(query, [username.trim()], async (err, results) => {
        if (err) {
            console.error('Error al consultar usuario para recuperación:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const usuario = results[0];

        if (usuario.estadoActivo !== 1) {
            return res.status(403).json({ message: 'Usuario inactivo o deshabilitado.' });
        }

        // Validación estricta de PIN sin requerir envíos de emails externos
        if (!usuario.pinRecuperacion || usuario.pinRecuperacion.trim() !== String(pinRecuperacion).trim()) {
            return res.status(401).json({ 
                message: 'El PIN de recuperación es incorrecto o no ha sido asignado.' 
            });
        }

        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

            const updateQuery = 'UPDATE Usuarios SET password = ?, solicitaPin = 0 WHERE idUsuario = ?';
            db.query(updateQuery, [hashedPassword, usuario.idUsuario], async (updateErr) => {
                if (updateErr) {
                    console.error('Error al actualizar contraseña:', updateErr);
                    return res.status(500).json({ message: 'Error al actualizar la contraseña.' });
                }

                // Registrar evento en auditoría
                registrarAuditoria(
                    usuario.idUsuario,
                    `Blanqueo de contraseña exitoso mediante PIN para usuario ${usuario.username}`,
                    'Seguridad'
                ).catch(() => {});

                return res.status(200).json({
                    message: 'Contraseña actualizada exitosamente. Ya puede iniciar sesión con su nueva clave.'
                });
            });

        } catch (error) {
            console.error('Error al encriptar nueva contraseña:', error);
            return res.status(500).json({ message: 'Error al procesar la nueva contraseña.' });
        }
    });
};

/**
 * Controlador de Administrador: Regeneración de PIN con Cooldown de 30 días
 * Permite al Admin regenerar un nuevo PIN cuando el usuario olvidó su contraseña Y su PIN.
 * PUT /api/auth/admin/regenerar-pin/:idUsuario
 */
const regenerarPinAdmin = async (req, res) => {
    const { idUsuario } = req.params;
    const adminOperador = req.usuario;

    // 1. Verificación de permisos de Administrador
    if (!adminOperador || adminOperador.rolAcceso !== 'Administrador') {
        return res.status(403).json({ 
            message: 'Acceso denegado: Solo los administradores pueden regenerar PINs de recuperación.' 
        });
    }

    const usuarioId = parseInt(idUsuario, 10);
    if (isNaN(usuarioId)) {
        return res.status(400).json({ 
            message: 'El ID de usuario debe ser un número entero válido.' 
        });
    }

    // 2. Buscar usuario objetivo
    const query = 'SELECT idUsuario, username, fechaUltimoPin, estadoActivo, solicitaPin FROM Usuarios WHERE idUsuario = ?';

    db.query(query, [usuarioId], (err, results) => {
        if (err) {
            console.error('Error al consultar usuario para regenerar PIN:', err);
            return res.status(500).json({ message: 'Error interno del servidor.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: `No se encontró ningún usuario con ID ${usuarioId}.` });
        }

        const usuario = results[0];

        // 3. Regla de Cooldown de 30 días
        if (usuario.fechaUltimoPin) {
            const ahora = new Date();
            const fechaUltimo = new Date(usuario.fechaUltimoPin);
            const diferenciaMs = ahora.getTime() - fechaUltimo.getTime();
            const diasTranscurridos = diferenciaMs / (1000 * 60 * 60 * 24);
            const COOLDOWN_DIAS = 30;

            if (diasTranscurridos < COOLDOWN_DIAS) {
                const diasRestantes = Math.ceil(COOLDOWN_DIAS - diasTranscurridos);
                return res.status(429).json({ 
                    message: `Cooldown activo: No es posible regenerar el PIN aún. Debe esperar ${diasRestantes} día(s) restante(s).`,
                    diasRestantes,
                    fechaUltimoPin: usuario.fechaUltimoPin
                });
            }
        }

        // 4. Generar nuevo PIN criptográficamente seguro de 6 dígitos
        const nuevoPin = crypto.randomInt(100000, 1000000).toString();

        // 5. Actualizar en base de datos reseteando fechaUltimoPin a NOW() y solicitaPin = 0
        const updateQuery = `
            UPDATE Usuarios 
            SET pinRecuperacion = ?, fechaUltimoPin = NOW(), solicitaPin = 0 
            WHERE idUsuario = ?
        `;

        db.query(updateQuery, [nuevoPin, usuarioId], (updateErr) => {
            if (updateErr) {
                console.error('Error al actualizar PIN de usuario:', updateErr);
                return res.status(500).json({ message: 'Error interno al actualizar el PIN.' });
            }

            // 6. Registrar en auditoría
            registrarAuditoria(
                adminOperador.idUsuario,
                `Regeneración de PIN por Administrador para el usuario ${usuario.username} (ID: ${usuarioId})`,
                'Seguridad'
            ).catch(() => {});

            // 7. Devolver el nuevo PIN en texto claro para que el Admin se lo informe al usuario
            return res.status(200).json({
                message: `Nuevo PIN de recuperación generado exitosamente para el usuario ${usuario.username}.`,
                idUsuario: usuario.idUsuario,
                username: usuario.username,
                nuevoPin,
                fechaUltimoPin: new Date()
            });
        });
    });
};

/**
 * Controlador de Administrador: Descartar solicitud de regeneración de PIN
 * PUT /api/auth/admin/descartar-solicitud-pin/:idUsuario
 */
const descartarSolicitudPinAdmin = async (req, res) => {
    const { idUsuario } = req.params;
    const adminOperador = req.usuario;

    if (!adminOperador || adminOperador.rolAcceso !== 'Administrador') {
        return res.status(403).json({ message: 'Acceso denegado: Solo los administradores pueden descartar solicitudes.' });
    }

    const usuarioId = parseInt(idUsuario, 10);
    if (isNaN(usuarioId)) {
        return res.status(400).json({ message: 'ID de usuario inválido.' });
    }

    const updateQuery = 'UPDATE Usuarios SET solicitaPin = 0 WHERE idUsuario = ?';
    db.query(updateQuery, [usuarioId], async (err) => {
        if (err) {
            console.error('Error al descartar solicitud de PIN:', err);
            return res.status(500).json({ message: 'Error al descartar solicitud.' });
        }

        await registrarAuditoria(
            adminOperador.idUsuario,
            `Descarte de solicitud de regeneración de PIN para el usuario ID ${usuarioId}`,
            'Seguridad'
        ).catch(() => {});

        return res.status(200).json({ message: 'Solicitud de PIN descartada correctamente.' });
    });
};

/**
 * Consultar perfil del usuario autenticado en sesión
 * GET /api/auth/perfil
 */
const obtenerPerfil = async (req, res) => {
    try {
        const idUsuario = req.usuario?.idUsuario;
        if (!idUsuario) {
            return res.status(401).json({ message: 'No autenticado.' });
        }

        const query = `
            SELECT 
                u.idUsuario,
                CONCAT('USR-', LPAD(u.idUsuario, 3, '0')) AS codUsuario,
                u.username,
                u.rolAcceso,
                u.estadoActivo,
                CASE WHEN u.pinRecuperacion IS NOT NULL AND u.pinRecuperacion != '' THEN 1 ELSE 0 END AS tienePin,
                DATE_FORMAT(u.fechaUltimoPin, '%d/%m/%Y %H:%i') AS fechaUltimoPin,
                DATE_FORMAT(MIN(l.fechaHora), '%d/%m/%Y') AS fechaCreacion,
                DATE_FORMAT(MAX(l.fechaHora), '%d/%m/%Y %H:%i') AS ultimoAcceso,
                COUNT(l.idLog) AS totalOperaciones,
                DATEDIFF(NOW(), COALESCE(MIN(l.fechaHora), NOW())) + 1 AS diasActivo
            FROM Usuarios u
            LEFT JOIN Log_Auditoria l ON u.idUsuario = l.idUsuario
            WHERE u.idUsuario = ?
            GROUP BY u.idUsuario, u.username, u.rolAcceso, u.estadoActivo, u.pinRecuperacion, u.fechaUltimoPin
        `;

        db.query(query, [idUsuario], (err, results) => {
            if (err) {
                console.error('Error al obtener perfil:', err);
                return res.status(500).json({ message: 'Error interno al consultar perfil.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }

            const usr = results[0];
            return res.status(200).json({
                idUsuario: usr.idUsuario,
                codUsuario: usr.codUsuario,
                username: usr.username,
                rolAcceso: usr.rolAcceso,
                estadoActivo: usr.estadoActivo,
                estado: usr.estadoActivo === 1 ? 'Activo' : 'Inactivo',
                tienePin: usr.tienePin === 1,
                fechaUltimoPin: usr.fechaUltimoPin,
                fechaCreacion: usr.fechaCreacion || 'Reciente',
                ultimoAcceso: usr.ultimoAcceso || 'Hoy',
                diasActivo: usr.diasActivo || 1,
                totalOperaciones: usr.totalOperaciones || 0
            });
        });
    } catch (error) {
        console.error('Error en obtenerPerfil:', error);
        return res.status(500).json({ message: 'Error interno al consultar perfil.' });
    }
};

/**
 * Actualizar contraseña o PIN de recuperación del usuario en sesión
 * PUT /api/auth/perfil
 */
const actualizarPerfil = async (req, res) => {
    try {
        const idUsuario = req.usuario?.idUsuario;
        const { passwordActual, nuevoPassword, nuevoPin } = req.body;

        if (!passwordActual) {
            return res.status(400).json({
                message: 'Debe ingresar su contraseña actual para validar la operación de seguridad.'
            });
        }

        const query = 'SELECT idUsuario, username, password FROM Usuarios WHERE idUsuario = ?';
        db.query(query, [idUsuario], async (err, results) => {
            if (err) {
                console.error('Error al consultar usuario para actualizar perfil:', err);
                return res.status(500).json({ message: 'Error interno del servidor.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado.' });
            }

            const usuario = results[0];

            // Validar contraseña actual con bcrypt
            const isMatch = await bcrypt.compare(passwordActual, usuario.password);
            if (!isMatch) {
                return res.status(401).json({
                    message: 'La contraseña actual ingresada es incorrecta.'
                });
            }

            let updates = [];
            let values = [];
            let detallesAuditoria = [];

            // 1. Cambiar contraseña si se proporcionó una nueva
            if (nuevoPassword && nuevoPassword.trim() !== '') {
                if (nuevoPassword.length < 8) {
                    return res.status(400).json({
                        message: 'La nueva contraseña debe tener al menos 8 caracteres.'
                    });
                }
                const hashedPassword = await bcrypt.hash(nuevoPassword, 10);
                updates.push('password = ?');
                values.push(hashedPassword);
                detallesAuditoria.push('cambio de contraseña');
            }

            // 2. Cambiar PIN si se proporcionó uno nuevo
            if (nuevoPin && nuevoPin.trim() !== '') {
                const pinLimpio = String(nuevoPin).trim();
                if (!/^\d{4,6}$/.test(pinLimpio)) {
                    return res.status(400).json({
                        message: 'El PIN de recuperación debe ser numérico de 4 a 6 dígitos.'
                    });
                }
                updates.push('pinRecuperacion = ?', 'fechaUltimoPin = NOW()');
                values.push(pinLimpio);
                detallesAuditoria.push('actualización de PIN de recuperación');
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    message: 'No se indicaron cambios de contraseña ni de PIN.'
                });
            }

            values.push(idUsuario);
            const updateSql = `UPDATE Usuarios SET ${updates.join(', ')} WHERE idUsuario = ?`;

            db.query(updateSql, values, async (updateErr) => {
                if (updateErr) {
                    console.error('Error al actualizar seguridad de usuario:', updateErr);
                    return res.status(500).json({ message: 'Error al actualizar credenciales.' });
                }

                await registrarAuditoria(
                    idUsuario,
                    `Actualización de seguridad por usuario @${usuario.username}: ${detallesAuditoria.join(' y ')}.`,
                    'Seguridad'
                ).catch(() => {});

                return res.status(200).json({
                    message: 'Credenciales de seguridad actualizadas con éxito.',
                    tienePin: true
                });
            });
        });
    } catch (error) {
        console.error('Error en actualizarPerfil:', error);
        return res.status(500).json({ message: 'Error al procesar la actualización del perfil.' });
    }
};

module.exports = {
    login,
    register,
    verificarPin,
    solicitarNuevoPin,
    recuperarPassword,
    regenerarPinAdmin,
    descartarSolicitudPinAdmin,
    obtenerPerfil,
    actualizarPerfil
};
