const express = require('express');
const router = express.Router();
const insumosController = require('../controllers/insumosController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/insumos/pdf - Exportar catálogo oficial de insumos en PDF (Admin, Técnico y Auditor)
router.get('/pdf', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), insumosController.exportarPDFInsumos);

// GET /api/insumos - Listar todos los insumos activos (Admin, Técnico y Auditor)
router.get('/', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), insumosController.obtenerInsumos);

// POST /api/insumos - Registrar un nuevo insumo (Exclusivo Administrador según CDU 4.4.2)
router.post('/', authMiddleware.verificarRol(['Administrador']), insumosController.crearInsumo);

// PUT /api/insumos/:id - Actualizar datos de un insumo específico (Administrador y Técnico)
router.put('/:id', authMiddleware.verificarRol(['Administrador', 'Tecnico']), insumosController.actualizarInsumo);

// PUT /api/insumos/:id/baja - Baja lógica del insumo (Exclusivo Administrador según CDU 4.4.2)
router.put('/:id/baja', authMiddleware.verificarRol(['Administrador']), insumosController.darDeBajaInsumo);

module.exports = router;
