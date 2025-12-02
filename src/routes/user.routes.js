import { Router } from "express"
import { User } from '../models/User.js';
import * as bcrypt from 'bcryptjs';
import { verifyToken, isAdmin, isSuperAdmin, isAdminOrSuperAdmin, isProfessional } from "../middleware/auth.js";

const router = Router()

router.get("/users", verifyToken, isAdminOrSuperAdmin, async (req, res) => {
    try {
        let queryOptions = { attributes: { exclude: ['password'] } };
        if (req.userRole === 'admin') {
            queryOptions.where = { role: ['user', 'profesional'] };
        } else if (req.userRole === 'superadmin') {
            queryOptions.where = { role: ['user', 'admin', 'profesional'] };
        }
        const users = await User.findAll(queryOptions);
        res.json(users);
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.get("/users/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (req.userRole === 'user' && req.dniusuario !== id) {
            return res.status(403).json({ message: "Acceso denegado a este perfil de usuario." });
        }

        if (req.userRole === 'admin' && (user.role === 'superadmin' || (user.role === 'admin' && user.id !== req.dniusuario))) {
            return res.status(403).json({ message: "Acceso denegado a este perfil de usuario." });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error interno del servidor." });
    }
});


router.get("/professionals", verifyToken, async (req, res) => {
    
    const allowedRoles = ['user', 'admin', 'superadmin'];

    if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({ mensaje: "Acceso denegado. Se requiere autenticación para ver profesionales." });
    }

    try {
        const professionals = await User.findAll({
            where: { role: 'profesional' }, 
            attributes: ['id', 'name', 'lastname'] 
        });
        
        res.json(professionals);

    } catch (error) {
        console.error("Error al obtener profesionales:", error);
        res.status(500).json({ message: "Error interno del servidor al obtener profesionales." });
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

            if (req.userRole === 'superadmin') {
                const validRolesToAssign = ['user', 'profesional', 'admin'];
                if (role && !validRolesToAssign.includes(role)) {
                    return res.status(400).json({ message: `Rol '${role}' inválido para asignación.` });
                }
            } else if (req.userRole === 'admin') {
                const validRolesToAssign = ['user', 'profesional'];
                if (role && !validRolesToAssign.includes(role)) {
                    return res.status(400).json({ message: `Rol '${role}' inválido o no tienes permiso para asignarlo.` });
                }
            } else {
                if (role && role !== 'user') {
                    return res.status(403).json({ message: "No tiene permiso para asignar roles." });
                }
            }
            if (!role || (role && role === 'superadmin')) {
                role = 'user'; 
            }
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

router.put("/users/:id", verifyToken, async (req, res) => {
    const { id: targetUserId } = req.params;
    const { name, lastname, email, tel, address, role } = req.body;
    const currentUserRole = req.userRole;
    const currentUserId = req.dniusuario;

    try {
        const userToUpdate = await User.findByPk(targetUserId);
        if (!userToUpdate) return res.status(404).json({ message: "Usuario no encontrado." });

        if (role && role !== userToUpdate.role) {
            
            const allowedRoles = ['user', 'profesional', 'admin', 'superadmin'];
            if (role && !allowedRoles.includes(role)) { 
                return res.status(400).json({ message: `Rol '${role}' inválido o desconocido.` });
            }

            if (currentUserRole === 'user') {
                return res.status(403).json({ message: "No tiene permiso para cambiar el rol de usuario." });
            }

            if (currentUserRole === 'admin') {
                
                if (!['user', 'profesional'].includes(userToUpdate.role) && userToUpdate.id !== currentUserId) {
                    return res.status(403).json({ message: "Los administradores solo pueden modificar usuarios comunes o profesionales." });
                }
                if (!['user', 'profesional'].includes(role)) {
                    return res.status(403).json({ message: "Los administradores solo pueden asignar los roles 'user' o 'profesional'." });
                }
                userToUpdate.role = role;

            } else if (currentUserRole === 'superadmin') {
                if (userToUpdate.role === 'superadmin' && userToUpdate.id !== currentUserId) {
                    return res.status(403).json({ message: "No se puede modificar el rol de otro Superadministrador directamente." });
                }
                userToUpdate.role = role;
            }
        }
        
      
        if (!role || role === userToUpdate.role) {
            if (currentUserRole === 'user' && currentUserId !== targetUserId) {
                return res.status(403).json({ message: "Acceso denegado: solo puede modificar su propio perfil." });
            }
            if (currentUserRole === 'admin' && !['user', 'profesional'].includes(userToUpdate.role)) {
                return res.status(403).json({ message: "Los administradores solo pueden modificar datos de usuarios comunes o profesionales." });
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
    const currentUserRole = req.userRole;
    const currentUserId = req.dniusuario;

    try {
        const userToDelete = await User.findByPk(targetUserId);
        if (!userToDelete) return res.status(404).json({ message: "Usuario no encontrado." });

        if (currentUserRole === 'user' && currentUserId !== targetUserId) {
            return res.status(403).json({ message: "No tienes permiso para eliminar otros perfiles." });
        }

        if (currentUserRole === 'admin' && ['admin', 'superadmin'].includes(userToDelete.role)) {
            return res.status(403).json({ message: "Los administradores solo pueden eliminar usuarios comunes o profesionales." });
        }
        
        await userToDelete.destroy();
        res.json({ message: `Usuario con DNI ${targetUserId} eliminado.` });

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ 
                message: 'Este usuario tiene **turnos o citas programadas** asociadas. Para proceder con la eliminación, debe cancelar o eliminar todos sus turnos primero.',
                detail: error.original.code 
            });
        }
        
        return res.status(500).json({ message: "Error interno del servidor." });
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

router.put("/users/:id/assign-professional", verifyToken, isAdminOrSuperAdmin, async (req, res) => {
    const { id: targetUserId } = req.params;
    try {
        const userToPromote = await User.findByPk(targetUserId);
        if (!userToPromote) return res.status(404).json({ message: "Usuario no encontrado." });

        if (req.userRole === 'admin' && userToPromote.role !== 'user') {
            return res.status(403).json({ message: "Un administrador solo puede asignar el rol de 'profesional' a usuarios comunes." });
        }
        
        if (req.userRole === 'superadmin' && !['user', 'admin'].includes(userToPromote.role)) {
             return res.status(403).json({ message: "Un superadministrador solo puede asignar el rol de 'profesional' a usuarios comunes o administradores." });
        }


        userToPromote.role = 'profesional';
        await userToPromote.save();
        const userResponse = userToPromote.toJSON();
        delete userResponse.password;
        res.json({ message: `${userToPromote.name} ahora es profesional.`, user: userResponse });
    } catch (error) {
        console.error("Error al asignar rol de profesional:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.put("/users/:id/revoke-professional", verifyToken, isAdminOrSuperAdmin, async (req, res) => {
    const { id: targetUserId } = req.params;
    try {
        const userToDemote = await User.findByPk(targetUserId);
        if (!userToDemote) return res.status(404).json({ message: "Usuario no encontrado." });

        if (req.userRole === 'admin' && userToDemote.role !== 'profesional') {
            return res.status(403).json({ message: "Un administrador solo puede revocar el rol de 'profesional'." });
        }
        
        if (req.userRole === 'superadmin' && !['profesional', 'admin'].includes(userToDemote.role)) {
             return res.status(403).json({ message: "Un superadministrador solo puede revocar el rol de 'profesional' o 'admin'." });
        }

        userToDemote.role = 'user';
        await userToDemote.save();
        const userResponse = userToDemote.toJSON();
        delete userResponse.password;
        res.json({ message: `El rol de profesional ha sido revocado para ${userToDemote.name}. Ahora es usuario común.`, user: userResponse });
    } catch (error) {
        console.error("Error al revocar rol de profesional:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

export default router;