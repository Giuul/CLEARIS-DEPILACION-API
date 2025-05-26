import {Router} from "express"

const router = Router()

router.get("/turnos", (req, res) => {
    res.send("obteniendo turnos");
});

router.get("/turnos/:id", (req, res) => {
    const { id } = req.params;
    res.send(`obteniendo turno con id ${id}`);
});

router.post("/turnos", (req,res) =>{
    res.send("Creando turno")
});

router.put("/turnos/:id", (req, res) => {
    const { id } = req.params;
    res.send(`Actualizando turno con id: ${id}`);
});

router.delete("/turnos/:id", (req,res) =>{
    const { id } = req.params;
    res.send(`Borrando turno con id: ${id}`);
})

export default router;