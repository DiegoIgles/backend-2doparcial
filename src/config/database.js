// src/config/database.js
const { Sequelize } = require('sequelize');

// Usar variables de entorno para mayor seguridad y flexibilidad
const sequelize = new Sequelize(
  process.env.DB_NAME,       // Nombre de la base de datos
  process.env.DB_USER,       // Usuario
  process.env.DB_PASSWORD,   // Contraseña
  {
    host: process.env.DB_HOST, // Host
    dialect: 'mysql',
    logging: false,           // Opcional: para no llenar de logs la consola
  }
);

module.exports = sequelize;
