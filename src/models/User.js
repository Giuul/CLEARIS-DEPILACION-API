import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';


export const User = sequelize.define("user", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    autoIncrement: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  tel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'superadmin'),
    allowNull: false,
    defaultValue: 'user',
  }
}, {
  timestamps: false,
});