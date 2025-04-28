// src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ProyectoClase = require('./ProyectoClase');  // Importa ProyectoClase correctamente

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user',
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  proyectoClaseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

}, {
  tableName: 'users',
  timestamps: true,
  modelName: 'User',
});

// Método estático para definir las asociaciones
User.associate = function(models) {
  // Un usuario pertenece a un ProyectoUI
  User.belongsTo(models.ProyectoUI, { foreignKey: 'proyectoId' });
  // Un usuario también puede estar asociado a un ProyectoClase (relación opcional)
  User.belongsTo(models.ProyectoClase, { foreignKey: 'proyectoClaseId', as: 'proyectoClase' }); // Usa 'as' para definir un alias
};

module.exports = User;
