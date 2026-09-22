const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { exportarPDF, exportarSQL } = require('../controllers/backupController');

// GET /api/reportes - Obtener métricas consolidadas y transacciones filtradas
router.get('/', reportesController.obtenerReporteConsolidado);

// GET /api/reportes/backup - Descargar volcado SQL completo
router.get('/backup', exportarSQL);

// GET /api/reportes/pdf-equipos - Descargar reporte de inventario de equipos activos en PDF
router.get('/pdf-equipos', exportarPDF);

module.exports = router;
