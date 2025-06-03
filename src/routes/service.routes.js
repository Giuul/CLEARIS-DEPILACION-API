import { Router } from "express";
import { Service } from "../models/Service.js";

const router = Router();

router.get("/service", async(req, res) => {
    const  services = await Service.findAll();
    res.json(services);
});

router.get("/service/:id", async(req, res) => {
    const { id } = req.params;
    const service = await Service.findByPk(id);
    res.json(service);
});

router.post("/service", (req, res) => {
    res.send("creando servicio");
});

router.put("/service/:id", (req, res) => {
    const { id } = req.params;
    res.send(`actualizando servicio con id: ${id}`);
});

router.delete("/service/:id", (req, res) => {
    const { id } = req.params;
    res.send(`borrando servicio con id: ${id}`);
});

export default router;