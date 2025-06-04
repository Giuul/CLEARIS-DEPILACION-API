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

        const dniusuario = req.dniusuario;
        const { dia, hora, idservicio } = req.body;
        if (!dniusuario || !dia || !hora || !idservicio) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
        }

        const nuevoTurno = await Turno.create({
            dniusuario,
            dia,
            hora,
            idservicio
        });

        res.status(201).json(nuevoTurno);
    } catch (error) {
        console.error("Error al crear turno:", error);
        res.status(500).json({
            mensaje: "Error al crear turno",
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