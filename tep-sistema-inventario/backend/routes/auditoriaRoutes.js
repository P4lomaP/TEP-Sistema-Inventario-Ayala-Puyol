const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');

// GET /api/auditoria - Consultar historial inmutable de auditoría
router.get('/', auditoriaController.obtenerAuditoria);

module.exports = router;
