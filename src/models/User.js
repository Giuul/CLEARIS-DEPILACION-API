import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';

export const User = sequelize.define("user", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false, 
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: false, 
});