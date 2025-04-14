// src/middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware para verificar si el usuario está autenticado
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Token debe estar en el encabezado 'Authorization'

  if (!token) {
    return res.status(403).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, 'SECRET_KEY'); // Verifica el token con la clave secreta
    req.user = decoded; // Almacena los datos del usuario en la solicitud
    next(); // Pasa al siguiente middleware o controlador
  } catch (error) {
    res.status(401).json({ message: 'Token no válido' });
  }
};

// Middleware para verificar si el usuario es un administrador
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de admin' });
  }
  next(); // Si el usuario es admin, pasa al siguiente middleware o controlador
};

module.exports = { verifyToken, verifyAdmin };
