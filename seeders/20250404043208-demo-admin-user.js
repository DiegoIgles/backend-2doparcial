const bcrypt = require('bcrypt'); // Requiere bcrypt
const { User } = require('../models'); // Requiere el modelo User

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash de la contraseña que deseas usar (por ejemplo 'admin1234')
    const hashedPassword = await bcrypt.hash('123456', 10); // 10 es el número de rondas de salt

    // Inserta un usuario admin
    await queryInterface.bulkInsert('Users', [
      {
        username: 'admin',  // Aquí usamos el email en lugar de username
        password: hashedPassword,  // Contraseña encriptada
        role: 'admin',  // Rol de administrador
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Si quieres revertir el seeder, elimina el usuario admin insertado
    await queryInterface.bulkDelete('Users', { email: 'admin@example.com' }, {});
  }
};
