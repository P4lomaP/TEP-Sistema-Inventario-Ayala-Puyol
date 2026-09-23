const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard - Métricas consolidadas, distribución mensual y últimos 5 movimientos
router.get('/', dashboardController.obtenerDashboard);

module.exports = router;
