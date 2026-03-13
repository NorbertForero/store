const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, isAdminOrVendedor } = require('../middleware/auth.middleware');

// Obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const { jerarquica = 'true' } = req.query;

    const [categorias] = await db.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM productos_categorias pc WHERE pc.categoria_id = c.id) AS total_productos
      FROM categorias c
      WHERE c.activa = TRUE
      ORDER BY c.orden, c.nombre
    `);

    if (jerarquica === 'true') {
      // Construir árbol jerárquico
      const categoriasMap = new Map();
      const raices = [];

      categorias.forEach(cat => {
        categoriasMap.set(cat.id, { ...cat, subcategorias: [] });
      });

      categorias.forEach(cat => {
        if (cat.categoria_padre_id) {
          const padre = categoriasMap.get(cat.categoria_padre_id);
          if (padre) {
            padre.subcategorias.push(categoriasMap.get(cat.id));
          }
        } else {
          raices.push(categoriasMap.get(cat.id));
        }
      });

      return res.json({
        success: true,
        data: raices
      });
    }

    res.json({
      success: true,
      data: categorias
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
});

// Obtener categoría por slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [categorias] = await db.query(`
      SELECT c.*, cp.nombre AS categoria_padre_nombre, cp.slug AS categoria_padre_slug
      FROM categorias c
      LEFT JOIN categorias cp ON c.categoria_padre_id = cp.id
      WHERE c.slug = ? OR c.id = ?
    `, [slug, slug]);

    if (categorias.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Obtener subcategorías
    const [subcategorias] = await db.query(
      'SELECT id, nombre, slug, imagen_url FROM categorias WHERE categoria_padre_id = ? AND activa = TRUE ORDER BY orden',
      [categorias[0].id]
    );

    res.json({
      success: true,
      data: {
        ...categorias[0],
        subcategorias
      }
    });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría'
    });
  }
});

// Crear categoría (admin)
router.post('/', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { nombre, descripcion, imagen_url, categoria_padre_id, orden } = req.body;

    const slug = nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const [result] = await db.query(`
      INSERT INTO categorias (nombre, slug, descripcion, imagen_url, categoria_padre_id, orden)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nombre, slug, descripcion, imagen_url, categoria_padre_id || null, orden || 0]);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: { id: result.insertId, slug }
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    });
  }
});

// Actualizar categoría
router.put('/:id', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, imagen_url, categoria_padre_id, orden, activa } = req.body;

    const updates = [];
    const values = [];

    if (nombre !== undefined) { updates.push('nombre = ?'); values.push(nombre); }
    if (descripcion !== undefined) { updates.push('descripcion = ?'); values.push(descripcion); }
    if (imagen_url !== undefined) { updates.push('imagen_url = ?'); values.push(imagen_url); }
    if (categoria_padre_id !== undefined) { updates.push('categoria_padre_id = ?'); values.push(categoria_padre_id); }
    if (orden !== undefined) { updates.push('orden = ?'); values.push(orden); }
    if (activa !== undefined) { updates.push('activa = ?'); values.push(activa); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    values.push(id);

    await db.query(`UPDATE categorias SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría'
    });
  }
});

// Eliminar categoría
router.delete('/:id', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM categorias WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría'
    });
  }
});

// Obtener marcas
router.get('/marcas/todas', async (req, res) => {
  try {
    const [marcas] = await db.query(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM productos WHERE marca_id = m.id) AS total_productos
      FROM marcas m
      WHERE m.activa = TRUE
      ORDER BY m.nombre
    `);

    res.json({
      success: true,
      data: marcas
    });
  } catch (error) {
    console.error('Error obteniendo marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marcas'
    });
  }
});

module.exports = router;
