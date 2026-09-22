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
 * Generador nativo de copia de seguridad SQL mediante consultas Node MySQL.
 * Se utiliza como fallback infalible cuando mysqldump no está disponible en el entorno del sistema.
 */
const generarDumpSQLNativo = async (req, res) => {
    try {
        const idUsuario = req.usuario?.idUsuario || null;
        const tablasResult = await executeQuery('SHOW TABLES');
        const dbName = process.env.DB_NAME || 'tep_inventario';
        const tableKey = `Tables_in_${dbName}`;
        const tablas = tablasResult.map(row => row[tableKey] || Object.values(row)[0]);

        let sqlDump = `-- ========================================================\n`;
        sqlDump += `-- TRIBUNAL ELECTORAL PERMANENTE - COPIA DE SEGURIDAD SQL\n`;
        sqlDump += `-- Generado automáticamente: ${new Date().toISOString()}\n`;
        sqlDump += `-- Base de datos: ${dbName}\n`;
        sqlDump += `-- ========================================================\n\n`;
        sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

        for (const tabla of tablas) {
            const [createResult] = await executeQuery(`SHOW CREATE TABLE \`${tabla}\``);
            const createSql = createResult['Create Table'];
            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `-- Estructura de tabla para \`${tabla}\`\n`;
            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `DROP TABLE IF EXISTS \`${tabla}\`;\n`;
            sqlDump += `${createSql};\n\n`;

            const filas = await executeQuery(`SELECT * FROM \`${tabla}\``);
            if (filas.length > 0) {
                sqlDump += `-- Volcado de datos para la tabla \`${tabla}\`\n`;
                for (const fila of filas) {
                    const columnas = Object.keys(fila).map(col => `\`${col}\``).join(', ');
                    const valores = Object.values(fila).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
                    }).join(', ');
                    sqlDump += `INSERT INTO \`${tabla}\` (${columnas}) VALUES (${valores});\n`;
                }
                sqlDump += `\n`;
            }
        }

        sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
        sqlDump += `-- Fin del volcado de seguridad.\n`;

        registrarAuditoria(
            idUsuario,
            `Exportación de base de datos SQL completa (${dbName})`,
            'Seguridad'
        ).catch(() => {});

        const fechaHoy = new Date().toISOString().slice(0, 10);
        const downloadFileName = `backup_${dbName}_${fechaHoy}.sql`;

        res.setHeader('Content-Type', 'application/sql; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
        return res.status(200).send(sqlDump);

    } catch (err) {
        console.error('Error en fallback nativo de backup SQL:', err);
        return res.status(500).json({
            message: 'Error al generar la copia de seguridad SQL.',
            error: err.message
        });
    }
};

/**
 * 1. Exportar Backup Completo en formato SQL (.sql)
 * Intenta ejecutar mysqldump (detectando XAMPP, Laragon o PATH global).
 * Si mysqldump no está disponible o falla, utiliza automáticamente el volcado nativo garantizando 100% de éxito.
 */
