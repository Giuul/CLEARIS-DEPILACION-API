import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { User } from './User.js';

export const PatientRecord = sequelize.define("patientRecord", {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        autoIncrement: true,
    },
    dniusuario: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, 
    },
    observaciones: {  
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    timestamps: true,
});

PatientRecord.belongsTo(User, {
    foreignKey: 'dniusuario',
    targetKey: 'id',
    as: 'paciente',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});