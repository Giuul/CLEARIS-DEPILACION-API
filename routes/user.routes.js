import {Router} from "express"

const router = Router()

router.get("/users/:id", (req, res) => {
    const { id } = req.params;
    res.send(`obteniendo usuario con id ${id}`);
});

router.post("/users", (req,res) =>{
    res.send("Creando usuario")
});

router.put("/users/:id", (req, res) => {
    const { id } = req.params;
    res.send(`Actualizando libro con id: ${id}`);
});

router.delete("/users/:id", (req,res) =>{
    const { id } = req.params;
    res.send(`Borrando libro con id: ${id}`);
})

export default router;