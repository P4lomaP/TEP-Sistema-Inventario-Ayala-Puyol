const express = require('express');
const cors = require('cors');
const db = require('./database'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Una ruta de prueba para ver si el servidor responde
app.get('/', (req, res) => {
    res.send('¡El servidor está funcionando a la perfección! 🚀');
});

// Encendemos el motor del servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});