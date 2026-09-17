const db = require('../database');

/**
 * Registra un evento de trazabilidad y ciclo de vida en Historial_Equipos (RN-02, Módulo 5)
 * @param {number} idEquipo - ID del equipo patrimonial
 * @param {number|null} idSectorAnterior - Sector origen previo
 * @param {number|null} idSectorNuevo - Sector destino nuevo (o null si es baja definitiva)
 * @param {string} motivoBaja - Justificación textual obligatoria del movimiento o baja
 * @returns {Promise<number>} ID del registro de historial
 */
const registrarHistorialEquipo = (idEquipo, idSectorAnterior, idSectorNuevo, motivoBaja) => {
    return new Promise((resolve, reject) => {
        const equipoId = parseInt(idEquipo, 10);
        const sectorAnt = idSectorAnterior ? parseInt(idSectorAnterior, 10) : null;
        const sectorNue = idSectorNuevo ? parseInt(idSectorNuevo, 10) : null;
        const motivo = (motivoBaja && motivoBaja.trim()) ? motivoBaja.trim().substring(0, 255) : 'Movimiento de inventario patrimonial';

        const query = `
            INSERT INTO Historial_Equipos (fechaCambio, motivoBaja, idEquipo, idSectorAnterior, idSectorNuevo)
            VALUES (NOW(), ?, ?, ?, ?)
        `;

        db.query(query, [motivo, equipoId, sectorAnt, sectorNue], (err, result) => {
            if (err) {
                console.error('❌ Error al registrar en Historial_Equipos:', err);
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
};

module.exports = {
    registrarHistorialEquipo
};
