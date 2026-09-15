const db = require('./database');
const bcrypt = require('bcryptjs');

/**
 * Script seeder para crear el primer usuario Administrador con contraseña encriptada
 */
const seedAdmin = async () => {
    const username = 'admin';
    const plainPassword = 'tuPassword123';
    const rolAcceso = 'Administrador';
    const estadoActivo = 1;

    try {
        // Generar hash de la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

        const query = `
            INSERT INTO Usuarios (username, password, rolAcceso, estadoActivo)
            VALUES (?, ?, ?, ?)
        `;

        db.query(query, [username, hashedPassword, rolAcceso, estadoActivo], (err, result) => {
            if (err) {
                console.error('❌ Error al insertar el usuario administrador:', err);
                process.exit(1);
            }

            console.log('✅ ¡Usuario Administrador insertado exitosamente!');
            console.log(`🆔 ID generado: ${result.insertId}`);
            console.log(`👤 Username: ${username}`);
            console.log(`🔑 Contraseña plana: ${plainPassword}`);
            console.log(`🛡️  Rol de acceso: ${rolAcceso}`);
            console.log(`🟢 Estado activo: ${estadoActivo}`);

            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Error al procesar el hash de la contraseña:', error);
        process.exit(1);
    }
};

seedAdmin();
