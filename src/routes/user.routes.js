import {Router} from "express"

const router = Router()

router.get("/users", (req, res) => {
    res.send("obteniendo usuarios");
});

router.get("/users/:id", (req, res) => {
    const { id } = req.params;
    res.send(`obteniendo usuario con id ${id}`);
});

router.post("/users", (req,res) =>{
    res.send("Creando usuario")
});

router.put("/users/:id", (req, res) => {
    const { id } = req.params;
    res.send(`Actualizando usuario con id: ${id}`);
});

router.delete("/users/:id", (req,res) =>{
    const { id } = req.params;
    res.send(`Borrando usuario con id: ${id}`);
})

export default router;