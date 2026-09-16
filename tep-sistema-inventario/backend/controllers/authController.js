const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Clave secreta para firmar el JWT obtenida desde variables de entorno (.env) o fallback seguro
const JWT_SECRET = process.env.JWT_SECRET || 'una_clave_larga_y_segura_para_el_tribunal';

/**
 * Controlador para el inicio de sesión (Login)
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

            // Generar token JWT con idUsuario y rolAcceso
            const token = jwt.sign(
                { 
                    idUsuario: usuario.idUsuario, 
                    username: usuario.username,
                    rolAcceso: usuario.rolAcceso 
                },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            // Respuesta exitosa (sin exponer la contraseña)
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

            const insertQuery = `
                INSERT INTO Usuarios (username, password, rolAcceso, estadoActivo)
                VALUES (?, ?, ?, 1)
            `;

            db.query(insertQuery, [username, hashedPassword, rol], (errInsert, result) => {
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

module.exports = {
    login,
    register
};
