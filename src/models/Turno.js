
import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { User } from './User.js'; 
import { Service } from './Service.js';

export const Turno = sequelize.define("turno", {
  id: {
    type: DataTypes.STRING,
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
  },
   profesionalId: { 
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  timestamps: false,
});


// Relación con el usuario 
Turno.belongsTo(User, {
  foreignKey: 'dniusuario',
  targetKey: 'id',
  as: 'usuario',
  onDelete: 'CASCADE',     
  onUpdate: 'CASCADE'
});

// Relación con el servicio
Turno.belongsTo(Service, {
  foreignKey: 'idservicio',
  targetKey: 'id',
  as: 'servicio',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

//  Relación con el profesional
Turno.belongsTo(User, {
  foreignKey: 'profesionalId',
  targetKey: 'id',
  as: 'profesional',
  onDelete: 'CASCADE',    
  onUpdate: 'CASCADE'
});