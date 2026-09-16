const express = require('express');
const router = express.Router();
const insumosController = require('../controllers/insumosController');

// GET /api/insumos - Listar todos los insumos activos (estadoActivo = 1)
router.get('/', insumosController.obtenerInsumos);

// POST /api/insumos - Registrar un nuevo insumo
router.post('/', insumosController.crearInsumo);

// PUT /api/insumos/:id - Actualizar datos de un insumo específico
router.put('/:id', insumosController.actualizarInsumo);

// PUT /api/insumos/:id/baja - Baja lógica del insumo (estadoActivo = 0)
router.put('/:id/baja', insumosController.darDeBajaInsumo);

module.exports = router;
