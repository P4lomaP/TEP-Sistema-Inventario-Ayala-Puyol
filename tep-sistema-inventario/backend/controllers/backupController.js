const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const db = require('../database');
const { registrarAuditoria } = require('../utils/auditoriaHelper');

// Helper para consultas a BD con promesas
const executeQuery = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => (err ? reject(err) : resolve(results)));
});

/**
 * 1. Exportar Backup Completo en formato SQL (.sql)
 * Ejecuta mysqldump mediante exec de child_process y envía el archivo al cliente.
 */
const exportarSQL = (req, res) => {
    try {
        // Credenciales desde variables de entorno con fallbacks de Laragon
        const dbUser = process.env.DB_USER || 'root';
        const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
        const dbName = process.env.DB_NAME || 'tep_inventario';
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || 3306;

        // Ruta del binario mysqldump solicitada
        const requestedPath = 'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump';
        let mysqldumpExec = requestedPath;

        // Si la versión específica 8.0.30 no existe en disco, detectar la versión instalada de Laragon
        if (!fs.existsSync(mysqldumpExec + '.exe') && !fs.existsSync(mysqldumpExec)) {
            const alternativePath = 'C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin\\mysqldump';
            if (fs.existsSync(alternativePath + '.exe') || fs.existsSync(alternativePath)) {
                mysqldumpExec = alternativePath;
            } else {
                mysqldumpExec = 'mysqldump';
            }
        }

        // Asegurar que exista el directorio temporal
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Nombre de archivo con fecha de hoy y timestamp único
        const fechaHoy = new Date().toISOString().slice(0, 10);
        const timestamp = Date.now();
        const downloadFileName = `backup_${dbName}_${fechaHoy}.sql`;
        const tempFilePath = path.join(tempDir, `dump_${timestamp}.sql`);

        // Construir banderas de conexión
        const passwordFlag = dbPassword ? `-p"${dbPassword}"` : '';
        const hostFlag = `-h ${dbHost}`;
        const portFlag = `-P ${dbPort}`;

        // Comando mysqldump
        const command = `"${mysqldumpExec}" -u ${dbUser} ${passwordFlag} ${hostFlag} ${portFlag} ${dbName} > "${tempFilePath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error al ejecutar mysqldump:', error.message, stderr);

                // Limpiar archivo temporal si quedó creado a medias
                if (fs.existsSync(tempFilePath)) {
                    fs.unlink(tempFilePath, () => {});
                }

                return res.status(500).json({
                    message: 'Error al generar la copia de seguridad SQL.',
                    error: error.message
                });
            }

            // Registrar evento en auditoría
            registrarAuditoria(
                req.usuario?.idUsuario,
                `Exportación de base de datos SQL completa (${downloadFileName})`,
                'Seguridad'
            ).catch(() => {});

            // Enviar archivo al cliente y luego eliminarlo del servidor
            res.download(tempFilePath, downloadFileName, (downloadErr) => {
                // Borrar el archivo temporal del servidor independientemente del resultado
                fs.unlink(tempFilePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error al eliminar archivo temporal SQL:', unlinkErr);
                    }
                });

                if (downloadErr && !res.headersSent) {
                    console.error('Error durante la transmisión del archivo:', downloadErr);
                    return res.status(500).json({
                        message: 'Error al transmitir el archivo de copia de seguridad al cliente.'
                    });
                }
            });
        });

    } catch (err) {
        console.error('Error inesperado en exportarSQL:', err);
        return res.status(500).json({
            message: 'Error interno del servidor al procesar la exportación SQL.',
            error: err.message
        });
    }
};

/**
 * 2. Exportar Reporte de Inventario de Equipos en formato PDF
 * Consulta los equipos activos (estadoOperativo != 'Baja') y genera un PDF al vuelo.
 */
const exportarPDF = async (req, res) => {
    try {
        // Consulta a la base de datos excluyendo los equipos dados de baja
        const query = `
            SELECT 
                COALESCE(codPatrimonial, 'S/C') AS codPatrimonial,
                tipoEquipo,
                marcaModelo,
                estadoOperativo
            FROM Equipos
            WHERE estadoOperativo != 'Baja'
            ORDER BY tipoEquipo ASC, codPatrimonial ASC, idEquipo ASC
        `;

        const equipos = await executeQuery(query);

        // Configurar headers para transmitir stream PDF al cliente
        const fechaHoy = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Reporte_Inventario_${fechaHoy}.pdf"`);

        // Crear documento PDF con márgenes estándar
        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 40,
            info: {
                Title: 'Tribunal Electoral Permanente - Reporte de Inventario',
                Author: 'Sistema de Inventario TEP',
                Subject: 'Reporte Oficial de Equipos Activos'
            }
        });

        // Conectar el stream a la respuesta HTTP
        doc.pipe(res);

        // Función para renderizar encabezado institucional
        const renderEncabezado = () => {
            doc.rect(40, 40, 515, 4).fill('#1A365D');

            doc.fillColor('#1A365D')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Tribunal Electoral Permanente - Reporte de Inventario', 40, 52, { align: 'center' });

            doc.fillColor('#4A5568')
               .fontSize(9)
               .font('Helvetica')
               .text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR')} | Total de equipos activos: ${equipos.length}`, 40, 72, { align: 'center' });

            doc.moveTo(40, 88).lineTo(555, 88).lineWidth(1).strokeColor('#CBD5E0').stroke();
        };

        // Función para renderizar cabecera de la tabla
        const renderCabeceraTabla = (y) => {
            doc.rect(40, y, 515, 20).fill('#2B6CB0');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            doc.text('N°', 45, y + 6, { width: 25, align: 'center' });
            doc.text('CÓD. PATRIMONIAL', 75, y + 6, { width: 110 });
            doc.text('TIPO DE EQUIPO', 190, y + 6, { width: 95 });
            doc.text('MARCA / MODELO', 290, y + 6, { width: 160 });
            doc.text('ESTADO OPERATIVO', 455, y + 6, { width: 95, align: 'center' });
            return y + 20;
        };

        // Primer encabezado y cabecera
        renderEncabezado();
        let currentY = renderCabeceraTabla(98);

        if (equipos.length === 0) {
            doc.rect(40, currentY, 515, 25).fillAndStroke('#FFFFFF', '#E2E8F0');
            doc.fillColor('#718096')
               .fontSize(9)
               .font('Helvetica-Oblique')
               .text('No se encontraron equipos activos registrados en el inventario.', 50, currentY + 8);
        } else {
            equipos.forEach((equipo, index) => {
                // Si la fila superaría el límite de la página, añadir nueva página
                if (currentY + 22 > 780) {
                    doc.addPage();
                    renderEncabezado();
                    currentY = renderCabeceraTabla(98);
                }

                const isEven = index % 2 === 0;
                const rowHeight = 20;

                // Fondo alternado
                doc.rect(40, currentY, 515, rowHeight)
                   .fillAndStroke(isEven ? '#FFFFFF' : '#F7FAFC', '#E2E8F0');

                // Datos de la fila
                doc.fillColor('#2D3748').fontSize(8).font('Helvetica');

                // 1. Índice
                doc.text(String(index + 1), 45, currentY + 6, { width: 25, align: 'center' });

                // 2. Código Patrimonial
                doc.font('Helvetica-Bold').text(equipo.codPatrimonial, 75, currentY + 6, { width: 110 });
                doc.font('Helvetica');

                // 3. Tipo de Equipo
                doc.text(equipo.tipoEquipo || 'Equipo', 190, currentY + 6, { width: 95 });

                // 4. Marca y Modelo
                doc.text(equipo.marcaModelo || 'No especificado', 290, currentY + 6, { width: 160, lineBreak: false, ellipsis: true });

                // 5. Estado Operativo
                const estadoColor = equipo.estadoOperativo === 'Operativo' ? '#2F855A' : '#D69E2E';
                doc.font('Helvetica-Bold')
                   .fillColor(estadoColor)
                   .text(equipo.estadoOperativo || 'N/A', 455, currentY + 6, { width: 95, align: 'center' });

                currentY += rowHeight;
            });
        }

        // Pie de página con numeración y marca de auditoría
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            doc.moveTo(40, 800).lineTo(555, 800).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
            doc.fillColor('#A0AEC0')
               .fontSize(7)
               .font('Helvetica')
               .text(
                   `Página ${i + 1} de ${range.count} - Sistema de Inventario TEP - Documento emitido por auditoría`,
                   40,
                   806,
                   { align: 'center', width: 515 }
               );
        }

        // Registrar auditoría de reporte generado
        registrarAuditoria(
            req.usuario?.idUsuario,
            `Generación de reporte PDF de inventario de equipos (${equipos.length} equipos activos)`,
            'Equipos'
        ).catch(() => {});

        // Finalizar y transmitir el PDF
        doc.end();

    } catch (error) {
        console.error('Error al generar reporte PDF de inventario:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Error interno al generar el reporte de inventario en PDF.',
                error: error.message
            });
        }
    }
};

module.exports = {
    exportarSQL,
    exportarPDF
};
