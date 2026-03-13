const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth.middleware');

// Obtener favoritos del usuario
router.get('/', auth, async (req, res) => {
  try {
    const [favoritos] = await db.query(`
      SELECT 
        f.id AS favorito_id, f.created_at AS agregado_en,
        p.id, p.nombre, p.slug, p.precio, p.precio_oferta, p.stock, p.disponible,
        p.calificacion_promedio,
        (SELECT url FROM productos_imagenes WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) AS imagen
      FROM favoritos f
      JOIN productos p ON f.producto_id = p.id
      WHERE f.usuario_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.id]);

    res.json({
      success: true,
      data: favoritos
    });
  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener favoritos'
    });
  }
});

// Agregar a favoritos
router.post('/', auth, async (req, res) => {
  try {
    const { producto_id } = req.body;

    // Verificar que el producto existe
    const [productos] = await db.query(
      'SELECT id FROM productos WHERE id = ?',
      [producto_id]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si ya está en favoritos
    const [existing] = await db.query(
      'SELECT id FROM favoritos WHERE usuario_id = ? AND producto_id = ?',
      [req.user.id, producto_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El producto ya está en favoritos'
      });
    }

    await db.query(
      'INSERT INTO favoritos (usuario_id, producto_id) VALUES (?, ?)',
      [req.user.id, producto_id]
    );

    res.status(201).json({
      success: true,
      message: 'Producto agregado a favoritos'
    });
  } catch (error) {
    console.error('Error agregando a favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar a favoritos'
    });
  }
});

// Eliminar de favoritos
router.delete('/:productoId', auth, async (req, res) => {
  try {
    const { productoId } = req.params;

    const [result] = await db.query(
      'DELETE FROM favoritos WHERE usuario_id = ? AND producto_id = ?',
      [req.user.id, productoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado en favoritos'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado de favoritos'
    });
  } catch (error) {
    console.error('Error eliminando de favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar de favoritos'
    });
  }
});

// Verificar si un producto está en favoritos
router.get('/check/:productoId', auth, async (req, res) => {
  try {
    const { productoId } = req.params;

    const [favoritos] = await db.query(
      'SELECT id FROM favoritos WHERE usuario_id = ? AND producto_id = ?',
      [req.user.id, productoId]
    );

    res.json({
      success: true,
      data: { enFavoritos: favoritos.length > 0 }
    });
  } catch (error) {
    console.error('Error verificando favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar favorito'
    });
  }
});

// Toggle favorito (agregar/quitar)
router.post('/toggle/:productoId', auth, async (req, res) => {
  try {
    const { productoId } = req.params;

    const [existing] = await db.query(
      'SELECT id FROM favoritos WHERE usuario_id = ? AND producto_id = ?',
      [req.user.id, productoId]
    );

    if (existing.length > 0) {
      await db.query(
        'DELETE FROM favoritos WHERE usuario_id = ? AND producto_id = ?',
        [req.user.id, productoId]
      );
      return res.json({
        success: true,
        message: 'Producto eliminado de favoritos',
        data: { enFavoritos: false }
      });
    }

    // Verificar que el producto existe
    const [productos] = await db.query('SELECT id FROM productos WHERE id = ?', [productoId]);
    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    await db.query(
      'INSERT INTO favoritos (usuario_id, producto_id) VALUES (?, ?)',
      [req.user.id, productoId]
    );

    res.json({
      success: true,
      message: 'Producto agregado a favoritos',
      data: { enFavoritos: true }
    });
  } catch (error) {
    console.error('Error en toggle favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar favorito'
    });
  }
});

module.exports = router;
