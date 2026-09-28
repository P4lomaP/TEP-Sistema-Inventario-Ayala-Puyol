const express = require('express');
const router = express.Router();
const matrizController = require('../controllers/matrizController');
const authMiddleware = require('../middlewares/authMiddleware');

// GET /api/compatibilidad/pdf - Exportar matriz de compatibilidad técnica en PDF (Admin, Técnico y Auditor)
router.get('/pdf', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), matrizController.exportarPDFMatriz);

// GET /api/compatibilidad - Obtener todas las reglas de compatibilidad (Admin, Técnico y Auditor)
router.get('/', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), matrizController.obtenerTodasLasCompatibilidades);

// GET /api/compatibilidad/equipo/:idEquipo - Obtener todos los insumos compatibles con un equipo (Admin, Técnico y Auditor)
router.get('/equipo/:idEquipo', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), matrizController.obtenerInsumosPorEquipo);

// GET /api/compatibilidad/insumo/:idInsumo - Obtener todos los equipos compatibles con un insumo (Admin, Técnico y Auditor)
router.get('/insumo/:idInsumo', authMiddleware.verificarRol(['Administrador', 'Tecnico', 'Auditor']), matrizController.obtenerEquiposPorInsumo);

// POST /api/compatibilidad - Registrar una nueva relación de compatibilidad (Exclusivo Administrador según CDU 4.4.3)
router.post('/', authMiddleware.verificarRol(['Administrador']), matrizController.crearCompatibilidad);

// DELETE /api/compatibilidad/:idRegla - Eliminar una relación de compatibilidad (Exclusivo Administrador)
router.delete('/:idRegla', authMiddleware.verificarRol(['Administrador']), matrizController.eliminarCompatibilidad);

module.exports = router;
