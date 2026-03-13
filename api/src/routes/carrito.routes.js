const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { auth, optionalAuth } = require('../middleware/auth.middleware');

// Obtener o crear carrito
const getOrCreateCart = async (userId, sessionId) => {
  let carrito;

  if (userId) {
    // Usuario autenticado
    const [carritos] = await db.query(
      'SELECT * FROM carritos WHERE usuario_id = ?',
      [userId]
    );
    
    if (carritos.length > 0) {
      carrito = carritos[0];
    } else {
      const [result] = await db.query(
        'INSERT INTO carritos (usuario_id) VALUES (?)',
        [userId]
      );
      carrito = { id: result.insertId, usuario_id: userId };
    }
  } else {
    // Usuario anónimo
    const [carritos] = await db.query(
      'SELECT * FROM carritos WHERE session_id = ?',
      [sessionId]
    );
    
    if (carritos.length > 0) {
      carrito = carritos[0];
    } else {
      const [result] = await db.query(
        'INSERT INTO carritos (session_id) VALUES (?)',
        [sessionId]
      );
      carrito = { id: result.insertId, session_id: sessionId };
    }
  }

  return carrito;
};

// Calcular totales del carrito
const calcularTotales = async (carritoId) => {
  const [items] = await db.query(
    'SELECT SUM(subtotal) AS subtotal FROM carritos_items WHERE carrito_id = ?',
    [carritoId]
  );

  const subtotal = items[0].subtotal || 0;
  
  // Obtener cupón si existe
  const [carritos] = await db.query(
    'SELECT cupon_id FROM carritos WHERE id = ?',
    [carritoId]
  );

  let descuento = 0;
  if (carritos[0]?.cupon_id) {
    const [cupones] = await db.query(
      'SELECT * FROM cupones WHERE id = ? AND activo = TRUE',
      [carritos[0].cupon_id]
    );
    
    if (cupones.length > 0) {
      const cupon = cupones[0];
      if (cupon.tipo === 'porcentaje') {
        descuento = subtotal * (cupon.valor / 100);
        if (cupon.maximo_descuento && descuento > cupon.maximo_descuento) {
          descuento = cupon.maximo_descuento;
        }
      } else if (cupon.tipo === 'monto_fijo') {
        descuento = cupon.valor;
      }
    }
  }

  const impuestos = (subtotal - descuento) * 0.16; // 16% IVA
  const total = subtotal - descuento + impuestos;

  await db.query(
    'UPDATE carritos SET subtotal = ?, descuento = ?, impuestos = ?, total = ? WHERE id = ?',
    [subtotal, descuento, impuestos, total, carritoId]
  );

  return { subtotal, descuento, impuestos, total };
};

// Obtener carrito actual
router.get('/', optionalAuth, async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] || uuidv4();
    const carrito = await getOrCreateCart(req.user?.id, sessionId);

    // Obtener items del carrito
    const [items] = await db.query(`
      SELECT 
        ci.id, ci.cantidad, ci.precio_unitario, ci.subtotal,
        p.id AS producto_id, p.nombre, p.slug, p.precio, p.precio_oferta, p.stock,
        pv.id AS variante_id, pv.nombre AS variante_nombre,
        (SELECT url FROM productos_imagenes WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) AS imagen
      FROM carritos_items ci
      JOIN productos p ON ci.producto_id = p.id
      LEFT JOIN productos_variantes pv ON ci.variante_id = pv.id
      WHERE ci.carrito_id = ?
    `, [carrito.id]);

    // Obtener totales actualizados
    const totales = await calcularTotales(carrito.id);

    // Obtener cupón aplicado
    let cuponAplicado = null;
    if (carrito.cupon_id) {
      const [cupones] = await db.query(
        'SELECT codigo, descripcion, tipo, valor FROM cupones WHERE id = ?',
        [carrito.cupon_id]
      );
      if (cupones.length > 0) {
        cuponAplicado = cupones[0];
      }
    }

    res.json({
      success: true,
      data: {
        id: carrito.id,
        items,
        ...totales,
        cupon: cuponAplicado,
        sessionId
      }
    });
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener carrito'
    });
  }
});

