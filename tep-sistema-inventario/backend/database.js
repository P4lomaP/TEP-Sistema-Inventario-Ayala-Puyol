require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',          
    password: process.env.DB_PASSWORD || '',          
    database: process.env.DB_NAME || 'tep_inventario', 
    port: process.env.DB_PORT || 3306             
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos de Laragon:', err);
        return;
    }
    console.log('✅ ¡Éxito! Conectado a la base de datos.');
});

module.exports = db;