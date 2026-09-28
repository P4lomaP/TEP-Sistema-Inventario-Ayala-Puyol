const jwt = require('jsonwebtoken');

// Clave secreta obtenida del entorno con fallback seguro sincronizado con authController
const JWT_SECRET = process.env.JWT_SECRET || 'una_clave_larga_y_segura_para_el_tribunal';

/**
 * Middleware para validar el token JWT y controlar la inactividad de sesión (30 minutos)
 * Header esperado: Authorization: Bearer <token>
 */
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    // 1. Validar presencia del header de autorización
    if (!authHeader) {
        return res.status(401).json({ 
            message: 'Acceso no autorizado. Token no proporcionado.' 
        });
    }

    // 2. Extraer el token del esquema Bearer <token>
    const partes = authHeader.trim().split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        return res.status(401).json({ 
            message: 'Formato de token inválido. Utilice el esquema Bearer <token>' 
        });
    }

    const token = partes[1];

    if (!token) {
        return res.status(401).json({ 
            message: 'Acceso no autorizado. Token no proporcionado.' 
        });
    }

    // 3. Verificación criptográfica y de tiempo de expiración
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            // Captura estricta de TokenExpiredError para el Frontend React
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Sesión expirada por inactividad (30 minutos sin uso). Vuelva a iniciar sesión.',
                    expired: true 
                });
            }

            // Token alterado, firma inválida o corrupto
            return res.status(403).json({ 
                message: 'Token inválido o adulterado.',
                error: err.message 
            });
        }

        // 4. Inyectar datos del operador autenticado en la petición
        req.usuario = decoded;

        // 5. Sesión deslizante: Renovar automáticamente el token por 30m en cada petición activa
        try {
            const tokenRenovado = jwt.sign(
                { 
                    idUsuario: decoded.idUsuario, 
                    username: decoded.username,
                    rolAcceso: decoded.rolAcceso 
                },
                JWT_SECRET,
                { expiresIn: '30m' }
            );
            res.setHeader('x-renewed-token', tokenRenovado);
            res.setHeader('Access-Control-Expose-Headers', 'x-renewed-token');
        } catch (renewErr) {
            // Continuar normalmente si falla la firma de renovación
        }

        next();
    });
};

/**
 * Middleware opcional para control de acceso basado en roles (RBAC)
 * @param {Array<string>} rolesPermitidos - Lista de roles autorizados (ej: ['Administrador', 'Tecnico'])
 */
const verificarRol = (rolesPermitidos = []) => {
    return (req, res, next) => {
        if (!req.usuario || !req.usuario.rolAcceso) {
            return res.status(403).json({ message: 'No se encontraron permisos asociados al usuario.' });
        }

        const normalizar = str => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        const rolUsuarioNorm = normalizar(req.usuario.rolAcceso);
        const permitidosNorm = rolesPermitidos.map(r => normalizar(r));

        if (!permitidosNorm.includes(rolUsuarioNorm)) {
            return res.status(403).json({ 
                message: `Acceso denegado: El rol "${req.usuario.rolAcceso}" no cuenta con los privilegios suficientes para esta acción.` 
            });
        }

        next();
    };
};

// Compatibilidad para require('../middlewares/authMiddleware') y desestructuración { verificarToken }
verificarToken.verificarToken = verificarToken;
verificarToken.verificarRol = verificarRol;

module.exports = verificarToken;
