import { Router } from "express"
import { User } from '../models/User.js';
import * as bcrypt from 'bcryptjs';
import { verifyToken, isAdmin, isSuperAdmin, isAdminOrSuperAdmin } from "../middleware/auth.js";

const router = Router()

router.get("/users", verifyToken, isAdminOrSuperAdmin, async (req, res) => {
    try {
        let queryOptions = { attributes: { exclude: ['password'] } };
        if (req.userRole === 'admin') {
            queryOptions.where = { role: 'user' };
        } else if (req.userRole === 'superadmin') {
            queryOptions.where = { role: ['user', 'admin'] };
        }
        const users = await User.findAll(queryOptions);
        res.json(users);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.get("/users/:id", verifyToken, isAdminOrSuperAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });


        if (req.userRole === 'admin' && (user.role === 'superadmin' || (user.role === 'admin' && user.id !== req.userId))) {
            return res.status(403).json({ message: "Acceso denegado a este perfil de usuario." });
        }

    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.post("/users", async (req, res) => {
    const { id, name, lastname, email, tel, address, password, repPassword } = req.body;
    let { role } = req.body;

    try {
        if (password !== repPassword) {
            return res.status(400).json({ message: "Las contraseñas no coinciden." });
        }

        const userCount = await User.count();
        if (userCount === 0 && role === 'superadmin') {

        } else if (req.userRole === 'superadmin' || req.userRole === 'admin') {

            const validRolesToAssign = (req.userRole === 'superadmin') ? ['user', 'admin'] : ['user'];
            if (role && !validRolesToAssign.includes(role)) {
                return res.status(400).json({ message: `Rol '${role}' inválido o no tienes permiso para asignarlo.` });
            }
            if (!role) role = 'user';
        } else {

            role = 'user';
        }


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            id, name, lastname, email, tel, address,
            password: hashedPassword,
            role: role
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
            return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.put("/users/:id", verifyToken, isAdminOrSuperAdmin, async (req, res) => {
    const { id: targetUserId } = req.params;
    const { name, lastname, email, tel, address, role } = req.body;

    try {
        const userToUpdate = await User.findByPk(targetUserId);
        if (!userToUpdate) return res.status(404).json({ message: "Usuario no encontrado." });

        if (req.userRole === 'admin') {
            if (userToUpdate.role !== 'user') {
                return res.status(403).json({ message: "Los administradores solo pueden modificar usuarios comunes." });
            }

            if (role && role !== userToUpdate.role) {
                return res.status(403).json({ message: "Los administradores no pueden cambiar roles de usuario." });
            }
        }

        else if (req.userRole === 'superadmin') {
            if (userToUpdate.role === 'superadmin' && req.userId !== targetUserId) {
                return res.status(403).json({ message: "No se puede modificar otro Superadministrador directamente." });
            }
            if (role && ['user', 'admin'].includes(role)) {
                userToUpdate.role = role;
            } else if (role && role !== userToUpdate.role) {
                return res.status(400).json({ message: `Rol '${role}' inválido para asignación.` });
            }
        }


        if (email && email !== userToUpdate.email) {
            const existingEmailUser = await User.findOne({ where: { email } });
            if (existingEmailUser && existingEmailUser.id !== targetUserId) {
                return res.status(409).json({ message: "El nuevo correo electrónico ya está en uso." });
            }
        }


        userToUpdate.name = name ?? userToUpdate.name;
        userToUpdate.lastname = lastname ?? userToUpdate.lastname;
        userToUpdate.email = email ?? userToUpdate.email;
        userToUpdate.tel = tel ?? userToUpdate.tel;
        userToUpdate.address = address ?? userToUpdate.address;

        await userToUpdate.save();

        const userResponse = userToUpdate.toJSON();
        delete userResponse.password;
        res.json({ message: "Usuario actualizado.", user: userResponse });

    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Error de validación', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.delete("/users/:id", verifyToken, async (req, res) => {
    const { id: targetUserId } = req.params;

    try {
        const userToDelete = await User.findByPk(targetUserId);
        if (!userToDelete) return res.status(404).json({ message: "Usuario no encontrado." });

        if (req.dniusuario === targetUserId) {
            if (userToDelete.role === 'superadmin') {
                const superAdminCount = await User.count({ where: { role: 'superadmin' } });
                if (superAdminCount <= 1) {
                    return res.status(403).json({ message: "No se puede eliminar el último Superadministrador." });
                }
            }
        } else {
            if (req.userRole === 'user') {
                return res.status(403).json({ message: "No tienes permiso para eliminar otros perfiles." });
            }

            if (req.userRole === 'admin') {
                if (userToDelete.role !== 'user') {
                    return res.status(403).json({ message: "Los administradores solo pueden eliminar usuarios comunes." });
                }
            } else if (req.userRole === 'superadmin') {
                if (userToDelete.role === 'superadmin') {
                    const superAdminCount = await User.count({ where: { role: 'superadmin' } });
                    if (superAdminCount <= 1) {
                        return res.status(403).json({ message: "No se puede eliminar el último Superadministrador." });
                    }
                }
            } else {
                return res.status(403).json({ message: "Acceso denegado para eliminar este perfil." });
            }
        }

        await userToDelete.destroy();
        res.json({ message: `Usuario con DNI ${targetUserId} eliminado.` });

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.put("/users/:id/assign-admin", verifyToken, isSuperAdmin, async (req, res) => {
    const { id: targetUserId } = req.params;
    try {
        const userToPromote = await User.findByPk(targetUserId);
        if (!userToPromote) return res.status(404).json({ message: "Usuario no encontrado." });

        if (userToPromote.role === 'admin') {
            return res.status(400).json({ message: "El usuario ya es administrador." });
        }
        if (userToPromote.role === 'superadmin') {
            return res.status(400).json({ message: "No se puede modificar el rol de un Superadministrador de esta forma." });
        }
        if (userToPromote.role !== 'user') {
            return res.status(400).json({ message: "Solo los usuarios con rol 'user' pueden ser promovidos." });
        }


        userToPromote.role = 'admin';
        await userToPromote.save();
        const userResponse = userToPromote.toJSON();
        delete userResponse.password;
        res.json({ message: `${userToPromote.name} ahora es administrador.`, user: userResponse });
    } catch (error) {
        console.error("Error al asignar rol de administrador:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.put("/users/:id/revoke-admin", verifyToken, isSuperAdmin, async (req, res) => {
    const { id: targetUserId } = req.params;
    try {
        const userToDemote = await User.findByPk(targetUserId);
        if (!userToDemote) return res.status(404).json({ message: "Usuario no encontrado." });
        if (userToDemote.role !== 'admin') {
            return res.status(400).json({ message: "Este usuario no es un administrador." });
        }

        userToDemote.role = 'user';
        await userToDemote.save();
        const userResponse = userToDemote.toJSON();
        delete userResponse.password;
        res.json({ message: `El rol de administrador ha sido revocado para ${userToDemote.name}. Ahora es usuario común.`, user: userResponse });
    } catch (error) {
        console.error("Error al revocar rol de administrador:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

export default router;