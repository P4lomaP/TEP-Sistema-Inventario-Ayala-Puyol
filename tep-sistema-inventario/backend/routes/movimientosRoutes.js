const express = require('express');
const router = express.Router();
const movimientosController = require('../controllers/movimientosController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/movimientos/pdf - Exportar reporte consolidado de movimientos en PDF (Admin, Técnico y Auditor)
router.get('/pdf', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), movimientosController.exportarPDFMovimientos);

// GET /api/movimientos - Listar movimientos con JOIN a Usuarios (Admin, Técnico y Auditor)
router.get('/', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), movimientosController.obtenerMovimientos);

// GET /api/movimientos/:id - Obtener un movimiento específico con sus detalles (Admin, Técnico y Auditor)
router.get('/:id', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), movimientosController.obtenerMovimientoPorId);

// POST /api/movimientos - Registrar nuevo movimiento (Exclusivo Administrador y Técnico)
router.post('/', authMiddleware.verificarRol(['Administrador', 'Tecnico']), movimientosController.registrarMovimiento);

// PUT /api/movimientos/:id - Modificar movimiento existente (Exclusivo Administrador y Técnico)
router.put('/:id', authMiddleware.verificarRol(['Administrador', 'Tecnico']), movimientosController.actualizarMovimiento);

// DELETE /api/movimientos/:id - Anular movimiento y revertir existencias (Exclusivo Administrador)
router.delete('/:id', authMiddleware.verificarRol(['Administrador']), movimientosController.eliminarMovimiento);

module.exports = router;
