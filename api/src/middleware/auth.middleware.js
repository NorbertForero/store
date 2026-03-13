const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario existe y está activo
    const [users] = await db.query(
      'SELECT id, email, nombre, apellido, rol, activo FROM usuarios WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido o inactivo'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token no válido'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.query(
      'SELECT id, email, nombre, apellido, rol, activo FROM usuarios WHERE id = ?',
      [decoded.userId]
    );

    if (users.length > 0 && users[0].activo) {
      req.user = users[0];
    }
    
    next();
  } catch (error) {
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
};

const isAdminOrVendedor = (req, res, next) => {
  if (!req.user || !['admin', 'vendedor'].includes(req.user.rol)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos especiales.'
    });
  }
  next();
};

module.exports = { auth, optionalAuth, isAdmin, isAdminOrVendedor };
