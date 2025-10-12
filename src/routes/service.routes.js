import { Router } from "express";
import { Service } from "../models/Service.js";
import { Turno } from "../models/Turno.js";
import { Op } from "sequelize";

const router = Router();

router.get("/service", async (req, res) => {
  try {
    const services = await Service.findAll();
    const servicesWithImages = services.map(service => {
      let imagenBase64 = null;
      if (service.imagen) {
        imagenBase64 = Buffer.from(service.imagen).toString("base64");
      }

      return {
        id: service.id,
        nombre: service.nombre,
        descripcion: service.descripcion,
        duracion: service.duracion,
        imagen: imagenBase64,
      };
    });

    res.json(servicesWithImages);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener servicios." });
  }
});

router.get("/service/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const service = await Service.findByPk(id);

    if (service) {
      let imagenBase64 = null;
      if (service.imagen) {
        imagenBase64 = Buffer.from(service.imagen).toString("base64");
      }

      res.json({
        id: service.id,
        nombre: service.nombre,
        descripcion: service.descripcion,
        duracion: service.duracion,
        imagen: imagenBase64,
      });
    } else {
      res.status(404).json({ message: "Servicio no encontrado." });
    }
  } catch (error) {
    console.error(`Error al obtener servicio con ID ${id}:`, error);
    res
      .status(500)
      .json({ message: "Error interno del servidor al obtener el servicio." });
  }
});

router.post("/service", async (req, res) => {
  const { nombre, descripcion, duracion, imagen } = req.body;
  try {
    const existing = await Service.findOne({ where: { nombre } });
    if (existing) return res.status(400).json({ message: "El nombre del servicio ya existe." });

    const service = await Service.create({ nombre, descripcion, duracion, imagen });
    res.status(201).json(service);
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({ message: "Error interno del servidor al crear servicio." });
  }
});

router.put("/service/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, duracion, imagen } = req.body;

  try {
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ message: "Servicio no encontrado." });

    if (nombre && nombre !== service.nombre) {
      const existing = await Service.findOne({ where: { nombre } });
      if (existing) return res.status(400).json({ message: "El nombre del servicio ya existe." });
    }

    await service.update({ nombre, descripcion, duracion, imagen });
    res.json(service);
  } catch (error) {
    console.error("Error al editar servicio:", error);
    res.status(500).json({ message: "Error interno del servidor al editar servicio." });
  }
});

router.delete("/service/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const service = await Service.findByPk(id);
    if (!service) return res.status(404).json({ message: "Servicio no encontrado." });

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];

    const pendingAppointments = await Turno.count({
      where: {
        idservicio: id,
        [Op.or]: [
          { dia: { [Op.gt]: today } },
          {
            dia: today,
            hora: { [Op.gte]: currentTime }
          }
        ]
      }
    });

    if (pendingAppointments > 0) {
      return res.status(400).json({
        message: "No se puede eliminar el servicio porque tiene turnos pendientes."
      });
    }

    await service.destroy();
    res.json({ message: "Servicio eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    res.status(500).json({ message: "Error interno del servidor al eliminar servicio." });
  }
});

export default router;