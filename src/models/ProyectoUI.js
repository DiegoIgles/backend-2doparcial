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
  fabricJson: {  // (opcional, puedes eliminarlo si ya no lo necesitas)
    type: DataTypes.JSON,
    allowNull: true,
  },
  pagesJson: {   // 🚀 NUEVO: JSON completo de todas las pantallas
    type: DataTypes.JSON,
    allowNull: true,
  },
  flutterCode: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  zipPath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'proyectos_ui',
  timestamps: true,
  modelName: 'ProyectoUI',
});

ProyectoUI.associate = function(models) {
  ProyectoUI.hasMany(models.User, { foreignKey: 'proyectoId' });
};

module.exports = ProyectoUI;
