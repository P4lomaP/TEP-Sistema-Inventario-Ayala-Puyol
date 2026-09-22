require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database'); 

const authRoutes = require('./routes/authRoutes');
const sectoresRoutes = require('./routes/sectoresRoutes');
const insumosRoutes = require('./routes/insumosRoutes');
const equiposRoutes = require('./routes/equiposRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const matrizRoutes = require('./routes/matrizRoutes');
const comprobantesRoutes = require('./routes/comprobantesRoutes');

// Middleware de autenticación y control de inactividad (30m)
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    exposedHeaders: ['x-renewed-token']
}));
app.use(express.json());

// ----------------------------------------------------
// 1. Rutas Públicas (Sin token: Login y Recuperación)
// ----------------------------------------------------
app.use('/api/auth', authRoutes);

// ----------------------------------------------------
// 2. Rutas Protegidas (Requieren Bearer Token y expiran a los 30 min de inactividad)
// ----------------------------------------------------
app.use('/api/sectores', authMiddleware, sectoresRoutes);
app.use('/api/insumos', authMiddleware, insumosRoutes);
app.use('/api/equipos', authMiddleware, equiposRoutes);
app.use('/api/movimientos', authMiddleware, movimientosRoutes);
app.use('/api/auditoria', authMiddleware, auditoriaRoutes);
app.use('/api/compatibilidad', authMiddleware, matrizRoutes);
app.use('/api/comprobantes', authMiddleware, comprobantesRoutes);

// Una ruta de prueba para ver si el servidor responde
app.get('/', (req, res) => {
    res.send('¡El servidor está funcionando a la perfección! 🚀');
});

// Encendemos el motor del servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});