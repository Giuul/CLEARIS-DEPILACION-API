import { Router } from "express"
import { Turno } from "../models/Turno.js";
import { User } from "../models/User.js";
import { Service } from "../models/Service.js";
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';
import { verifyToken } from '../middleware/auth.js';

const router = Router()



router.get("/misturnos", verifyToken, async (req, res) => {
    try {
        const userId = req.dniusuario;
        const userRole = req.userRole;

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0); 
        
        const endRange = new Date(todayStart);
        endRange.setDate(todayStart.getDate() + 7); 
        const nextWeekEnd = new Date(endRange.getFullYear(), endRange.getMonth(), endRange.getDate(), 23, 59, 59, 999); 
        
        let whereClause = {
            dia: {
                [Op.between]: [todayStart, nextWeekEnd] 
            }
        };
        if (userRole === 'admin' || userRole === 'superadmin') {
        } else if (userRole === 'profesional') {
            whereClause.profesionalId = userId;
        } else {
            whereClause.dniusuario = userId;
        }

        const turnos = await Turno.findAll({
            where: whereClause,
            include: [
                { model: User, as: "usuario", attributes: ['id', 'name', 'lastname'] },
                { model: Service, as: "servicio" },
                { model: User, as: "profesional", attributes: ['id', 'name', 'lastname'] }
            ],
            order: [['dia', 'ASC'], ['hora', 'ASC']] 
        });

        res.json(turnos);
    } catch (error) {
        console.error("Error al obtener turnos:", error);
        res.status(500).json({
            mensaje: "Error al obtener tus turnos",
            error: error.message
        });
    }
});


router.get("/admin/turnos", verifyToken, async (req, res) => {
    try {
        if (req.userRole !== 'admin' && req.userRole !== 'superadmin' && req.userRole !== 'profesional') {
            return res.status(403).json({ mensaje: "Acceso denegado. Se requiere rol de gestor." });
        }
        
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0); 
        
        const endRange = new Date(todayStart);
        endRange.setDate(todayStart.getDate() + 7); 
        const nextWeekEnd = new Date(endRange.getFullYear(), endRange.getMonth(), endRange.getDate(), 23, 59, 59, 999); 

        let whereClause = {
            dia: {
                [Op.between]: [todayStart, nextWeekEnd] 
            }
        };
        if (req.userRole === 'profesional') {
            whereClause.profesionalId = req.dniusuario;
            
            if (req.query.asistio === 'true') {
                whereClause.asistio = true;
            }
        }
        
        const turnos = await Turno.findAll({
            where: whereClause,
            include: [
                { model: User, as: "usuario", attributes: ['id', 'name', 'lastname'] },
                { model: Service, as: "servicio" },
                { model: User, as: "profesional", attributes: ['id', 'name', 'lastname'] }
            ],
            order: [['dia', 'ASC'], ['hora', 'ASC']] 
        });

        res.json(turnos);
    } catch (error) {
        console.error("Error al obtener todos los turnos (admin):", error);
        res.status(500).json({
            mensaje: "Error al obtener todos los turnos",
            error: error.message
        });
    }
});


router.get("/misturnos/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const turno = await Turno.findByPk(id, {
            include: [
                { model: User, as: "usuario", attributes: ['id', 'name', 'lastname'] },
                { model: Service, as: "servicio" },
                { model: User, as: "profesional", attributes: ['id', 'name', 'lastname'] }
            ]
        });

        if (!turno) {
            return res.status(404).json({ mensaje: "Turno no encontrado" });
        }

        res.json(turno);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al obtener turno", error });
    }
});


router.get("/turnos/ocupados", verifyToken, async (req, res) => {
    try {
            const { profesionalId, dia } = req.query;

            if (!profesionalId || !dia) {
                return res.status(400).json({ mensaje: 'Faltan parámetros: profesionalId y dia son requeridos.' });
            }

            const profesionalIdNum = parseInt(profesionalId, 10);
            if (isNaN(profesionalIdNum)) {
                return res.status(400).json({ mensaje: 'El profesionalId debe ser un número válido.' });
            }

            
            const turnos = await Turno.findAll({
                where: {
                    profesionalId: profesionalIdNum,
                    dia: dia
                },
                attributes: ['hora'] 
            });

            
            const horasOcupadas = turnos.map(t => t.hora);

            res.json(horasOcupadas);

        } catch (error) {
            console.error("Error en /turnos/ocupados:", error);
            res.status(500).json({
                mensaje: 'Error interno del servidor al obtener turnos ocupados',
                error: error.message
            });
        }
});


