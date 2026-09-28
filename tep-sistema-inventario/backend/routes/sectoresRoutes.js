const express = require('express');
const router = express.Router();
const sectoresController = require('../controllers/sectoresController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/sectores - Listar todos los sectores activos (Admin, Técnico y Auditor)
router.get('/', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), sectoresController.obtenerSectores);

// POST /api/sectores - Crear un nuevo sector (Exclusivo Administrador según CDU 4.4.1)
router.post('/', authMiddleware.verificarRol(['Administrador']), sectoresController.crearSector);

// PUT /api/sectores/:id - Baja lógica cambiando estadoActivo a 0 (Exclusivo Administrador)
router.put('/:id', authMiddleware.verificarRol(['Administrador']), sectoresController.darDeBajaSector);

// PUT /api/sectores/:id/baja - Endpoint explícito de baja lógica (Exclusivo Administrador)
router.put('/:id/baja', authMiddleware.verificarRol(['Administrador']), sectoresController.darDeBajaSector);

// PUT /api/sectores/:id/editar - Actualizar datos del sector (Exclusivo Administrador)
router.put('/:id/editar', authMiddleware.verificarRol(['Administrador']), sectoresController.actualizarSector);

module.exports = router;
