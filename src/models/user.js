// src/models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
}, {
  tableName: 'users',
  timestamps: true,
  modelName: 'User',
});

// Método estático para definir las asociaciones
User.associate = function(models) {
  // Un usuario pertenece a un ProyectoUI
  User.belongsTo(models.ProyectoUI, { foreignKey: 'proyectoId' });
};

module.exports = User;
