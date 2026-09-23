const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/backup/sql - Exportar copia de seguridad completa de la BD (Exclusivo Administrador)
router.get(
    '/sql', 
    authMiddleware, 
    authMiddleware.verificarRol(['Administrador']), 
    backupController.exportarSQL
);

// GET /api/backup/pdf - Reporte de inventario en PDF (Compatibilidad retroactiva: Administrador y Auditor)
router.get(
    '/pdf', 
    authMiddleware, 
    authMiddleware.verificarRol(['Administrador', 'Auditor']), 
    backupController.exportarPDF
);

module.exports = router;
