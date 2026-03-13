const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, isAdmin } = require('../middleware/auth.middleware');

// Obtener configuración pública
router.get('/publica', async (req, res) => {
  try {
    const [configuracion] = await db.query(`
      SELECT clave, valor, tipo 
      FROM configuracion 
      WHERE grupo IN ('general', 'envio')
    `);

    const config = {};
    configuracion.forEach(c => {
      if (c.tipo === 'numero') {
        config[c.clave] = parseFloat(c.valor);
      } else if (c.tipo === 'booleano') {
        config[c.clave] = c.valor === 'true';
      } else if (c.tipo === 'json') {
        try { config[c.clave] = JSON.parse(c.valor); } catch { config[c.clave] = c.valor; }
      } else {
        config[c.clave] = c.valor;
      }
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
});

// Obtener toda la configuración (admin)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const { grupo } = req.query;

    let query = 'SELECT * FROM configuracion';
    const params = [];

    if (grupo) {
      query += ' WHERE grupo = ?';
      params.push(grupo);
    }

    query += ' ORDER BY grupo, clave';

    const [configuracion] = await db.query(query, params);

    // Agrupar por grupo
    const agrupada = {};
    configuracion.forEach(c => {
      if (!agrupada[c.grupo]) {
        agrupada[c.grupo] = [];
      }
      agrupada[c.grupo].push(c);
    });

    res.json({
      success: true,
      data: agrupada
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
});

// Actualizar configuración (admin)
router.put('/:clave', auth, isAdmin, async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;

    const [result] = await db.query(
      'UPDATE configuracion SET valor = ? WHERE clave = ?',
      [valor, clave]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración'
    });
  }
});

// Actualizar múltiples configuraciones (admin)
router.put('/', auth, isAdmin, async (req, res) => {
  try {
    const configuraciones = req.body;

    for (const [clave, valor] of Object.entries(configuraciones)) {
      await db.query(
        'UPDATE configuracion SET valor = ? WHERE clave = ?',
        [String(valor), clave]
      );
    }

    res.json({
      success: true,
      message: 'Configuraciones actualizadas exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuraciones'
    });
  }
});

// Crear nueva configuración (admin)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const { clave, valor, tipo = 'texto', descripcion, grupo } = req.body;

    await db.query(`
      INSERT INTO configuracion (clave, valor, tipo, descripcion, grupo)
      VALUES (?, ?, ?, ?, ?)
    `, [clave, valor, tipo, descripcion, grupo]);

    res.status(201).json({
      success: true,
      message: 'Configuración creada exitosamente'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'La clave ya existe'
      });
    }
    console.error('Error creando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear configuración'
    });
  }
});

// === BANNERS ===

// Obtener banners públicos
router.get('/banners/activos', async (req, res) => {
  try {
    const { posicion } = req.query;

    let query = `
      SELECT * FROM banners 
      WHERE activo = TRUE 
        AND (fecha_inicio IS NULL OR fecha_inicio <= NOW())
        AND (fecha_fin IS NULL OR fecha_fin >= NOW())
    `;
    const params = [];

    if (posicion) {
      query += ' AND posicion = ?';
      params.push(posicion);
    }

    query += ' ORDER BY orden';

    const [banners] = await db.query(query, params);

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error obteniendo banners:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener banners'
    });
  }
});

// Obtener todos los banners (admin)
router.get('/banners', auth, isAdmin, async (req, res) => {
  try {
    const [banners] = await db.query('SELECT * FROM banners ORDER BY orden');

    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error obteniendo banners:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener banners'
    });
  }
});

// Crear banner (admin)
router.post('/banners', auth, isAdmin, async (req, res) => {
  try {
    const {
      titulo, subtitulo, imagen_url, imagen_movil_url, enlace,
      texto_boton, posicion, orden, activo, fecha_inicio, fecha_fin
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO banners 
        (titulo, subtitulo, imagen_url, imagen_movil_url, enlace, texto_boton, posicion, orden, activo, fecha_inicio, fecha_fin)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [titulo, subtitulo, imagen_url, imagen_movil_url, enlace, texto_boton, posicion || 'home_principal', orden || 0, activo !== false, fecha_inicio, fecha_fin]);

    res.status(201).json({
      success: true,
      message: 'Banner creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear banner'
    });
  }
});

// Actualizar banner (admin)
router.put('/banners/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'titulo', 'subtitulo', 'imagen_url', 'imagen_movil_url', 'enlace',
      'texto_boton', 'posicion', 'orden', 'activo', 'fecha_inicio', 'fecha_fin'
    ];

    const setClause = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    values.push(id);

    await db.query(`UPDATE banners SET ${setClause.join(', ')} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Banner actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar banner'
    });
  }
});

// Eliminar banner (admin)
router.delete('/banners/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM banners WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Banner eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando banner:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar banner'
    });
  }
});

// === CUPONES ===

// Obtener cupones (admin)
router.get('/cupones', auth, isAdmin, async (req, res) => {
  try {
    const [cupones] = await db.query('SELECT * FROM cupones ORDER BY created_at DESC');

    res.json({
      success: true,
      data: cupones
    });
  } catch (error) {
    console.error('Error obteniendo cupones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cupones'
    });
  }
});

// Crear cupón (admin)
router.post('/cupones', auth, isAdmin, async (req, res) => {
  try {
    const {
      codigo, descripcion, tipo, valor, minimo_compra,
      maximo_descuento, usos_maximos, usos_por_usuario,
      fecha_inicio, fecha_fin, activo
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO cupones 
        (codigo, descripcion, tipo, valor, minimo_compra, maximo_descuento, usos_maximos, usos_por_usuario, fecha_inicio, fecha_fin, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo.toUpperCase(), descripcion, tipo, valor, minimo_compra || 0,
      maximo_descuento, usos_maximos, usos_por_usuario || 1,
      fecha_inicio, fecha_fin, activo !== false
    ]);

    res.status(201).json({
      success: true,
      message: 'Cupón creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El código de cupón ya existe'
      });
    }
    console.error('Error creando cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cupón'
    });
  }
});

// Actualizar cupón (admin)
router.put('/cupones/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'descripcion', 'tipo', 'valor', 'minimo_compra', 'maximo_descuento',
      'usos_maximos', 'usos_por_usuario', 'fecha_inicio', 'fecha_fin', 'activo'
    ];

    const setClause = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    values.push(id);

    await db.query(`UPDATE cupones SET ${setClause.join(', ')} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Cupón actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cupón'
    });
  }
});

// Eliminar cupón (admin)
router.delete('/cupones/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM cupones WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Cupón eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cupón'
    });
  }
});

module.exports = router;
