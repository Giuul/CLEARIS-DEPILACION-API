import { Router } from "express"
import { Turno } from "../models/Turno.js";
import { User } from "../models/User.js";
import { Service } from "../models/Service.js";
import { verifyToken } from '../middleware/auth.js';

const router = Router()

router.get("/misturnos", verifyToken, async (req, res) => {
    try {
        const dniusuario = req.dniusuario;

        const turnos = await Turno.findAll({
            where: { dniusuario },
            include: [
                { model: User, as: "usuario" },
                { model: Service, as: "servicio" }
            ]
        });

        console.log("dniusuario recibido:", dniusuario);

        res.json(turnos);
    } catch (error) {
        console.error("Error al obtener turnos del usuario:", error);
        res.status(500).json({
            mensaje: "Error al obtener tus turnos",
            error: error.message
        });
    }
});

router.get("/admin/turnos", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
      return res.status(403).json({ mensaje: "Acceso denegado. Se requiere rol de administrador." });
    }

    const turnos = await Turno.findAll({
      include: [
        { model: User, as: "usuario" }, 
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