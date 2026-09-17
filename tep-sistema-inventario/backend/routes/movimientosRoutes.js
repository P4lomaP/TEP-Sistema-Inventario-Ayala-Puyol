const express = require('express');
const router = express.Router();
const movimientosController = require('../controllers/movimientosController');

// GET /api/movimientos - Listar movimientos con JOIN a Usuarios
router.get('/', movimientosController.obtenerMovimientos);

// GET /api/movimientos/:id - Obtener un movimiento específico con sus detalles asociados
router.get('/:id', movimientosController.obtenerMovimientoPorId);

// POST /api/movimientos - Registrar nuevo movimiento (Maestro-Detalle con Transacción ACID)
router.post('/', movimientosController.registrarMovimiento);

module.exports = router;
