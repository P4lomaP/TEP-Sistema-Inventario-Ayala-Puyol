const db = require('../database');

/**
 * Obtener todos los registros de auditoría con JOIN a Usuarios
 * GET /api/auditoria
 */
const obtenerAuditoria = (req, res) => {
    const query = `
        SELECT 
            l.idLog,
            DATE_FORMAT(l.fechaHora, '%Y-%m-%d %H:%i:%s') AS fechaHora,
            l.accionRealizada,
            l.moduloAfectado,
            l.idUsuario,
            COALESCE(u.username, 'Sistema') AS usuarioNombre,
            COALESCE(u.rolAcceso, 'Sistema') AS usuarioRol
        FROM Log_Auditoria l
        LEFT JOIN Usuarios u ON l.idUsuario = u.idUsuario
        ORDER BY l.fechaHora DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al consultar logs de auditoría:', err);
            return res.status(500).json({ 
                message: 'Error interno al consultar los registros de auditoría.' 
            });
        }

        return res.status(200).json(results);
    });
};

module.exports = {
    obtenerAuditoria
};
