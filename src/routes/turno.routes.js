import { Router } from "express"
import { Turno } from "../models/Turno.js";
import { User } from "../models/User.js";
import { Service } from "../models/Service.js";
import { verifyToken, isAdminOrSuperAdmin, isAdmin, isSuperAdmin, isProfessional } from '../middleware/auth.js';

const router = Router()

router.get("/misturnos", verifyToken, async (req, res) => {
    try {
        const { dniusuario, userRole } = req;
        const hoy = new Date().toISOString().split('T')[0]; 
        let turnos;
        
        if (userRole === 'professional') {
            turnos = await Turno.findAll({
                where: {
                    idprofesional: dniusuario,
                    dia: hoy
                },
                include: [
                    { model: User, as: "usuario", attributes: ['id', 'name', 'lastname'] },
                    { model: Service, as: "servicio" }
                ]
            });
        } else if (userRole === 'user') {
            turnos = await Turno.findAll({
                where: { dniusuario },
                include: [
                    { model: User, as: "usuario", attributes: ['id', 'name', 'lastname'] },
                    { model: Service, as: "servicio" }
                ]
            });
        } else {
            return res.status(403).json({ mensaje: "Acceso denegado. Esta ruta es solo para usuarios y profesionales." });
        }

        res.json(turnos);
    } catch (error) {
        console.error("Error al obtener turnos:", error);
        res.status(500).json({
            mensaje: "Error al obtener tus turnos",
            error: error.message
        });
    }
});


router.get("/admin/turnos", verifyToken, isAdminOrSuperAdmin, async (req, res) => {
    try {
        const turnos = await Turno.findAll({
            include: [
                { model: User, as: "usuario", attributes: ['id', 'name', 'lastname'] },
                { model: User, as: "profesional", attributes: ['id', 'name', 'lastname'] },
                { model: Service, as: "servicio" }
            ]
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
    console.log("ID recibido:", id);
    try {
        const turno = await Turno.findByPk(id, {
            include: [
                { model: User, as: "usuario" },
                { model: Service, as: "servicio" }
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


router.post('/misturnos', verifyToken, async (req, res) => {
    try {
        const loggedInUserDNI = req.dniusuario; 
        const loggedInUserRole = req.userRole;   
        const { dia, hora, idservicio, userId: userIdFromRequestBody } = req.body;

        
        if (!dia || !hora || !idservicio) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios para el turno (día, hora, servicio).' });
        }

        let dniusuarioParaElTurno; 

        if ((loggedInUserRole === 'admin' || loggedInUserRole === 'superadmin') && userIdFromRequestBody) {
            if (userIdFromRequestBody === loggedInUserDNI) {
                dniusuarioParaElTurno = loggedInUserDNI;
            } else {
                const targetUser = await User.findByPk(userIdFromRequestBody); 
                if (!targetUser) {
                    return res.status(404).json({ mensaje: `El usuario con DNI ${userIdFromRequestBody} para el cual se intenta agendar el turno no existe.` });
                }
               
                if (loggedInUserRole === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'superadmin')) {
                    return res.status(403).json({ mensaje: "Los administradores solo pueden agendar turnos para usuarios con rol 'user' o para sí mismos." });
                }
                dniusuarioParaElTurno = targetUser.id; 
            }
        } else if ((loggedInUserRole === 'admin' || loggedInUserRole === 'superadmin') && !userIdFromRequestBody) {
           
            dniusuarioParaElTurno = loggedInUserDNI;
        } else if (loggedInUserRole === 'user'){ 
            dniusuarioParaElTurno = loggedInUserDNI;
        } else {
            return res.status(403).json({ mensaje: "No tiene permisos para realizar esta acción con los datos proporcionados."});
        }

      

        const nuevoTurno = await Turno.create({
            dniusuario: dniusuarioParaElTurno, 
            dia,
            hora,
            idservicio: parseInt(idservicio) 
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


router.put("/misturnos/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const turno = await Turno.findByPk(id);
        if (!turno) {
            return res.status(404).json({ mensaje: "Turno no encontrado" });
        }

        await turno.update(req.body);
        res.json(turno);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar turno", error });
    }
});

router.post('/turnos', verifyToken, async (req, res) => {
    try {
        const { dniusuario, userRole } = req;
        const { dia, hora, idservicio, userId: userIdFromRequestBody, idprofesional } = req.body;

        if (!dia || !hora || !idservicio) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios para el turno (día, hora, servicio).' });
        }

        let dniusuarioParaElTurno;
        let idProfesionalParaElTurno = idprofesional || null; 

        if (userRole === 'user') {
            dniusuarioParaElTurno = dniusuario;
            if (idprofesional) {
                return res.status(403).json({ mensaje: "Un usuario no puede asignar un profesional a un turno."});
            }
        } else if (userRole === 'admin' || userRole === 'superadmin') {
            dniusuarioParaElTurno = userIdFromRequestBody || dniusuario;
            const targetUser = await User.findByPk(dniusuarioParaElTurno);
            
            if (!targetUser) {
                return res.status(404).json({ mensaje: `El usuario con DNI ${dniusuarioParaElTurno} para el cual se intenta agendar el turno no existe.` });
            }

            if (userRole === 'admin' && (targetUser.role !== 'user' && targetUser.id !== dniusuario)) {
                return res.status(403).json({ mensaje: "Los administradores solo pueden agendar turnos para usuarios con rol 'user' o para sí mismos." });
            }

            if (idprofesional) {
                const profesional = await User.findOne({ where: { id: idprofesional, role: 'professional' } });
                if (!profesional) {
                    return res.status(404).json({ mensaje: `El profesional con DNI ${idprofesional} no existe o no tiene el rol correcto.` });
                }
                idProfesionalParaElTurno = profesional.id;
            }

        } else {
            return res.status(403).json({ mensaje: "No tiene permisos para realizar esta acción."});
        }
        
        const nuevoTurno = await Turno.create({
            dniusuario: dniusuarioParaElTurno,
            dia,
            hora,
            idservicio: parseInt(idservicio),
            idprofesional: idProfesionalParaElTurno,
        });

        res.status(201).json(nuevoTurno);

    } catch (error) {
        console.error("Error al crear turno:", error);
        res.status(500).json({
            mensaje: "Error interno del servidor al crear turno",
            error: error.message
        });
    }
});

router.put("/misturnos/:id/atendido", verifyToken, isProfessional, async (req, res) => {
    const { id } = req.params;
    const { dniusuario } = req;
    
    try {
        const turno = await Turno.findByPk(id);
        
        if (!turno) {
            return res.status(404).json({ mensaje: "Turno no encontrado." });
        }
        
        if (turno.idprofesional !== dniusuario) {
            return res.status(403).json({ mensaje: "Acceso denegado. No tiene permisos para actualizar este turno." });
        }

        turno.atendido = true; 
        await turno.save();

        res.json({ mensaje: "Turno marcado como atendido.", turno });
    } catch (error) {
        console.error("Error al marcar turno como atendido:", error);
        res.status(500).json({ mensaje: "Error interno del servidor.", error: error.message });
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