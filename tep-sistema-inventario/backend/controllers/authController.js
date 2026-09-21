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

            // Generar token JWT con tiempo de expiración de 30 minutos (inactividad)
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

    // Validar rol de acceso
    const rol = rolAcceso || 'Tecnico';
    const rolesValidos = ['Administrador', 'Tecnico', 'Auditor'];
    if (!rolesValidos.includes(rol)) {
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
                message: 'El nombre de usuario o correo ya se encuentra registrado.' 
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

            const updateQuery = 'UPDATE Usuarios SET password = ? WHERE idUsuario = ?';
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
    const query = 'SELECT idUsuario, username, fechaUltimoPin, estadoActivo FROM Usuarios WHERE idUsuario = ?';

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

        // 5. Actualizar en base de datos reseteando fechaUltimoPin a NOW()
        const updateQuery = `
            UPDATE Usuarios 
            SET pinRecuperacion = ?, fechaUltimoPin = NOW() 
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

module.exports = {
    login,
    register,
    recuperarPassword,
    regenerarPinAdmin
};
