const express = require('express');
const router = express.Router();
const comprobantesController = require('../controllers/comprobantesController');

// GET /api/comprobantes/:idMovimiento/pdf - Generar y transmitir el Acta de Entrega en formato PDF
router.get('/:idMovimiento/pdf', comprobantesController.generarActaMovimientoPDF);

module.exports = router;
