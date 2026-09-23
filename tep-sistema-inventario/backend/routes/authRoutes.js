const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// ----------------------------------------------------
// Rutas Públicas (Sin token)
// ----------------------------------------------------
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/verificar-pin', authController.verificarPin);
router.post('/solicitar-pin', authController.solicitarNuevoPin);
router.post('/recuperar-password', authController.recuperarPassword);

// ----------------------------------------------------
// Rutas de Usuario Protegidas (Requiere Token)
// ----------------------------------------------------
router.get('/perfil', authMiddleware, authController.obtenerPerfil);
router.put('/perfil', authMiddleware, authController.actualizarPerfil);

// ----------------------------------------------------
// Rutas de Administración Protegidas (Requiere Token y Rol Administrador)
// ----------------------------------------------------
router.put(
    '/admin/regenerar-pin/:idUsuario', 
    authMiddleware, 
    authMiddleware.verificarRol(['Administrador']), 
    authController.regenerarPinAdmin
);
router.put(
    '/admin/descartar-solicitud-pin/:idUsuario', 
    authMiddleware, 
    authMiddleware.verificarRol(['Administrador']), 
    authController.descartarSolicitudPinAdmin
);

module.exports = router;

