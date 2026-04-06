const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, isAdminOrVendedor } = require('../middleware/auth.middleware');

// Obtener pedidos del usuario
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE p.usuario_id = ?';
    const params = [req.user.id];

    if (status) {
      whereClause += ' AND p.estado = ?';
      params.push(status);
    }

    const [pedidos] = await db.query(`
      SELECT 
        p.id, p.numero_pedido, p.estado, p.pago_estado,
        p.subtotal, p.descuento, p.costo_envio, p.total,
        p.created_at,
        me.nombre AS metodo_envio,
        mp.nombre AS metodo_pago,
        (SELECT COUNT(*) FROM pedidos_items WHERE pedido_id = p.id) AS total_items
      FROM pedidos p
      LEFT JOIN metodos_envio me ON p.metodo_envio_id = me.id
      LEFT JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM pedidos p ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        orders: pedidos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos'
    });
  }
});

// Obtener detalle de un pedido
router.get('/:numeroPedido', auth, async (req, res) => {
  try {
    const { numeroPedido } = req.params;

    const [pedidos] = await db.query(`
      SELECT p.*, 
        me.nombre AS metodo_envio_nombre,
        me.descripcion AS metodo_envio_descripcion,
        mp.nombre AS metodo_pago_nombre,
        mp.descripcion AS metodo_pago_descripcion,
        u.nombre AS cliente_nombre,
        u.apellido AS cliente_apellido,
        u.email AS cliente_email,
        u.telefono AS cliente_telefono
      FROM pedidos p
      LEFT JOIN metodos_envio me ON p.metodo_envio_id = me.id
      LEFT JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.numero_pedido = ? AND (p.usuario_id = ? OR ? IN ('admin', 'vendedor'))
    `, [numeroPedido, req.user.id, req.user.rol]);

    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const pedido = pedidos[0];

    // Obtener items del pedido
    const [items] = await db.query(`
      SELECT pi.*, 
        pr.slug,
        pr.nombre AS producto_nombre,
        (SELECT url FROM productos_imagenes WHERE producto_id = pi.producto_id AND es_principal = 1 LIMIT 1) AS imagen_url
      FROM pedidos_items pi
      LEFT JOIN productos pr ON pi.producto_id = pr.id
      WHERE pi.pedido_id = ?
    `, [pedido.id]);

    // Obtener historial de estados
    const [historial] = await db.query(`
      SELECT ph.*, u.nombre AS usuario_nombre
      FROM pedidos_historial ph
      LEFT JOIN usuarios u ON ph.usuario_id = u.id
      WHERE ph.pedido_id = ?
      ORDER BY ph.created_at DESC
    `, [pedido.id]);

    // Estructurar respuesta con objetos anidados para el frontend
    const response = {
      id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      estado: pedido.estado,
      estado_pago: pedido.pago_estado,
      fecha_pedido: pedido.created_at,
      subtotal: pedido.subtotal,
      descuento: pedido.descuento,
      impuestos: pedido.impuestos,
      costo_envio: pedido.costo_envio,
      total: pedido.total,
      notas_cliente: pedido.notas_cliente,
      numero_guia: pedido.envio_tracking,
      // Cliente
      cliente_nombre: `${pedido.cliente_nombre || ''} ${pedido.cliente_apellido || ''}`.trim(),
      cliente_email: pedido.cliente_email,
      cliente_telefono: pedido.cliente_telefono,
      // Dirección de envío estructurada
      direccion_envio: {
        nombre: pedido.cliente_nombre,
        apellidos: pedido.cliente_apellido,
        direccion: pedido.envio_direccion,
        ciudad: pedido.envio_ciudad,
        estado: pedido.envio_estado,
        codigo_postal: pedido.envio_codigo_postal,
        pais: pedido.envio_pais,
        telefono: pedido.cliente_telefono
      },
      // Método de envío estructurado
      metodo_envio: {
        id: pedido.metodo_envio_id,
        nombre: pedido.metodo_envio_nombre,
        descripcion: pedido.metodo_envio_descripcion
      },
      // Método de pago estructurado
      metodo_pago: {
        id: pedido.metodo_pago_id,
        nombre: pedido.metodo_pago_nombre,
        descripcion: pedido.metodo_pago_descripcion
      },
      items,
      historial
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido'
    });
  }
});

// Crear pedido desde el carrito
router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      direccion_envio,
      metodo_envio_id,
      metodo_pago_id,
      notas_cliente,
      notas // Aceptar ambos nombres
    } = req.body;
    
    // Construir dirección completa desde componentes
    const direccionCompleta = [
      direccion_envio.direccion || direccion_envio.calle,
      direccion_envio.numero_exterior ? `#${direccion_envio.numero_exterior}` : '',
      direccion_envio.numero_interior ? `Int. ${direccion_envio.numero_interior}` : '',
      direccion_envio.colonia ? `Col. ${direccion_envio.colonia}` : '',
      direccion_envio.referencias || ''
    ].filter(Boolean).join(', ');

    // Obtener carrito del usuario
    const [carritos] = await connection.query(
      'SELECT * FROM carritos WHERE usuario_id = ?',
      [req.user.id]
    );

    if (carritos.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'No hay carrito activo'
      });
    }

    const carrito = carritos[0];

    // Obtener items del carrito
    const [items] = await connection.query(`
      SELECT ci.*, p.nombre, p.sku, p.stock
      FROM carritos_items ci
      JOIN productos p ON ci.producto_id = p.id
      WHERE ci.carrito_id = ?
    `, [carrito.id]);

    if (items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    // Verificar stock
    for (const item of items) {
      if (item.stock < item.cantidad) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${item.nombre}`
        });
      }
    }

    // Obtener método de envío
    const [metodosEnvio] = await connection.query(
      'SELECT * FROM metodos_envio WHERE id = ?',
      [metodo_envio_id]
    );

    const metodoEnvio = metodosEnvio[0];
    let costoEnvio = parseFloat(metodoEnvio?.precio) || 0;

    // Convertir valores del carrito a números
    const carritoSubtotal = parseFloat(carrito.subtotal) || 0;
    const carritoDescuento = parseFloat(carrito.descuento) || 0;
    const carritoImpuestos = parseFloat(carrito.impuestos) || 0;
    const carritoTotal = parseFloat(carrito.total) || 0;

    // Envío gratis si aplica
    if (metodoEnvio?.precio_gratis_desde && carritoSubtotal >= parseFloat(metodoEnvio.precio_gratis_desde)) {
      costoEnvio = 0;
    }

    const total = carritoTotal + costoEnvio;

    // Crear pedido
    const [pedidoResult] = await connection.query(`
      INSERT INTO pedidos (
        usuario_id, cliente_email, cliente_nombre, cliente_telefono,
        envio_direccion, envio_ciudad, envio_estado, envio_codigo_postal, envio_pais,
        metodo_envio_id, costo_envio, metodo_pago_id,
        subtotal, descuento, impuestos, total,
        cupon_id, cupon_codigo, cupon_descuento,
        notas_cliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, req.user.email, `${req.user.nombre} ${req.user.apellido}`, direccion_envio.telefono,
      direccionCompleta, direccion_envio.ciudad, direccion_envio.estado, direccion_envio.codigo_postal, direccion_envio.pais || 'Colombia',
      metodo_envio_id, costoEnvio, metodo_pago_id,
      carritoSubtotal, carritoDescuento, carritoImpuestos, total,
      carrito.cupon_id, null, carritoDescuento,
      notas || notas_cliente || null
    ]);

    const pedidoId = pedidoResult.insertId;

    // Obtener número de pedido generado
    const [pedidoData] = await connection.query(
      'SELECT numero_pedido FROM pedidos WHERE id = ?',
      [pedidoId]
    );

    // Insertar items del pedido
    for (const item of items) {
      const itemPrecio = parseFloat(item.precio_unitario) || 0;
      const itemSubtotal = parseFloat(item.subtotal) || 0;
      await connection.query(`
        INSERT INTO pedidos_items (pedido_id, producto_id, variante_id, sku, nombre, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [pedidoId, item.producto_id, item.variante_id, item.sku, item.nombre, item.cantidad, itemPrecio, itemSubtotal]);
    }

    // Registrar en historial
    await connection.query(
      'INSERT INTO pedidos_historial (pedido_id, estado_nuevo, comentario) VALUES (?, ?, ?)',
      [pedidoId, 'pendiente', 'Pedido creado']
    );

    // Vaciar carrito
    await connection.query('DELETE FROM carritos_items WHERE carrito_id = ?', [carrito.id]);
    await connection.query('UPDATE carritos SET cupon_id = NULL, subtotal = 0, descuento = 0, impuestos = 0, total = 0 WHERE id = ?', [carrito.id]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: {
        pedido_id: pedidoId,
        numero_pedido: pedidoData[0].numero_pedido,
        total
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido'
    });
  } finally {
    connection.release();
  }
});

// Cancelar pedido
router.post('/:numeroPedido/cancelar', auth, async (req, res) => {
  try {
    const { numeroPedido } = req.params;
    const { motivo } = req.body;

    const [pedidos] = await db.query(
      'SELECT * FROM pedidos WHERE numero_pedido = ? AND usuario_id = ?',
      [numeroPedido, req.user.id]
    );

    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const pedido = pedidos[0];

    if (!['pendiente', 'pagado'].includes(pedido.estado)) {
      return res.status(400).json({
        success: false,
        message: 'Este pedido no puede ser cancelado'
      });
    }

    await db.query(
      'UPDATE pedidos SET estado = ? WHERE id = ?',
      ['cancelado', pedido.id]
    );

    await db.query(
      'INSERT INTO pedidos_historial (pedido_id, estado_anterior, estado_nuevo, comentario, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [pedido.id, pedido.estado, 'cancelado', motivo || 'Cancelado por el usuario', req.user.id]
    );

    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente'
    });
  } catch (error) {
    console.error('Error cancelando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pedido'
    });
  }
});

// === RUTAS DE ADMINISTRACIÓN ===

// Obtener todos los pedidos (admin)
router.get('/admin/todos', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    const params = [];

    if (status) {
      whereConditions.push('p.estado = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(p.numero_pedido LIKE ? OR p.cliente_nombre LIKE ? OR p.cliente_email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    const [pedidos] = await db.query(`
      SELECT 
        p.id, p.numero_pedido, p.estado, p.pago_estado,
        p.cliente_nombre, p.cliente_email,
        p.total, p.created_at,
        me.nombre AS metodo_envio,
        (SELECT COUNT(*) FROM pedidos_items WHERE pedido_id = p.id) AS total_items
      FROM pedidos p
      LEFT JOIN metodos_envio me ON p.metodo_envio_id = me.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [countResult] = await db.query(
      `SELECT COUNT(*) AS total FROM pedidos p ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        orders: pedidos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos'
    });
  }
});

// Actualizar estado del pedido (admin)
router.put('/admin/:id/estado', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, comentario, tracking, empresa_envio } = req.body;

    const estadosValidos = ['pendiente', 'pagado', 'procesando', 'enviado', 'entregado', 'cancelado', 'reembolsado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const [pedidos] = await db.query('SELECT estado FROM pedidos WHERE id = ?', [id]);
    if (pedidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    const estadoAnterior = pedidos[0].estado;

    const updates = ['estado = ?'];
    const values = [estado];

    if (estado === 'enviado') {
      if (tracking) {
        updates.push('envio_tracking = ?');
        values.push(tracking);
      }
      if (empresa_envio) {
        updates.push('envio_empresa = ?');
        values.push(empresa_envio);
      }
      updates.push('fecha_envio = NOW()');
    }

    if (estado === 'entregado') {
      updates.push('fecha_entrega = NOW()');
    }

    values.push(id);

    await db.query(`UPDATE pedidos SET ${updates.join(', ')} WHERE id = ?`, values);

    await db.query(
      'INSERT INTO pedidos_historial (pedido_id, estado_anterior, estado_nuevo, comentario, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [id, estadoAnterior, estado, comentario, req.user.id]
    );

    res.json({
      success: true,
      message: 'Estado del pedido actualizado'
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado'
    });
  }
});

// Obtener métodos de envío
router.get('/metodos/envio', async (req, res) => {
  try {
    const [metodos] = await db.query(
      'SELECT * FROM metodos_envio WHERE activo = TRUE ORDER BY orden'
    );
    res.json({ success: true, data: metodos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener métodos de envío' });
  }
});

// Obtener todos los métodos de envío (admin - incluye inactivos)
router.get('/metodos/envio/admin', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const [metodos] = await db.query(
      'SELECT * FROM metodos_envio ORDER BY orden'
    );
    res.json({ success: true, data: metodos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener métodos de envío' });
  }
});

// Actualizar método de envío (admin)
router.patch('/metodos/envio/:id', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['nombre', 'descripcion', 'precio', 'precio_gratis_desde', 'tiempo_entrega_min', 'tiempo_entrega_max', 'activo'];
    const setClause = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        setClause.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    values.push(id);
    await db.query(`UPDATE metodos_envio SET ${setClause.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, message: 'Método de envío actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar método de envío' });
  }
});

// Obtener métodos de pago
router.get('/metodos/pago', async (req, res) => {
  try {
    const [metodos] = await db.query(
      'SELECT * FROM metodos_pago WHERE activo = TRUE ORDER BY orden'
    );
    res.json({ success: true, data: metodos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener métodos de pago' });
  }
});

// Obtener todos los métodos de pago (admin - incluye inactivos)
router.get('/metodos/pago/admin', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const [metodos] = await db.query(
      'SELECT * FROM metodos_pago ORDER BY orden'
    );
    res.json({ success: true, data: metodos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener métodos de pago' });
  }
});

// Actualizar estado de método de pago (admin)
router.patch('/metodos/pago/:id', auth, isAdminOrVendedor, async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    await db.query('UPDATE metodos_pago SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);

    res.json({ success: true, message: 'Método de pago actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar método de pago' });
  }
});

module.exports = router;
