const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
 */
const register = async (req, res) => {
    const { username, password, rolAcceso, pinRecuperacion } = req.body;

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
            const pin = pinRecuperacion ? String(pinRecuperacion).trim() : null;

            const insertQuery = `
                INSERT INTO Usuarios (username, password, rolAcceso, estadoActivo, pinRecuperacion)
                VALUES (?, ?, ?, 1, ?)
            `;

            db.query(insertQuery, [username, hashedPassword, rol, pin], (errInsert, result) => {
                if (errInsert) {
                    console.error('Error al insertar nuevo usuario:', errInsert);
                    return res.status(500).json({ 
                        message: 'Error interno al registrar el usuario en la base de datos.' 
                    });
                }

                return res.status(201).json({
                    message: '¡Usuario registrado exitosamente!',
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
 * Endpoint para blanquear/recuperar contraseña validando username y pinRecuperacion
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

module.exports = {
    login,
    register,
    recuperarPassword
};
