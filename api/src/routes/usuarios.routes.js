const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, isAdmin } = require('../middleware/auth.middleware');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios (admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, active } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    const params = [];

    if (role) {
      whereConditions.push('rol = ?');
      params.push(role);
    }

    if (active !== undefined) {
      whereConditions.push('activo = ?');
      params.push(active === 'true');
    }

    if (search) {
      whereConditions.push('(nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const [usuarios] = await db.query(`
      SELECT 
        id, email, nombre, apellido, telefono, rol, activo, 
        email_verificado, ultimo_acceso, created_at
      FROM usuarios
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM usuarios ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        users: usuarios,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
});

// Obtener usuario por ID (admin)
router.get('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [usuarios] = await db.query(`
      SELECT id, email, nombre, apellido, telefono, avatar_url, rol, activo, 
        email_verificado, ultimo_acceso, created_at
      FROM usuarios WHERE id = ?
    `, [id]);

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener direcciones
    const [direcciones] = await db.query(
      'SELECT * FROM direcciones WHERE usuario_id = ?',
      [id]
    );

    // Obtener estadísticas
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM pedidos WHERE usuario_id = ?) AS total_pedidos,
        (SELECT SUM(total) FROM pedidos WHERE usuario_id = ? AND estado != 'cancelado') AS total_gastado,
        (SELECT COUNT(*) FROM favoritos WHERE usuario_id = ?) AS total_favoritos
    `, [id, id, id]);

    res.json({
      success: true,
      data: {
        ...usuarios[0],
        direcciones,
        estadisticas: stats[0]
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
});

// Crear usuario (admin)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { email, password, nombre, apellidos, telefono, rol = 'cliente', activo = true } = req.body;
    const apellido = apellidos || '';

    // Verificar email único
    const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(`
      INSERT INTO usuarios (email, password_hash, nombre, apellido, telefono, rol, activo, email_verificado)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [email, passwordHash, nombre, apellido, telefono, rol, activo]);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    });
  }
});

// Actualizar usuario (admin)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, rol, activo } = req.body;

    const updates = [];
    const values = [];

    if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre); }
    if (apellido !== undefined) { updates.push('apellido = ?'); values.push(apellido); }
    if (telefono !== undefined) { updates.push('telefono = ?'); values.push(telefono); }
    if (rol !== undefined) { updates.push('rol = ?'); values.push(rol); }
    if (activo !== undefined) { updates.push('activo = ?'); values.push(activo); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    values.push(id);

    await db.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario'
    });
  }
});

// Restablecer contraseña (admin)
router.post('/:id/reset-password', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaPassword } = req.body;

    const passwordHash = await bcrypt.hash(nuevaPassword, 10);

    await db.query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer contraseña'
    });
  }
});

// Eliminar usuario (admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir eliminar el propio usuario
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
});

// === DIRECCIONES ===

// Obtener direcciones del usuario autenticado
router.get('/direcciones/mis-direcciones', auth, async (req, res) => {
  try {
    const [direcciones] = await db.query(
      'SELECT * FROM direcciones WHERE usuario_id = ? AND activa = TRUE ORDER BY es_principal DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      data: direcciones
    });
  } catch (error) {
    console.error('Error obteniendo direcciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener direcciones'
    });
  }
});

// Agregar dirección
router.post('/direcciones', auth, async (req, res) => {
  try {
    const {
      nombre_direccion, destinatario, calle, numero_exterior, numero_interior,
      colonia, ciudad, estado, codigo_postal, pais, telefono, instrucciones, es_principal
    } = req.body;

    // Si es principal, quitar principal de las demás
    if (es_principal) {
      await db.query(
        'UPDATE direcciones SET es_principal = FALSE WHERE usuario_id = ?',
        [req.user.id]
      );
    }

    const [result] = await db.query(`
      INSERT INTO direcciones 
        (usuario_id, nombre_direccion, destinatario, calle, numero_exterior, numero_interior,
         colonia, ciudad, estado, codigo_postal, pais, telefono, instrucciones, es_principal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, nombre_direccion, destinatario, calle, numero_exterior, numero_interior,
      colonia, ciudad, estado, codigo_postal, pais || 'México', telefono, instrucciones, es_principal || false
    ]);

    res.status(201).json({
      success: true,
      message: 'Dirección agregada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error agregando dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar dirección'
    });
  }
});

// Actualizar dirección
router.put('/direcciones/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que la dirección pertenece al usuario
    const [direcciones] = await db.query(
      'SELECT id FROM direcciones WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (direcciones.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dirección no encontrada'
      });
    }

    if (updates.es_principal) {
      await db.query(
        'UPDATE direcciones SET es_principal = FALSE WHERE usuario_id = ?',
        [req.user.id]
      );
    }

    const allowedFields = [
      'nombre_direccion', 'destinatario', 'calle', 'numero_exterior', 'numero_interior',
      'colonia', 'ciudad', 'estado', 'codigo_postal', 'pais', 'telefono', 'instrucciones', 'es_principal'
    ];

    const setClause = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (setClause.length > 0) {
      values.push(id);
      await db.query(`UPDATE direcciones SET ${setClause.join(', ')} WHERE id = ?`, values);
    }

    res.json({
      success: true,
      message: 'Dirección actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar dirección'
    });
  }
});

// Eliminar dirección
router.delete('/direcciones/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE direcciones SET activa = FALSE WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Dirección eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando dirección:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar dirección'
    });
  }
});

module.exports = router;
