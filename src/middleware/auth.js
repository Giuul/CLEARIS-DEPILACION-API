import jwt from 'jsonwebtoken';

const JWT_SECRET = 'usuario-correcto';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó token de autenticación.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.dniusuario = decoded.id;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        console.error("Error al verificar token:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'Token de autenticación expirado. Por favor, inicia sesión de nuevo.' });
        }
        return res.status(403).json({ mensaje: 'Token de autenticación inválido.', error: error.message });
    }
};
export const isSuperAdmin = (req, res, next) => {
    if (req.userRole && req.userRole === 'superadmin') {
        next();
    } else {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Superadministrador.' });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.userRole && req.userRole === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador.' });
    }
};

export const isAdminOrSuperAdmin = (req, res, next) => {
    if (req.userRole && (req.userRole === 'admin' || req.userRole === 'superadmin')) {
        next();
    } else {
        return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de Administrador o Superadministrador.' });
    }
};