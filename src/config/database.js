// src/config/database.js
const { Sequelize } = require('sequelize');

// Aquí debes poner tus datos correctos para la base de datos
const sequelize = new Sequelize('primer_parcial_sw1', 'root', '', {
  host: 'localhost', // O la dirección de tu base de datos
  dialect: 'mysql', // O el tipo de base de datos que estés usando ('postgres', 'sqlite', etc.)
});

module.exports = sequelize;
