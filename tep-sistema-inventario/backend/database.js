const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',          
    password: '',          
    database: 'tep_inventario', 
    port: 3306             
});

db.connect((err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos de Laragon:', err);
        return;
    }
    console.log('✅ ¡Éxito! Conectado a la base de datos.');
});

module.exports = db;