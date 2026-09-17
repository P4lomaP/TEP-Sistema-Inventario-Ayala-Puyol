const express = require('express');
const router = express.Router();
const equiposController = require('../controllers/equiposController');

// GET /api/equipos - Listar todos los equipos (incluye nombre de sector mediante JOIN)
router.get('/', equiposController.obtenerEquipos);

// POST /api/equipos - Crear un nuevo equipo informático
router.post('/', equiposController.crearEquipo);

// PUT /api/equipos/:id - Modificar datos de un equipo existente
router.put('/:id', equiposController.actualizarEquipo);

// DELETE /api/equipos/:id - Baja lógica (o física con ?fisico=true)
router.delete('/:id', equiposController.eliminarEquipo);

// PUT /api/equipos/:id/baja - Alias para baja lógica directa
router.put('/:id/baja', equiposController.eliminarEquipo);

module.exports = router;
