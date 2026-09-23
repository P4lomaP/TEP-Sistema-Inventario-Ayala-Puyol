const PDFDocument = require('pdfkit');
const db = require('../database');
const { registrarAuditoria } = require('../utils/auditoriaHelper');

// Helper para consultas a BD con promesas
const executeQuery = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => (err ? reject(err) : resolve(results)));
});

/**
 * 1. Listar todos los usuarios del sistema con su último acceso registrado en auditoría y métricas
 * GET /api/usuarios
 */
const obtenerUsuarios = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.idUsuario,
                CONCAT('USR-', LPAD(u.idUsuario, 3, '0')) AS codUsuario,
                u.username,
                u.rolAcceso,
                u.estadoActivo,
                DATE_FORMAT(MAX(l.fechaHora), '%d/%m/%Y %H:%i') AS ultimoAcceso
            FROM Usuarios u
            LEFT JOIN Log_Auditoria l ON u.idUsuario = l.idUsuario
            GROUP BY u.idUsuario, u.username, u.rolAcceso, u.estadoActivo
            ORDER BY u.idUsuario ASC
        `;

        const usuarios = await executeQuery(query);

        // Cálculo de KPIs
        const totalPersonal = usuarios.length;
        const administradores = usuarios.filter(u => u.rolAcceso === 'Administrador').length;
        const tecnicos = usuarios.filter(u => u.rolAcceso === 'Tecnico' || u.rolAcceso === 'Técnico').length;
        const auditores = usuarios.filter(u => u.rolAcceso === 'Auditor').length;

        return res.status(200).json({
            usuarios,
            kpis: {
                totalPersonal,
                administradores,
                tecnicos,
                auditores
            }
        });
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        return res.status(500).json({
            message: 'Error interno al consultar la lista de usuarios.',
            error: error.message
        });
    }
};

/**
 * 2. Alternar o modificar el estado activo/inactivo de un usuario
 * PUT /api/usuarios/:id/estado
 */
const cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estadoActivo } = req.body;
        const idAdmin = req.usuario?.idUsuario;

        if (estadoActivo === undefined || (estadoActivo !== 0 && estadoActivo !== 1)) {
            return res.status(400).json({ message: 'El valor de estadoActivo debe ser 0 (inactivo) o 1 (activo).' });
        }

        // Un administrador no puede desactivar su propia cuenta
        if (parseInt(id) === parseInt(idAdmin) && estadoActivo === 0) {
            return res.status(400).json({
                message: 'No puede desactivar su propia cuenta de administrador en sesión.'
            });
        }

        // Verificar existencia del usuario
        const [usuario] = await executeQuery('SELECT idUsuario, username, rolAcceso FROM Usuarios WHERE idUsuario = ?', [id]);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Actualizar estado
        await executeQuery('UPDATE Usuarios SET estadoActivo = ? WHERE idUsuario = ?', [estadoActivo, id]);

        const accion = estadoActivo === 1 ? 'activación' : 'desactivación';
        await registrarAuditoria(
            idAdmin,
            `Se realizó la ${accion} de la cuenta del usuario @${usuario.username} (ID: ${id}).`,
            'Seguridad'
        );

        return res.status(200).json({
            message: `Usuario @${usuario.username} ${estadoActivo === 1 ? 'activado' : 'desactivado'} con éxito.`,
            estadoActivo
        });
    } catch (error) {
        console.error('Error al cambiar estado de usuario:', error);
        return res.status(500).json({
            message: 'Error interno al cambiar el estado del usuario.',
            error: error.message
        });
    }
};

/**
 * 3. Modificar el rol institucional de un usuario
 * PUT /api/usuarios/:id/rol
 */
const cambiarRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { rolAcceso } = req.body;
        const idAdmin = req.usuario?.idUsuario;

        const rolesValidos = ['Administrador', 'Tecnico', 'Auditor'];
        if (!rolAcceso || !rolesValidos.includes(rolAcceso)) {
            return res.status(400).json({
                message: 'Rol no válido. Los roles admitidos son: Administrador, Tecnico o Auditor.'
            });
        }

        // Verificar usuario
        const [usuario] = await executeQuery('SELECT idUsuario, username, rolAcceso FROM Usuarios WHERE idUsuario = ?', [id]);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Si se intenta degradar a un admin, asegurar que quede al menos otro admin activo
        if (usuario.rolAcceso === 'Administrador' && rolAcceso !== 'Administrador') {
            const admins = await executeQuery("SELECT idUsuario FROM Usuarios WHERE rolAcceso = 'Administrador' AND estadoActivo = 1");
            if (admins.length <= 1) {
                return res.status(400).json({
                    message: 'No es posible modificar el rol del único Administrador activo del sistema.'
                });
            }
        }

        await executeQuery('UPDATE Usuarios SET rolAcceso = ? WHERE idUsuario = ?', [rolAcceso, id]);

        await registrarAuditoria(
            idAdmin,
            `Modificación de rol para @${usuario.username}: de "${usuario.rolAcceso}" a "${rolAcceso}".`,
            'Seguridad'
        );

        return res.status(200).json({
            message: `Rol del usuario @${usuario.username} actualizado a ${rolAcceso}.`,
            rolAcceso
        });
    } catch (error) {
        console.error('Error al cambiar rol de usuario:', error);
        return res.status(500).json({
            message: 'Error interno al actualizar el rol del usuario.',
            error: error.message
        });
    }
};

/**
 * 4. Exportar Nómina Oficial de Usuarios y Roles en formato PDF (PDFKit)
 * GET /api/usuarios/pdf
 */
const exportarPDFUsuarios = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.idUsuario,
                CONCAT('USR-', LPAD(u.idUsuario, 3, '0')) AS codUsuario,
                u.username,
                u.rolAcceso,
                u.estadoActivo,
                COALESCE(DATE_FORMAT(MAX(l.fechaHora), '%d/%m/%Y %H:%i'), 'Sin registros') AS ultimoAcceso
            FROM Usuarios u
            LEFT JOIN Log_Auditoria l ON u.idUsuario = l.idUsuario
            GROUP BY u.idUsuario, u.username, u.rolAcceso, u.estadoActivo
            ORDER BY u.idUsuario ASC
        `;

        const usuarios = await executeQuery(query);

        const fechaHoy = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Nomina_Usuarios_TEP_${fechaHoy}.pdf"`);

        const doc = new PDFDocument({
            size: 'A4',
            margin: 40,
            bufferPages: true,
            info: {
                Title: 'Tribunal Electoral Permanente - Nómina de Operadores y Accesos',
                Author: 'Sistema de Inventario TEP',
                Subject: 'Reporte Oficial de Usuarios y Roles'
            }
        });

        doc.pipe(res);

        const renderEncabezado = () => {
            doc.rect(40, 40, 515, 4).fill('#1A365D');

            doc.fillColor('#1A365D')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Tribunal Electoral Permanente - Control de Accesos y Roles', 40, 52, { align: 'center' });

            doc.fillColor('#4A5568')
               .fontSize(9)
               .font('Helvetica')
               .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')} | Total de cuentas registradas: ${usuarios.length}`, 40, 72, { align: 'center' });

            doc.moveTo(40, 88).lineTo(555, 88).lineWidth(1).strokeColor('#CBD5E0').stroke();
        };

        const renderCabeceraTabla = (y) => {
            doc.rect(40, y, 515, 20).fill('#2B6CB0');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            doc.text('N°', 45, y + 6, { width: 25, align: 'center' });
            doc.text('CÓDIGO', 75, y + 6, { width: 65 });
            doc.text('USUARIO (@)', 145, y + 6, { width: 110 });
            doc.text('ROL ASIGNADO', 260, y + 6, { width: 95 });
            doc.text('ESTADO', 360, y + 6, { width: 70, align: 'center' });
            doc.text('ÚLTIMO ACCESO', 435, y + 6, { width: 115, align: 'center' });
            return y + 20;
        };

        renderEncabezado();
        let currentY = renderCabeceraTabla(98);

        if (usuarios.length === 0) {
            doc.rect(40, currentY, 515, 25).fillAndStroke('#FFFFFF', '#E2E8F0');
            doc.fillColor('#718096')
               .fontSize(9)
               .font('Helvetica-Oblique')
               .text('No hay usuarios registrados en el sistema.', 50, currentY + 8);
        } else {
            usuarios.forEach((usr, index) => {
                if (currentY + 22 > 780) {
                    doc.addPage();
                    renderEncabezado();
                    currentY = renderCabeceraTabla(98);
                }

                const isEven = index % 2 === 0;
                const rowHeight = 20;

                doc.rect(40, currentY, 515, rowHeight)
                   .fillAndStroke(isEven ? '#FFFFFF' : '#F7FAFC', '#E2E8F0');

                doc.fillColor('#2D3748').fontSize(8).font('Helvetica');
                doc.text(String(index + 1), 45, currentY + 6, { width: 25, align: 'center' });

                doc.font('Helvetica-Bold').text(usr.codUsuario, 75, currentY + 6, { width: 65 });
                doc.font('Helvetica');

                doc.text(`@${usr.username}`, 145, currentY + 6, { width: 110 });

                // Formato y color del rol
                const rolColor = usr.rolAcceso === 'Administrador' ? '#1E293B' : usr.rolAcceso === 'Auditor' ? '#92400E' : '#2563EB';
                doc.font('Helvetica-Bold')
                   .fillColor(rolColor)
                   .text(usr.rolAcceso, 260, currentY + 6, { width: 95 });

                // Estado
                const estadoTexto = usr.estadoActivo === 1 ? 'Activo' : 'Inactivo';
                const estadoColor = usr.estadoActivo === 1 ? '#16A34A' : '#DC2626';
                doc.fillColor(estadoColor)
                   .text(estadoTexto, 360, currentY + 6, { width: 70, align: 'center' });

                // Último acceso
                doc.font('Helvetica')
                   .fillColor('#64748B')
                   .text(usr.ultimoAcceso, 435, currentY + 6, { width: 115, align: 'center' });

                currentY += rowHeight;
            });
        }

        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            doc.moveTo(40, 800).lineTo(555, 800).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
            doc.fillColor('#A0AEC0')
               .fontSize(7)
               .font('Helvetica')
               .text(
                   `Página ${i + 1} de ${range.count} - Tribunal Electoral Permanente - Nómina Confidencial de Seguridad`,
                   40,
                   806,
                   { align: 'center', width: 515 }
               );
        }

        await registrarAuditoria(
            req.usuario?.idUsuario,
            `Exportación oficial de nómina de usuarios en PDF (${usuarios.length} operadores).`,
            'Seguridad'
        );

        doc.end();
    } catch (error) {
        console.error('Error al exportar PDF de usuarios:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Error interno al generar el PDF de usuarios.',
                error: error.message
            });
        }
    }
};

module.exports = {
    obtenerUsuarios,
    cambiarEstado,
    cambiarRol,
    exportarPDFUsuarios
};
