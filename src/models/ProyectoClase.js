// src/models/ProyectoClase.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');  // Importa User correctamente

const ProyectoClase = sequelize.define('ProyectoClase', {
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
  fabricJson: {  // Este campo guardará el JSON que representa el diagrama de clase de Fabric
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'proyectos_clase', // Nombre de la tabla en la base de datos
  timestamps: true,  // Para tener las columnas createdAt y updatedAt
  modelName: 'ProyectoClase',
});

// Método estático para definir las asociaciones
ProyectoClase.associate = function(models) {
  // Un ProyectoClase tiene muchos usuarios
  ProyectoClase.hasMany(models.User, { foreignKey: 'proyectoClaseId' });
};

module.exports = ProyectoClase;
