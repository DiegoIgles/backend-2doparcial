// src/models/ProyectoUI.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProyectoUI = sequelize.define('ProyectoUI', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fabricJson: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'proyectos_ui',
  timestamps: true,
  modelName: 'ProyectoUI',
});

// Método estático para definir las asociaciones
ProyectoUI.associate = function(models) {
  // Un ProyectoUI tiene muchos usuarios
  ProyectoUI.hasMany(models.User, { foreignKey: 'proyectoId' });
};

module.exports = ProyectoUI;