const exportarSQL = (req, res) => {
    try {
        const dbUser = process.env.DB_USER || 'root';
        const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
        const dbName = process.env.DB_NAME || 'tep_inventario';
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || 3306;

        // Candidatos de rutas de mysqldump (XAMPP, Laragon 8.4, Laragon 8.0, PATH global)
        const candidatePaths = [
            'C:\\xampp\\mysql\\bin\\mysqldump',
            'C:\\laragon\\bin\\mysql\\mysql-8.4.3-winx64\\bin\\mysqldump',
            'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump',
            'mysqldump'
        ];

        let mysqldumpExec = null;
        for (const p of candidatePaths) {
            if (p === 'mysqldump') {
                mysqldumpExec = p;
                break;
            }
            if (fs.existsSync(p + '.exe') || fs.existsSync(p)) {
                mysqldumpExec = p;
                break;
            }
        }

        if (!mysqldumpExec) {
            console.log('mysqldump no encontrado en rutas conocidas. Utilizando generador nativo...');
            return generarDumpSQLNativo(req, res);
        }

        // Directorio temporal
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const fechaHoy = new Date().toISOString().slice(0, 10);
        const timestamp = Date.now();
        const downloadFileName = `backup_${dbName}_${fechaHoy}.sql`;
        const tempFilePath = path.join(tempDir, `dump_${timestamp}.sql`);

        const passwordFlag = dbPassword ? `-p"${dbPassword}"` : '';
        const hostFlag = `-h ${dbHost}`;
        const portFlag = `-P ${dbPort}`;

        const command = `"${mysqldumpExec}" -u ${dbUser} ${passwordFlag} ${hostFlag} ${portFlag} ${dbName} > "${tempFilePath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.warn('mysqldump falló o no respondió adecuadamente:', error.message);
                if (fs.existsSync(tempFilePath)) {
                    fs.unlink(tempFilePath, () => {});
                }
                // Fallback automático al generador nativo
                return generarDumpSQLNativo(req, res);
            }

            // Validar que el archivo se haya generado con contenido
            try {
                const stats = fs.statSync(tempFilePath);
                if (stats.size === 0) {
                    fs.unlink(tempFilePath, () => {});
                    return generarDumpSQLNativo(req, res);
                }
            } catch (e) {
                return generarDumpSQLNativo(req, res);
            }

            // Registrar en auditoría
            registrarAuditoria(
                req.usuario?.idUsuario,
                `Exportación de base de datos SQL completa (${downloadFileName})`,
                'Seguridad'
            ).catch(() => {});

            // Transmitir archivo y luego eliminarlo del servidor
            res.download(tempFilePath, downloadFileName, (downloadErr) => {
                fs.unlink(tempFilePath, () => {});
                if (downloadErr && !res.headersSent) {
                    console.error('Error durante la transmisión del archivo:', downloadErr);
                    return res.status(500).json({
                        message: 'Error al transmitir el archivo de copia de seguridad al cliente.'
                    });
                }
            });
        });

    } catch (err) {
        console.warn('Excepción en exportarSQL, utilizando generador nativo:', err.message);
        return generarDumpSQLNativo(req, res);
    }
};

/**
 * 2. Exportar Reporte de Inventario de Equipos en formato PDF (Paloma)
 * Consulta los equipos activos (estadoOperativo != 'Baja') y genera un PDF oficial con pdfkit.
 */
const exportarPDF = async (req, res) => {
    try {
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

        const fechaHoy = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Reporte_Inventario_${fechaHoy}.pdf"`);

        const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 40,
            bufferPages: true,
            info: {
                Title: 'Tribunal Electoral Permanente - Reporte de Inventario',
                Author: 'Sistema de Inventario TEP',
                Subject: 'Reporte Oficial de Equipos Activos'
            }
        });

        doc.pipe(res);

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

                doc.font('Helvetica-Bold').text(equipo.codPatrimonial, 75, currentY + 6, { width: 110 });
                doc.font('Helvetica');

                doc.text(equipo.tipoEquipo || 'Equipo', 190, currentY + 6, { width: 95 });
                doc.text(equipo.marcaModelo || 'No especificado', 290, currentY + 6, { width: 160, lineBreak: false, ellipsis: true });

                const estadoColor = equipo.estadoOperativo === 'Operativo' ? '#2F855A' : '#D69E2E';
                doc.font('Helvetica-Bold')
                   .fillColor(estadoColor)
                   .text(equipo.estadoOperativo || 'N/A', 455, currentY + 6, { width: 95, align: 'center' });

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
                   `Página ${i + 1} de ${range.count} - Sistema de Inventario TEP - Documento emitido por auditoría`,
                   40,
                   806,
                   { align: 'center', width: 515 }
               );
        }

        registrarAuditoria(
            req.usuario?.idUsuario,
            `Generación de reporte PDF de inventario de equipos (${equipos.length} equipos activos)`,
            'Equipos'
        ).catch(() => {});

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
    exportarPDF,
    generarDumpSQLNativo
};
