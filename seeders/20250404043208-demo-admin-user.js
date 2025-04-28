const bcrypt = require('bcrypt');
const { User } = require('../src/models');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero, verificar si ya existe el admin
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });

    if (!existingAdmin) {
      // Si no existe, crear el admin
      const hashedPassword = await bcrypt.hash('123456', 10);

      await queryInterface.bulkInsert('users', [
        {
          username: 'admin',
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ], {});
      
      console.log('✅ Usuario admin creado.');
    } else {
      console.log('ℹ️ Usuario admin ya existe. No se creó nuevamente.');
    }
  },

  async down(queryInterface, Sequelize) {
    // Elimina el admin en caso de revertir el seeder
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  }
};
