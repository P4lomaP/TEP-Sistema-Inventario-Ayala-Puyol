const db = require('../database');

/**
 * Registra un evento inmutable en la tabla Log_Auditoria (RN-01, RNF-01, Módulo 7)
 * @param {number} idUsuario - ID del usuario que ejecuta la acción
 * @param {string} accionRealizada - Descripción de la operación
 * @param {string} moduloAfectado - Módulo correspondiente (ej: 'Equipos', 'Sectores', 'Insumos')
 * @returns {Promise<number>} ID del log insertado
 */
const registrarAuditoria = (idUsuario, accionRealizada, moduloAfectado) => {
    return new Promise((resolve, reject) => {
        const usuarioId = idUsuario ? parseInt(idUsuario, 10) : 1;
        const accion = accionRealizada ? accionRealizada.substring(0, 255) : 'Acción no especificada';
        const modulo = moduloAfectado ? moduloAfectado.substring(0, 50) : 'General';

        const query = `
            INSERT INTO Log_Auditoria (fechaHora, accionRealizada, moduloAfectado, idUsuario)
            VALUES (NOW(), ?, ?, ?)
        `;

        db.query(query, [accion, modulo, usuarioId], (err, result) => {
            if (err) {
                console.error('❌ Error al registrar log de auditoría:', err);
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
};

module.exports = {
    registrarAuditoria
};
