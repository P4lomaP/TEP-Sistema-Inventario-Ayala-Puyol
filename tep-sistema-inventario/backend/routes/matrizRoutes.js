const express = require('express');
const router = express.Router();
const matrizController = require('../controllers/matrizController');

// GET /api/compatibilidad - Obtener todas las reglas de compatibilidad
router.get('/', matrizController.obtenerTodasLasCompatibilidades);

// GET /api/compatibilidad/equipo/:idEquipo - Obtener todos los insumos compatibles con una impresora / equipo
router.get('/equipo/:idEquipo', matrizController.obtenerInsumosPorEquipo);

// GET /api/compatibilidad/insumo/:idInsumo - Obtener todos los equipos compatibles con un insumo (tóner)
router.get('/insumo/:idInsumo', matrizController.obtenerEquiposPorInsumo);

// POST /api/compatibilidad - Registrar una nueva relación de compatibilidad
router.post('/', matrizController.crearCompatibilidad);

// DELETE /api/compatibilidad/:idRegla - Eliminar una relación de compatibilidad (Borrado físico)
router.delete('/:idRegla', matrizController.eliminarCompatibilidad);

module.exports = router;