// Agregar item al carrito
router.post('/items', optionalAuth, async (req, res) => {
  try {
    const { producto_id, variante_id, cantidad = 1 } = req.body;
    const sessionId = req.headers['x-session-id'] || uuidv4();

    // Verificar producto
    const [productos] = await db.query(
      'SELECT id, precio, precio_oferta, stock FROM productos WHERE id = ? AND disponible = TRUE',
      [producto_id]
    );

    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o no disponible'
      });
    }

    const producto = productos[0];
    const precioUnitario = producto.precio_oferta || producto.precio;

    // Verificar stock
    if (producto.stock < cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }

    const carrito = await getOrCreateCart(req.user?.id, sessionId);

    // Verificar si ya existe el item
    const [existingItems] = await db.query(
      'SELECT id, cantidad FROM carritos_items WHERE carrito_id = ? AND producto_id = ? AND (variante_id = ? OR (variante_id IS NULL AND ? IS NULL))',
      [carrito.id, producto_id, variante_id, variante_id]
    );

    if (existingItems.length > 0) {
      // Actualizar cantidad
      const nuevaCantidad = existingItems[0].cantidad + cantidad;
      await db.query(
        'UPDATE carritos_items SET cantidad = ?, subtotal = ? WHERE id = ?',
        [nuevaCantidad, nuevaCantidad * precioUnitario, existingItems[0].id]
      );
    } else {
      // Insertar nuevo item
      await db.query(`
        INSERT INTO carritos_items (carrito_id, producto_id, variante_id, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [carrito.id, producto_id, variante_id || null, cantidad, precioUnitario, cantidad * precioUnitario]);
    }

    // Recalcular totales
    await calcularTotales(carrito.id);

    res.json({
      success: true,
      message: 'Producto agregado al carrito',
      data: { sessionId }
    });
  } catch (error) {
    console.error('Error agregando al carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar al carrito'
    });
  }
});

// Actualizar cantidad de item
router.put('/items/:itemId', optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { cantidad } = req.body;
    const sessionId = req.headers['x-session-id'];

    if (!cantidad || cantidad < 1) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad inválida'
      });
    }

    const carrito = await getOrCreateCart(req.user?.id, sessionId);

    // Verificar que el item pertenece al carrito
    const [items] = await db.query(
      'SELECT ci.*, p.stock FROM carritos_items ci JOIN productos p ON ci.producto_id = p.id WHERE ci.id = ? AND ci.carrito_id = ?',
      [itemId, carrito.id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado'
      });
    }

    if (items[0].stock < cantidad) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente'
      });
    }

    await db.query(
      'UPDATE carritos_items SET cantidad = ?, subtotal = cantidad * precio_unitario WHERE id = ?',
      [cantidad, itemId]
    );

    await calcularTotales(carrito.id);

    res.json({
      success: true,
      message: 'Cantidad actualizada'
    });
  } catch (error) {
    console.error('Error actualizando item:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar item'
    });
  }
});

// Eliminar item del carrito
router.delete('/items/:itemId', optionalAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const sessionId = req.headers['x-session-id'];

    const carrito = await getOrCreateCart(req.user?.id, sessionId);

    await db.query(
      'DELETE FROM carritos_items WHERE id = ? AND carrito_id = ?',
      [itemId, carrito.id]
    );

    await calcularTotales(carrito.id);

    res.json({
      success: true,
      message: 'Item eliminado del carrito'
    });
  } catch (error) {
    console.error('Error eliminando item:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar item'
    });
  }
});

// Vaciar carrito
router.delete('/', optionalAuth, async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const carrito = await getOrCreateCart(req.user?.id, sessionId);

    await db.query('DELETE FROM carritos_items WHERE carrito_id = ?', [carrito.id]);
    await db.query('UPDATE carritos SET cupon_id = NULL, subtotal = 0, descuento = 0, impuestos = 0, total = 0 WHERE id = ?', [carrito.id]);

    res.json({
      success: true,
      message: 'Carrito vaciado'
    });
  } catch (error) {
    console.error('Error vaciando carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vaciar carrito'
    });
  }
});

// Aplicar cupón
router.post('/cupon', optionalAuth, async (req, res) => {
  try {
    const { codigo } = req.body;
    const sessionId = req.headers['x-session-id'];

    const [cupones] = await db.query(`
      SELECT * FROM cupones 
      WHERE codigo = ? 
        AND activo = TRUE 
        AND (fecha_inicio IS NULL OR fecha_inicio <= NOW())
        AND (fecha_fin IS NULL OR fecha_fin >= NOW())
        AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
    `, [codigo.toUpperCase()]);

    if (cupones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cupón no válido o expirado'
      });
    }

    const cupon = cupones[0];
    const carrito = await getOrCreateCart(req.user?.id, sessionId);

    // Verificar mínimo de compra
    const [carritoData] = await db.query('SELECT subtotal FROM carritos WHERE id = ?', [carrito.id]);
    if (carritoData[0].subtotal < cupon.minimo_compra) {
      return res.status(400).json({
        success: false,
        message: `El mínimo de compra para este cupón es $${cupon.minimo_compra}`
      });
    }

    await db.query('UPDATE carritos SET cupon_id = ? WHERE id = ?', [cupon.id, carrito.id]);
    await calcularTotales(carrito.id);

    res.json({
      success: true,
      message: 'Cupón aplicado exitosamente',
      data: {
        codigo: cupon.codigo,
        descripcion: cupon.descripcion,
        tipo: cupon.tipo,
        valor: cupon.valor
      }
    });
  } catch (error) {
    console.error('Error aplicando cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aplicar cupón'
    });
  }
});

// Quitar cupón
router.delete('/cupon', optionalAuth, async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const carrito = await getOrCreateCart(req.user?.id, sessionId);

    await db.query('UPDATE carritos SET cupon_id = NULL WHERE id = ?', [carrito.id]);
    await calcularTotales(carrito.id);

    res.json({
      success: true,
      message: 'Cupón removido'
    });
  } catch (error) {
    console.error('Error quitando cupón:', error);
    res.status(500).json({
      success: false,
      message: 'Error al quitar cupón'
    });
  }
});

module.exports = router;
