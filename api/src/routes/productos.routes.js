const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, optionalAuth, isAdminOrVendedor } = require('../middleware/auth.middleware');

// Obtener todos los productos con filtros y paginación
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      order = 'DESC',
      featured,
      newProducts,
      onSale,
      status
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = [];
    let params = [];
    let needsCategoryJoin = false;

    if (category) {
      needsCategoryJoin = true;
      whereConditions.push('(cat.slug = ? OR cat.id = ?)');
      params.push(category, category);
    }

    if (search) {
      whereConditions.push('(p.nombre LIKE ? OR p.descripcion LIKE ? OR p.sku LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (minPrice) {
      whereConditions.push('p.precio >= ?');
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereConditions.push('p.precio <= ?');
      params.push(parseFloat(maxPrice));
    }

    if (featured === 'true') {
      whereConditions.push('p.destacado = 1');
    }

    if (newProducts === 'true') {
      whereConditions.push('p.nuevo = 1');
    }

    if (onSale === 'true') {
      whereConditions.push('p.precio_oferta IS NOT NULL AND p.precio_oferta < p.precio');
    }

    if (status === 'active') {
      whereConditions.push('p.disponible = 1');
    } else if (status === 'inactive') {
      whereConditions.push('p.disponible = 0');
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Valid sort fields
    const validOrderFields = ['precio', 'nombre', 'created_at'];
    const orderField = validOrderFields.includes(sortBy) ? `p.${sortBy}` : 'p.created_at';
    const orderDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Build JOIN clause
    const categoryJoin = needsCategoryJoin 
      ? `JOIN productos_categorias pc ON p.id = pc.producto_id
         JOIN categorias cat ON pc.categoria_id = cat.id`
      : '';

    // Main query
    const [productos] = await db.query(`
      SELECT DISTINCT
        p.id, p.sku, p.nombre, p.slug, p.descripcion_corta, p.precio,
        p.precio_oferta, p.stock, p.disponible, p.destacado, p.nuevo, p.created_at,
        (SELECT url FROM productos_imagenes WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) AS imagen_principal,
        (SELECT c.nombre FROM productos_categorias pc2 
         JOIN categorias c ON pc2.categoria_id = c.id 
         WHERE pc2.producto_id = p.id LIMIT 1) AS categoria_nombre
      FROM productos p
      ${categoryJoin}
      ${whereClause}
      ORDER BY ${orderField} ${orderDirection}
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    // Count total
    const [countResult] = await db.query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM productos p
      ${categoryJoin}
      ${whereClause}
    `, params);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        products: productos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting products'
    });
  }
});

// Obtener producto por slug o ID
router.get('/:identificador', optionalAuth, async (req, res) => {
  try {
    const { identificador } = req.params;
    
    const [productos] = await db.query(`
      SELECT 
        p.*,
        m.nombre AS marca_nombre, m.slug AS marca_slug
      FROM productos p
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.slug = ? OR p.id = ?
    `, [identificador, identificador]);

    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const producto = productos[0];

    // Obtener imágenes
    const [imagenes] = await db.query(
      'SELECT id, url, alt_text, es_principal, orden FROM productos_imagenes WHERE producto_id = ? ORDER BY orden',
      [producto.id]
    );

    // Obtener categorías
    const [categorias] = await db.query(`
      SELECT c.id, c.nombre, c.slug
      FROM categorias c
      JOIN productos_categorias pc ON c.id = pc.categoria_id
      WHERE pc.producto_id = ?
    `, [producto.id]);

    // Obtener variantes
    const [variantes] = await db.query(`
      SELECT pv.*, 
        GROUP_CONCAT(CONCAT(a.nombre, ':', av.valor) SEPARATOR '|') AS atributos
      FROM productos_variantes pv
      LEFT JOIN variantes_atributos va ON pv.id = va.variante_id
      LEFT JOIN atributos_valores av ON va.atributo_valor_id = av.id
      LEFT JOIN atributos a ON av.atributo_id = a.id
      WHERE pv.producto_id = ? AND pv.activa = TRUE
      GROUP BY pv.id
    `, [producto.id]);

    // Verificar si está en favoritos (si hay usuario autenticado)
    let enFavoritos = false;
    if (req.user) {
      const [fav] = await db.query(
        'SELECT id FROM favoritos WHERE usuario_id = ? AND producto_id = ?',
        [req.user.id, producto.id]
      );
      enFavoritos = fav.length > 0;
    }

    // Obtener reseñas
    const [resenas] = await db.query(`
      SELECT r.*, u.nombre AS usuario_nombre
      FROM resenas r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.producto_id = ? AND r.aprobada = TRUE
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [producto.id]);

    res.json({
      success: true,
      data: {
        ...producto,
        imagenes,
        categorias,
        variantes: variantes.map(v => ({
          ...v,
          atributos: v.atributos ? v.atributos.split('|').map(attr => {
            const [nombre, valor] = attr.split(':');
            return { nombre, valor };
          }) : []
        })),
        enFavoritos,
        resenas
      }
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
});

// Crear producto (solo admin/vendedor)
router.post('/', auth, isAdminOrVendedor, [
  body('nombre').trim().notEmpty(),
  body('precio').isFloat({ min: 0 }),
  body('sku').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      sku, nombre, descripcion_corta, descripcion, marca_id,
      precio, precio_oferta, costo, stock, stock_minimo, stock_maximo,
      disponible = true, destacado = false, nuevo = true,
      categorias = [], imagenes = []
    } = req.body;

    // Generar slug
    const slug = nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Verificar SKU único
    const [existingSku] = await db.query('SELECT id FROM productos WHERE sku = ?', [sku]);
    if (existingSku.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El SKU ya existe'
      });
    }

    const [result] = await db.query(`
      INSERT INTO productos 
        (sku, nombre, slug, descripcion_corta, descripcion, marca_id, 
         precio, precio_oferta, costo, stock, stock_minimo, stock_maximo,
         disponible, destacado, nuevo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sku, nombre, slug, descripcion_corta, descripcion, marca_id,
      precio, precio_oferta, costo, stock || 0, stock_minimo || 5, stock_maximo || 1000,
      disponible, destacado, nuevo
    ]);

    const productoId = result.insertId;

    // Insertar categorías
    if (categorias.length > 0) {
      const catValues = categorias.map((catId, idx) => [productoId, catId, idx === 0]);
      await db.query(
        'INSERT INTO productos_categorias (producto_id, categoria_id, es_principal) VALUES ?',
        [catValues]
      );
    }

    // Insertar imágenes
    if (imagenes.length > 0) {
      const imgValues = imagenes.map((img, idx) => [
        productoId, img.url, img.alt_text || nombre, idx === 0, idx
      ]);
      await db.query(
        'INSERT INTO productos_imagenes (producto_id, url, alt_text, es_principal, orden) VALUES ?',
        [imgValues]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { id: productoId, slug }
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear producto'
    });
  }
});

