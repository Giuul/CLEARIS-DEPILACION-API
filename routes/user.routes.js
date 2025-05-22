import {Router} from "express"

const router = Router()

router.get("/users", (req, res) => {
    res.send("obteniendo usuarios");
});

export default router;