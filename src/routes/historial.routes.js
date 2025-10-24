import { Router } from "express";
import { PatientRecord } from "../models/PatientRecord.js";
import { MedicalSession } from "../models/MedicalSession.js";
import { User } from "../models/User.js";
import { verifyToken, isProfessional, isAdminOrSuperAdmin, isProfessionalOrAdminOrSuperAdmin } from '../middleware/auth.js';

const router = Router();


router.get("/patients/:dni/sessions", verifyToken, isProfessionalOrAdminOrSuperAdmin, async (req, res) => {
    const { dni } = req.params;
    try {
        const patientUser = await User.findOne({
            where: { id: dni },
            attributes: ['id', 'name', 'lastname', 'email', 'tel']
        });

        if (!patientUser) {
            return res.status(404).json({ mensaje: "Usuario paciente no encontrado." });
        }

        const patientRecord = await PatientRecord.findOne({
            where: { dniusuario: dni },
            attributes: ['id', 'observaciones']
        });

        let sessions = [];

        if (patientRecord) {
            sessions = await MedicalSession.findAll({
                where: { idFicha: patientRecord.id },

                include: [{
                    model: User,
                    as: 'profesional',
                    attributes: ['id', 'name', 'lastname', 'email', 'tel']
                }],
                order: [['createdAt', 'DESC']],
            });
        }


        const patientDataJson = patientUser.toJSON();
        const patientDataWithRecord = {
            ...patientDataJson,
            observacionFicha: patientRecord ? patientRecord.observaciones : null
        };


        res.json({
            patient: patientDataWithRecord,
            sessions: sessions
        });

    } catch (error) {
        console.error("Error al obtener sesiones:", error);
        res.status(500).json({ mensaje: "Error interno del servidor al obtener historial." });
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


router.get("/turnos/paciente/:dni/historial", verifyToken, async (req, res) => {
    const { dni } = req.params;
    
    const allowedRoles = ['profesional', 'admin', 'superadmin'];
    if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({ mensaje: "Acceso denegado. Se requiere rol de gestor para ver historial." });
    }
    
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0]; 
    
    try {
        const turnosHistoricos = await Turno.findAll({
            where: {
                dniusuario: dni, 
                dia: {
                    [Op.lt]: todayFormatted 
                }
            },
            include: [
                { model: User, as: "usuario", attributes: ['id', 'name', 'lastname', 'email', 'tel'] },
                { model: Service, as: "servicio" },
                { model: User, as: "profesional", attributes: ['id', 'name', 'lastname'] }
            ],
            order: [['dia', 'DESC'], ['hora', 'DESC']] 
        });

        res.json(turnosHistoricos); 

    } catch (error) {
        console.error("Error al obtener historial de turnos:", error);
        res.status(500).json({ 
            mensaje: "Error interno del servidor al obtener el historial de turnos.",
            error: error.message
        });
    }
});
router.get("/patients/:dni/sessions", verifyToken, isProfessionalOrAdminOrSuperAdmin, async (req, res) => {
    const { dni } = req.params;
    try {
        const patientUser = await User.findOne({
            where: { id: dni },
            attributes: ['id', 'name', 'lastname', 'email', 'tel']
        });

        if (!patientUser) {
            return res.status(404).json({ mensaje: "Usuario paciente no encontrado." });
        }

        let [patientRecord, created] = await PatientRecord.findOrCreate({
            where: { dniusuario: dni },
            defaults: { dniusuario: dni, observaciones: "" }
        });

        const sessions = await MedicalSession.findAll({
            where: { idFicha: patientRecord.id },
            include: [{
                model: User,
                as: 'profesional',
                attributes: ['id', 'name', 'lastname', 'email', 'tel']
            }],
            order: [['createdAt', 'DESC']],
        });

        const patientDataJson = patientUser.toJSON();
        const patientDataWithRecord = {
            ...patientDataJson,
            observacionFicha: patientRecord.observaciones
        };

        res.json({
            patient: patientDataWithRecord,
            sessions
        });

    } catch (error) {
        console.error("Error al obtener sesiones:", error);
        res.status(500).json({ mensaje: "Error interno del servidor al obtener historial." });
    }
});


router.put("/sessions/:id/observacion", verifyToken, isProfessionalOrAdminOrSuperAdmin, async (req, res) => {
    const { id } = req.params;
    const { observaciones } = req.body;

    try {
        const session = await MedicalSession.findByPk(id);
        if (!session) return res.status(404).json({ mensaje: "Sesión no encontrada." });

        session.observaciones = observaciones ?? session.observaciones;
        await session.save();

        const updatedSession = await MedicalSession.findByPk(id, {
            include: [{ model: User, as: 'profesional', attributes: ['id', 'name', 'lastname'] }]
        });

        res.json(updatedSession);
    } catch (error) {
        console.error("Error al actualizar observación:", error);
        res.status(500).json({ mensaje: "Error interno del servidor." });
    }
});


export default router;