const express = require('express');
const router = express.Router();
const sectoresController = require('../controllers/sectoresController');

// GET /api/sectores - Listar todos los sectores activos (estadoActivo = 1)
router.get('/', sectoresController.obtenerSectores);

// POST /api/sectores - Crear un nuevo sector
router.post('/', sectoresController.crearSector);

// PUT /api/sectores/:id - Baja lógica cambiando estadoActivo a 0
router.put('/:id', sectoresController.darDeBajaSector);

// PUT /api/sectores/:id/baja - Endpoint explícito de baja lógica
router.put('/:id/baja', sectoresController.darDeBajaSector);

// PUT /api/sectores/:id/editar - Actualizar datos del sector
router.put('/:id/editar', sectoresController.actualizarSector);

module.exports = router;
