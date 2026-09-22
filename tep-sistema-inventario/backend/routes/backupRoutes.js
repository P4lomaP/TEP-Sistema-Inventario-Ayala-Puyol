const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/backup/sql - Exportar copia de seguridad de la base de datos (Exclusivo Administradores)
router.get(
    '/sql', 
    authMiddleware, 
    authMiddleware.verificarRol(['Administrador']), 
    backupController.exportarSQL
);

// GET /api/backup/pdf - Exportar reporte de inventario de equipos activos (Administradores y Auditores)
router.get(
    '/pdf', 
    authMiddleware, 
    authMiddleware.verificarRol(['Administrador', 'Auditor']), 
    backupController.exportarPDF
);

module.exports = router;
