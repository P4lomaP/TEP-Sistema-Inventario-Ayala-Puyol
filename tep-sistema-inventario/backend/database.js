require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',          
    password: process.env.DB_PASSWORD || '',          
    database: process.env.DB_NAME || 'tep_inventario', 
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Error conectando al pool de la base de datos:', err.message);
        return;
    }
    console.log('✅ ¡Éxito! Conectado a la base de datos.');
    conn.release();
});

// Manejador preventivo de errores del pool para evitar caídas del proceso Node
pool.on('error', (err) => {
    console.error('⚠️ Advertencia en pool MySQL:', err.message);
});

module.exports = pool;