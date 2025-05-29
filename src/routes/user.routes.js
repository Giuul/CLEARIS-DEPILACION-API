import { Router } from "express"
import { User } from '../models/User.js';
import * as bcrypt from 'bcryptjs';

const router = Router()

router.get("/users", async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] } 
        });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener usuarios." });
    }
});

router.get("/users/:id", async (req, res) => { 
    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error al obtener usuario por ID:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
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

router.put("/users/:id", async (req, res) => {
    const { id } = req.params;
    const { name, lastname, email, tel, address, password } = req.body; 

    try {
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        
        let hashedPassword;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        await user.update({
            name: name || user.name, 
            lastname: lastname || user.lastname,
            email: email || user.email,
            tel: tel || user.tel,
            address: address || user.address,
            password: hashedPassword || user.password 
        });

        const userResponse = user.toJSON();
        delete userResponse.password; 

        res.status(200).json({ message: "Usuario actualizado exitosamente.", user: userResponse });

    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado con otro usuario.' });
        }
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Error de validación al actualizar usuario', errors });
        }
        res.status(500).json({ message: "Error interno del servidor al actualizar usuario." });
    }
});

router.delete("/users/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await User.destroy({
            where: { id: id }
        });

        if (result === 0) { 
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        res.status(204).json(); 

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ message: "Error interno del servidor al eliminar usuario." });
    }
});

export default router;