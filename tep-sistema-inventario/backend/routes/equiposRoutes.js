const express = require('express');
const router = express.Router();
const equiposController = require('../controllers/equiposController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/equipos - Listar todos los equipos (Admin, Técnico y Auditor)
router.get('/', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), equiposController.obtenerEquipos);

// GET /api/equipos/:id/historial - Consultar el historial y trazabilidad del equipo (Admin, Técnico y Auditor)
router.get('/:id/historial', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), equiposController.obtenerHistorialEquipo);

// POST /api/equipos - Crear un nuevo equipo informático (Administrador y Técnico)
router.post('/', authMiddleware.verificarRol(['Administrador', 'Tecnico']), equiposController.crearEquipo);

// PUT /api/equipos/:id - Modificar datos de un equipo existente (Administrador y Técnico)
router.put('/:id', authMiddleware.verificarRol(['Administrador', 'Tecnico']), equiposController.actualizarEquipo);

// DELETE /api/equipos/:id - Baja lógica (Exclusivo Administrador)
router.delete('/:id', authMiddleware.verificarRol(['Administrador']), equiposController.eliminarEquipo);

// PUT /api/equipos/:id/baja - Alias para baja lógica directa (Exclusivo Administrador)
router.put('/:id/baja', authMiddleware.verificarRol(['Administrador']), equiposController.eliminarEquipo);

module.exports = router;
