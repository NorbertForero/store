const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth } = require('../middleware/auth.middleware');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/email.service');

// Registro de usuario
router.post('/registro', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nombre').trim().notEmpty(),
  body('apellido').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, nombre, apellido, telefono } = req.body;

    // Verificar si el email ya existe
    const [existingUsers] = await db.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar usuario
    const [result] = await db.query(
      `INSERT INTO usuarios (email, password_hash, nombre, apellido, telefono) 
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, nombre, apellido, telefono || null]
    );

    // Generar token
    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        token,
        user: {
          id: result.insertId,
          email,
          nombre,
          apellido,
          rol: 'cliente'
        }
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const [users] = await db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const user = users[0];

    if (!user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Actualizar último acceso
    await db.query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
      [user.id]
    );

    // Generar token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          avatar_url: user.avatar_url
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
});

// Obtener perfil del usuario autenticado
router.get('/perfil', auth, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, email, nombre, apellido, telefono, avatar_url, rol, created_at 
       FROM usuarios WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener direcciones del usuario
    const [direcciones] = await db.query(
      'SELECT * FROM direcciones WHERE usuario_id = ? AND activa = TRUE',
      [req.user.id]
    );

    res.json({
      success: true,
      data: {
        ...users[0],
        direcciones
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
});

// Actualizar perfil
router.put('/perfil', auth, [
  body('nombre').optional().trim().notEmpty(),
  body('apellido').optional().trim().notEmpty(),
  body('telefono').optional()
], async (req, res) => {
  try {
    const { nombre, apellido, telefono, avatar_url } = req.body;
    
    const updates = [];
    const values = [];
    
    if (nombre) { updates.push('nombre = ?'); values.push(nombre); }
    if (apellido) { updates.push('apellido = ?'); values.push(apellido); }
    if (telefono !== undefined) { updates.push('telefono = ?'); values.push(telefono); }
    if (avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(avatar_url); }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar'
      });
    }
    
    values.push(req.user.id);
    
    await db.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
});

// Cambiar contraseña
router.put('/cambiar-password', auth, [
  body('passwordActual').notEmpty(),
  body('passwordNuevo').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { passwordActual, passwordNuevo } = req.body;

    // Obtener usuario con contraseña
    const [users] = await db.query(
      'SELECT password_hash FROM usuarios WHERE id = ?',
      [req.user.id]
    );

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(passwordActual, users[0].password_hash);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hash de la nueva contraseña
    const newPasswordHash = await bcrypt.hash(passwordNuevo, 10);

    await db.query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
});

// ==========================================
// RESTABLECIMIENTO DE CONTRASEÑA
// ==========================================

// Solicitar restablecimiento de contraseña
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    // Buscar usuario
    const [users] = await db.query(
      'SELECT id, nombre, email, activo FROM usuarios WHERE email = ?',
      [email]
    );

    // Por seguridad, siempre respondemos igual (evitar enumeración de usuarios)
    if (users.length === 0 || !users[0].activo) {
      // Simulamos tiempo de procesamiento para evitar timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    const user = users[0];

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token hasheado en la BD
    await db.query(
      `UPDATE usuarios 
       SET reset_token = ?, reset_token_expiry = ? 
       WHERE id = ?`,
      [resetTokenHash, resetTokenExpiry, user.id]
    );

    // Enviar email
    try {
      await sendPasswordResetEmail(user.email, user.nombre, resetToken);
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // Limpiamos el token si falla el envío
      await db.query(
        'UPDATE usuarios SET reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [user.id]
      );
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el correo. Intenta de nuevo más tarde.'
      });
    }

    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña'
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
});

// Verificar token de restablecimiento
router.get('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Hashear el token para comparar con la BD
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con token válido y no expirado
    const [users] = await db.query(
      `SELECT id, email, nombre 
       FROM usuarios 
       WHERE reset_token = ? AND reset_token_expiry > NOW() AND activo = TRUE`,
      [tokenHash]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El enlace es inválido o ha expirado'
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        email: users[0].email
      }
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el token'
    });
  }
});

// Restablecer contraseña con token
router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Las contraseñas no coinciden')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Hashear el token para comparar con la BD
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con token válido y no expirado
    const [users] = await db.query(
      `SELECT id, email, nombre 
       FROM usuarios 
       WHERE reset_token = ? AND reset_token_expiry > NOW() AND activo = TRUE`,
      [tokenHash]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El enlace es inválido o ha expirado'
      });
    }

    const user = users[0];

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Actualizar contraseña y limpiar token
    await db.query(
      `UPDATE usuarios 
       SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = ?`,
      [passwordHash, user.id]
    );

    // Enviar email de confirmación
    await sendPasswordChangedEmail(user.email, user.nombre);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'
    });
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña'
    });
  }
});

module.exports = router;
