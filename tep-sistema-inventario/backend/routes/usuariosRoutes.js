const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las operaciones de este router son exclusivas del Administrador
router.use(authMiddleware.verificarRol(['Administrador']));

// GET /api/usuarios - Listar todos los usuarios y métricas
router.get('/', usuariosController.obtenerUsuarios);

// GET /api/usuarios/pdf - Exportar nómina oficial de usuarios en PDF
router.get('/pdf', usuariosController.exportarPDFUsuarios);

// PUT /api/usuarios/:id/estado - Alternar estado activo / inactivo
router.put('/:id/estado', usuariosController.cambiarEstado);

// PUT /api/usuarios/:id/rol - Modificar rol institucional
router.put('/:id/rol', usuariosController.cambiarRol);

module.exports = router;
