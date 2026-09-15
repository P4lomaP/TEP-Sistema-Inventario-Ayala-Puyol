const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Clave secreta para firmar el JWT (se puede configurar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'tep_inventario_secret_key_2026';

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

module.exports = {
    login
};
