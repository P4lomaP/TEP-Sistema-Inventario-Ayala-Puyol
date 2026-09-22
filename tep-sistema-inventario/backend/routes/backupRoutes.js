const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/backup/sql - Exportar copia de seguridad de la base de datos
router.get(
    '/sql', 
    authMiddleware, 
    authMiddleware.verificarRol(['Administrador', 'Auditor', 'Tecnico']), 
    backupController.exportarSQL
);

// GET /api/backup/pdf - Exportar reporte de inventario de equipos activos
router.get(
    '/pdf', 
    authMiddleware, 
    authMiddleware.verificarRol(['Administrador', 'Auditor', 'Tecnico']), 
    backupController.exportarPDF
);

module.exports = router;
