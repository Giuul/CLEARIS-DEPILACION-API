import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { User } from './User.js';
import { Service } from './Service.js';

export const Turno = sequelize.define("turno", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dniusuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  dia: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  hora: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  idservicio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  timestamps: false,
});


Turno.belongsTo(Service, {
  foreignKey: 'idservicio',
  targetKey: 'id',
  as: 'servicio'
});

Turno.belongsTo(User, {
  foreignKey: 'dniusuario',
  targetKey: 'id',
  as: 'usuario'
});