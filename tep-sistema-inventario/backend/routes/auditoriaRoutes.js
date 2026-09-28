const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/auditoria - Consultar historial inmutable de auditoría (Administrador y Auditor según CDU 4.4.7)
router.get('/', authMiddleware.verificarRol(['Administrador', 'Auditor']), auditoriaController.obtenerAuditoria);

module.exports = router;