// Actualizar producto
router.put('/:id', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Normalizar campos: el frontend puede enviar 'activo' o 'disponible'
    if (updates.activo !== undefined && updates.disponible === undefined) {
      updates.disponible = updates.activo;
    }
    delete updates.activo;

    // Normalizar categorías: el frontend puede enviar 'categoria_ids' o 'categorias'
    if (updates.categoria_ids !== undefined && updates.categorias === undefined) {
      updates.categorias = updates.categoria_ids;
    }
    delete updates.categoria_ids;

    // Verificar que el producto existe
    const [productos] = await db.query('SELECT id FROM productos WHERE id = ?', [id]);
    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Campos permitidos para actualizar
    const allowedFields = [
      'nombre', 'descripcion_corta', 'descripcion', 'marca_id',
      'precio', 'precio_oferta', 'costo', 'stock', 'stock_minimo', 'stock_maximo',
      'disponible', 'destacado', 'nuevo', 'meta_titulo', 'meta_descripcion'
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

    await db.query(
      `UPDATE productos SET ${setClause.join(', ')} WHERE id = ?`,
      values
    );

    // Actualizar categorías si se proporcionan
    if (updates.categorias) {
      await db.query('DELETE FROM productos_categorias WHERE producto_id = ?', [id]);
      if (updates.categorias.length > 0) {
        const catValues = updates.categorias.map((catId, idx) => [id, catId, idx === 0]);
        await db.query(
          'INSERT INTO productos_categorias (producto_id, categoria_id, es_principal) VALUES ?',
          [catValues]
        );
      }
    }

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto'
    });
  }
});

// Eliminar producto
router.delete('/:id', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.query('DELETE FROM productos WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto'
    });
  }
});

// Productos relacionados
router.get('/:id/relacionados', async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 4 } = req.query;

    // Obtener categorías del producto
    const [categorias] = await db.query(
      'SELECT categoria_id FROM productos_categorias WHERE producto_id = ?',
      [id]
    );

    if (categorias.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const catIds = categorias.map(c => c.categoria_id);

    const [productos] = await db.query(`
      SELECT DISTINCT
        p.id, p.nombre, p.slug, p.precio, p.precio_oferta,
        p.calificacion_promedio,
        (SELECT url FROM productos_imagenes WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) AS imagen
      FROM productos p
      JOIN productos_categorias pc ON p.id = pc.producto_id
      WHERE pc.categoria_id IN (?) AND p.id != ? AND p.disponible = TRUE
      ORDER BY RAND()
      LIMIT ?
    `, [catIds, id, parseInt(limite)]);

    res.json({
      success: true,
      data: productos
    });
  } catch (error) {
    console.error('Error obteniendo productos relacionados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos relacionados'
    });
  }
});

module.exports = router;