router.get("/professional", verifyToken, async (req, res) => {
    const allowedRoles = ['profesional', 'admin', 'superadmin'];

    if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({ mensaje: "Acceso denegado. Se requiere rol de Profesional o Administrador." });
    }
    const profesionalId = req.dniusuario;

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    try {
        const turnosHoy = await Turno.findAll({
            where: {
                profesionalId: profesionalId,
                dia: {
                    [Op.between]: [todayStart, todayEnd]
                }
            },
            order: [['hora', 'ASC']],
            include: [
                { model: User, as: "usuario", attributes: ['id', 'name', 'lastname', 'tel', 'email'] },

                { model: Service, as: "servicio", attributes: ['id', 'name'] }
            ]
        });

        res.json(turnosHoy);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener la agenda del profesional",
            error: error.message
        });
    }
});


router.post('/misturnos', verifyToken, async (req, res) => {
    try {
        const loggedInUserDNI = req.dniusuario;
        const loggedInUserRole = req.userRole;
        const { dia, hora, idservicio, userId: userIdFromRequestBody, profesionalId } = req.body;


        if (!dia || !hora || !idservicio || !profesionalId) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios para el turno (día, hora, servicio, profesional).' });
        }

        let dniusuarioParaElTurno;
        let professionalIdToAssign = null;

        if (loggedInUserRole === 'admin' || loggedInUserRole === 'superadmin') {

            if (!userIdFromRequestBody) {
                dniusuarioParaElTurno = loggedInUserDNI;
            } else {
                const targetUser = await User.findByPk(userIdFromRequestBody);
                if (!targetUser) {
                    return res.status(404).json({ mensaje: `El usuario con DNI ${userIdFromRequestBody} para el cual se intenta agendar el turno no existe.` });
                }

                if (loggedInUserRole === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'superadmin')) {
                    return res.status(403).json({ mensaje: "Los administradores solo pueden agendar turnos para usuarios con rol 'user' o 'profesional'." });
                }
                dniusuarioParaElTurno = targetUser.id;
            }

            const targetProfessional = await User.findOne({
                where: { id: profesionalId, role: 'profesional' }
            });

            if (!targetProfessional) {
                return res.status(404).json({ mensaje: `El profesional con DNI ${profesionalId} no existe o no tiene el rol 'profesional'.` });
            }

            professionalIdToAssign = targetProfessional.id;


        } else if (loggedInUserRole === 'user') {

            if (userIdFromRequestBody && userIdFromRequestBody !== loggedInUserDNI) {
                return res.status(403).json({ mensaje: "Un usuario solo puede agendar turnos para sí mismo." });
            }

            dniusuarioParaElTurno = loggedInUserDNI;

             const targetProfessional = await User.findOne({
             where: { id: profesionalId, role: 'profesional' }
            });

            if (!targetProfessional) {
                return res.status(404).json({ mensaje: `El profesional con DNI ${profesionalId} no existe o no tiene el rol 'profesional'.` });
            }

            professionalIdToAssign = targetProfessional.id;

        } else {
            return res.status(403).json({ mensaje: "No tiene permisos para realizar esta acción." });
        }

        const turnoExistente = await Turno.findOne({
            where: {
                dia,
                hora,
                profesionalId: professionalIdToAssign
            }
        });
        if (turnoExistente) {
            return res.status(400).json({ mensaje: "Este horario ya está ocupado para el profesional seleccionado." });
        }; 

        const nuevoTurno = await Turno.create({
            dniusuario: dniusuarioParaElTurno,
            dia,
            hora,
            idservicio: parseInt(idservicio),
            profesionalId: professionalIdToAssign,
            asistio: false 
        });

        res.status(201).json(nuevoTurno);

    } catch (error) {
        console.error("Error al crear turno:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                mensaje: "Conflicto al crear el turno. Es posible que ya exista un turno para este usuario en la fecha y hora seleccionada, o que el horario esté ocupado.",
                detalle: error.errors ? error.errors.map(e => e.message) : error.message
            });
        }
        res.status(500).json({
            mensaje: "Error interno del servidor al crear turno",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


router.put("/admin/turnos/:id", verifyToken, async (req, res) => {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        return res.status(403).json({ mensaje: "Acceso denegado" });
    }

    const { id } = req.params;
    const { dia, hora } = req.body;

    const horaMin = "15:00";
    const horaMax = "18:30";

    if (hora && (hora < horaMin || hora > horaMax)) {
        return res.status(400).json({ mensaje: `La hora debe estar entre ${horaMin} y ${horaMax}` });
    }

    try {
        const turno = await Turno.findByPk(id);
        if (!turno) return res.status(404).json({ mensaje: "Turno no encontrado" });
        
        const updateFields = {};
        if (dia) updateFields.dia = dia;
        if (hora) updateFields.hora = hora;
        
        await turno.update(updateFields);
        res.json({ mensaje: "Turno actualizado correctamente (admin)", turno });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar turno", error: error.message });
    }
});


router.delete("/misturnos/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const turno = await Turno.findByPk(id);
        if (!turno) {
            return res.status(404).json({ mensaje: "Turno no encontrado" });
        }

        await turno.destroy();
        res.json({ mensaje: "Turno eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al eliminar turno", error });
    }
});

export default router;