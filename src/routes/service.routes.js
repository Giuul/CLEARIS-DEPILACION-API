import { Router } from "express";
import { Service } from "../models/Service.js";

const router = Router();

router.get("/service", async (req, res) => {
  try {
    const services = await Service.findAll();
    res.json(services);
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({ message: "Error interno del servidor al obtener servicios." });
  }
});

router.get("/service/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const service = await Service.findByPk(id);
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: "Servicio no encontrado." });
    }
  } catch (error) {
    console.error(`Error al obtener servicio con ID ${id}:`, error);
    res.status(500).json({ message: "Error interno del servidor al obtener el servicio." });
  }
});


export default router;