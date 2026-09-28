const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/reportes - Métricas analíticas consolidadas y transacciones filtradas (Requiere autenticación)
router.get('/', reportesController.obtenerReporteConsolidado);

// GET /api/reportes/pdf-equipos - Reporte institucional oficial en PDF (Administrador, Técnico y Auditor)
router.get(
    '/pdf-equipos', 
    authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), 
    reportesController.exportarPDF
);

// GET /api/reportes/backup - Alias retrocompatible para descarga SQL (Exclusivo Administrador)
router.get(
    '/backup', 
    authMiddleware.verificarRol(['Administrador']), 
    backupController.exportarSQL
);

module.exports = router;
