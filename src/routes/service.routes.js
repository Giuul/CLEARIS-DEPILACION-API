import { Router } from "express";

const router = Router();

router.get("/service", (req, res) => {
    res.send("obteniendo servicios");
});

router.get("/service/:id", (req, res) => {
    const { id } = req.params;
    res.send(`obteniendo servicio con id ${id}`);
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