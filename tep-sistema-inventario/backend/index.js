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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/sectores', sectoresRoutes);
app.use('/api/insumos', insumosRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/compatibilidad', matrizRoutes);

// Una ruta de prueba para ver si el servidor responde
app.get('/', (req, res) => {
    res.send('¡El servidor está funcionando a la perfección! 🚀');
});

// Encendemos el motor del servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});