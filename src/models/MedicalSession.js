import { DataTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { PatientRecord } from './PatientRecord.js';
import { User } from './User.js';

export const MedicalSession = sequelize.define("medicalSession", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    idFicha: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    idprofesional: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true,
});

MedicalSession.belongsTo(PatientRecord, {
    foreignKey: 'idFicha',
    targetKey: 'id',
    as: 'fichaClinica',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

MedicalSession.belongsTo(User, {
    foreignKey: 'idprofesional',
    targetKey: 'id',
    as: 'profesional',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});