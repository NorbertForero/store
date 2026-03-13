const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, isAdminOrVendedor } = require('../middleware/auth.middleware');

// Obtener lista de productos para inventario
router.get('/', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, lowStock, category } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = ['p.disponible = TRUE'];
    const params = [];

    if (search) {
      whereConditions.push('(p.nombre LIKE ? OR p.sku LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (lowStock === 'true') {
      whereConditions.push('p.stock <= p.stock_minimo');
    }

    if (category) {
      whereConditions.push('c.slug = ?');
      params.push(category);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const [productos] = await db.query(`
      SELECT 
        p.id, p.sku, p.nombre, p.stock, p.stock_minimo, p.costo, p.precio,
        c.nombre AS categoria_nombre,
        (SELECT url FROM productos_imagenes WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) AS imagen
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      ${whereClause}
      ORDER BY p.nombre ASC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        products: productos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener inventario'
    });
  }
});

// Obtener resumen del inventario
router.get('/resumen', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const [resumen] = await db.query(`
      SELECT 
        COUNT(*) AS total_productos,
        SUM(stock) AS total_unidades,
        SUM(CASE WHEN stock <= stock_minimo THEN 1 ELSE 0 END) AS productos_stock_bajo,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS productos_agotados,
        SUM(stock * costo) AS valor_inventario
      FROM productos
      WHERE disponible = TRUE
    `);

    const [alertasPendientes] = await db.query(
      'SELECT COUNT(*) AS total FROM alertas_stock WHERE resuelta = FALSE'
    );

    res.json({
      success: true,
      data: {
        ...resumen[0],
        alertas_pendientes: alertasPendientes[0].total
      }
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de inventario'
    });
  }
});

// Obtener productos con stock bajo
router.get('/stock-bajo', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const [productos] = await db.query(`
      SELECT 
        p.id, p.sku, p.nombre, p.stock, p.stock_minimo,
        m.nombre AS marca,
        (SELECT url FROM productos_imagenes WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) AS imagen
      FROM productos p
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.stock <= p.stock_minimo AND p.disponible = TRUE
      ORDER BY p.stock ASC
    `);

    res.json({
      success: true,
      data: productos
    });
  } catch (error) {
    console.error('Error obteniendo stock bajo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos con stock bajo'
    });
  }
});

// Obtener movimientos de inventario
router.get('/movimientos', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { page = 1, limit = 50, producto_id, type, from, to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    const params = [];

    if (producto_id) {
      whereConditions.push('im.producto_id = ?');
      params.push(producto_id);
    }

    if (type) {
      whereConditions.push('im.tipo = ?');
      params.push(type);
    }

    if (from) {
      whereConditions.push('im.created_at >= ?');
      params.push(from);
    }

    if (to) {
      whereConditions.push('im.created_at <= ?');
      params.push(to);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const [movimientos] = await db.query(`
      SELECT 
        im.*,
        p.nombre AS producto_nombre, p.sku,
        u.nombre AS usuario_nombre
      FROM inventario_movimientos im
      JOIN productos p ON im.producto_id = p.id
      LEFT JOIN usuarios u ON im.usuario_id = u.id
      ${whereClause}
      ORDER BY im.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM inventario_movimientos im ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        movements: movimientos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos de inventario'
    });
  }
});

// Ajustar stock de un producto
router.post('/ajustar/:productoId', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { productoId } = req.params;
    const { cantidad, tipo, motivo } = req.body;

    // Validar tipo
    const tiposValidos = ['entrada', 'salida', 'ajuste'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de movimiento no válido'
      });
    }

    // Obtener producto
    const [productos] = await db.query(
      'SELECT id, stock FROM productos WHERE id = ?',
      [productoId]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const producto = productos[0];
    let nuevoStock;

    if (tipo === 'entrada') {
      nuevoStock = producto.stock + cantidad;
    } else if (tipo === 'salida') {
      nuevoStock = producto.stock - cantidad;
      if (nuevoStock < 0) {
        return res.status(400).json({
          success: false,
          message: 'No hay suficiente stock para esta salida'
        });
      }
    } else {
      nuevoStock = cantidad; // Ajuste directo
    }

    // Registrar movimiento
    await db.query(`
      INSERT INTO inventario_movimientos 
        (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [productoId, tipo, Math.abs(nuevoStock - producto.stock), producto.stock, nuevoStock, motivo, req.user.id]);

    // Actualizar stock
    await db.query(
      'UPDATE productos SET stock = ? WHERE id = ?',
      [nuevoStock, productoId]
    );

    res.json({
      success: true,
      message: 'Stock ajustado exitosamente',
      data: {
        stock_anterior: producto.stock,
        stock_nuevo: nuevoStock
      }
    });
  } catch (error) {
    console.error('Error ajustando stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ajustar stock'
    });
  }
});

// Obtener alertas de stock
router.get('/alertas', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { resuelta = 'false' } = req.query;

    const [alertas] = await db.query(`
      SELECT 
        a.*,
        p.nombre AS producto_nombre, p.sku, p.stock,
        (SELECT url FROM productos_imagenes WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) AS imagen
      FROM alertas_stock a
      JOIN productos p ON a.producto_id = p.id
      WHERE a.resuelta = ?
      ORDER BY a.created_at DESC
    `, [resuelta === 'true']);

    res.json({
      success: true,
      data: alertas
    });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas'
    });
  }
});

// Marcar alerta como resuelta
router.put('/alertas/:id/resolver', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE alertas_stock SET resuelta = TRUE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Alerta marcada como resuelta'
    });
  } catch (error) {
    console.error('Error resolviendo alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al resolver alerta'
    });
  }
});

// Marcar alerta como leída
router.put('/alertas/:id/leer', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE alertas_stock SET leida = TRUE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Alerta marcada como leída'
    });
  } catch (error) {
    console.error('Error marcando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar alerta'
    });
  }
});

// Exportar inventario (CSV simple)
router.get('/exportar', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const [productos] = await db.query(`
      SELECT 
        p.sku, p.nombre, p.stock, p.stock_minimo, p.stock_maximo,
        p.precio, p.costo, p.disponible,
        m.nombre AS marca,
        GROUP_CONCAT(c.nombre) AS categorias
      FROM productos p
      LEFT JOIN marcas m ON p.marca_id = m.id
      LEFT JOIN productos_categorias pc ON p.id = pc.producto_id
      LEFT JOIN categorias c ON pc.categoria_id = c.id
      GROUP BY p.id
      ORDER BY p.nombre
    `);

    // Generar CSV
    const headers = ['SKU', 'Nombre', 'Stock', 'Stock Mínimo', 'Stock Máximo', 'Precio', 'Costo', 'Disponible', 'Marca', 'Categorías'];
    let csv = headers.join(',') + '\n';

    productos.forEach(p => {
      csv += [
        `"${p.sku}"`,
        `"${p.nombre}"`,
        p.stock,
        p.stock_minimo,
        p.stock_maximo,
        p.precio,
        p.costo || 0,
        p.disponible ? 'Sí' : 'No',
        `"${p.marca || ''}"`,
        `"${p.categorias || ''}"`
      ].join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exportando inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar inventario'
    });
  }
});

module.exports = router;
