import { Router } from "express";
import { PatientRecord } from "../models/PatientRecord.js";
import { MedicalSession } from "../models/MedicalSession.js";
import { User } from "../models/User.js";
import { verifyToken, isProfessional, isAdminOrSuperAdmin, isProfessionalOrAdminOrSuperAdmin } from '../middleware/auth.js';

const router = Router();


router.get("/patients/:dni/record", verifyToken, isProfessionalOrAdminOrSuperAdmin, async (req, res) => {
    const { dni } = req.params;
    try {
        const patientRecord = await PatientRecord.findOne({
            where: { dniusuario: dni },
            include: [{ model: User, as: 'paciente', attributes: ['id', 'name', 'lastname'] }],
        });

        if (!patientRecord) {
            return res.status(404).json({ mensaje: "Ficha clínica no encontrada para este paciente." });
        }
        res.json(patientRecord);
    } catch (error) {
        console.error("Error al obtener la ficha clínica:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});


router.put("/patients/:dni/record", verifyToken, isProfessionalOrAdminOrSuperAdmin, async (req, res) => {
    const { dni } = req.params;
    const { descripcion } = req.body;
    try {
        const [record, created] = await PatientRecord.findOrCreate({
            where: { dniusuario: dni },
            defaults: { dniusuario: dni, descripcion },
        });

        if (!created) {
            record.descripcion = descripcion ?? record.descripcion;
            await record.save();
        }

        res.json({ mensaje: `Ficha clínica ${created ? 'creada' : 'actualizada'} correctamente.`, record });
    } catch (error) {
        console.error("Error al crear/actualizar la ficha clínica:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});


router.post("/patients/:dni/sessions", verifyToken, isProfessional, async (req, res) => {
    const { dni } = req.params;
    const { descripcion } = req.body;
    const { dniusuario: idprofesional } = req; 

    try {
        const patientRecord = await PatientRecord.findOne({ where: { dniusuario: dni } });
        if (!patientRecord) {
            return res.status(404).json({ mensaje: "Ficha clínica no encontrada para este paciente." });
        }

        const newSession = await MedicalSession.create({
            idFicha: patientRecord.id,
            idprofesional,
            observaciones: descripcion,
        });

        res.status(201).json({ mensaje: "Sesión agregada correctamente.", session: newSession });
    } catch (error) {
        console.error("Error al agregar sesión:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});


router.get("/patients/:dni/sessions", verifyToken, isProfessionalOrAdminOrSuperAdmin, async (req, res) => {
    const { dni } = req.params;
    try {
        const patientRecord = await PatientRecord.findOne({ where: { dniusuario: dni } });
        if (!patientRecord) {
            return res.status(404).json({ mensaje: "Paciente no encontrado o sin ficha clínica." });
        }
        
        const sessions = await MedicalSession.findAll({
            where: { idFicha: patientRecord.id },
            include: [{ model: User, as: 'profesional', attributes: ['id', 'name', 'lastname'] }],
            order: [['createdAt', 'DESC']],
        });

        res.json(sessions);
    } catch (error) {
        console.error("Error al obtener sesiones:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});

export default router;