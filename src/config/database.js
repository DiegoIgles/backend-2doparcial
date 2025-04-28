// src/config/database.js
const { Sequelize } = require('sequelize');

// Aquí debes poner tus datos correctos para la base de datos
const sequelize = new Sequelize('cisistem_primer_parcial_sw1', 'cisistem_sistemas', 'sistemas2025$', {
  host: 'cisistemasficct.com', // O la dirección de tu base de datos
  dialect: 'mysql', // O el tipo de base de datos que estés usando ('postgres', 'sqlite', etc.)
});

module.exports = sequelize;
