import { Router } from "express"
import { User } from '../models/User.js';
import * as bcrypt from 'bcryptjs';

const router = Router()

router.get("/users", (req, res) => {
    res.send("obteniendo usuarios");
});

router.get("/users/:id", (req, res) => {
    const { id } = req.params;
    res.send(`obteniendo usuario con id ${id}`);
});

router.post("/users", async (req, res) => {
    
    const { id, name, lastname, email, tel, address, password, repPassword } = req.body;

    try {
        if (password !== repPassword) {
            return res.status(400).json({ message: "Las contraseñas no coinciden." });
        }

        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt);

        
        const newUser = await User.create({
            id: id,          
            name: name,       
            lastname: lastname, 
            email: email,     
            tel: tel,        
            address: address, 
            password: hashedPassword 
        });

        
        const userResponse = newUser.toJSON();
        delete userResponse.password; 

        res.status(201).json(userResponse);

    } catch (error) {
        console.error("Error al crear usuario:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'El DNI o correo ya está registrado.' });
        }
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Error de validación', errors });
        }
        res.status(500).json({ message: "Error interno del servidor al crear usuario." });
    }
});

export default router;