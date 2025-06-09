// src/config/database.js
const { Sequelize } = require('sequelize');

// Aquí debes poner tus datos correctos para la base de datos
const sequelize = new Sequelize('railway', 'root', 'TnDkGfokJSHUBciAonEdgDjqxdlZvpIg', {
  host: 'turntable.proxy.rlwy.net', // O la dirección de tu base de datos
  dialect: 'mysql', // O el tipo de base de datos que estés usando ('postgres', 'sqlite', etc.)
  port: 20389,  // Asegúrate de que el puerto sea el correcto
  dialectOptions: {
    connectTimeout: 80000,  // Aumentar el tiempo de espera (80 segundos)
  },
});

module.exports = sequelize;
