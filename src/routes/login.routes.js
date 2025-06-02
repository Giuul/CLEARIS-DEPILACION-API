import { Router } from 'express';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = 'usuario-correcto';

router.post('/login', async (req, res) => {

    console.log('Body recibido:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Faltan email o contraseña' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        console.log('Usuario encontrado:', user ? user.toJSON() : 'No encontrado');

        if (!user) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const passwordValida = await bcrypt.compare(password, user.password);
        console.log('¿Contraseña válida?', passwordValida);

        if (!passwordValida) {
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.json({ token });


    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

export default router;
