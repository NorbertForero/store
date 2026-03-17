-- =====================================================
-- ECOMMERCE DATABASE SCHEMA
-- Base de datos para tienda online
-- Compatible con MySQL 8.0+ / MariaDB 10.5+
-- =====================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS tienda_online;
USE tienda_online;

-- =====================================================
-- TABLAS DE USUARIOS Y AUTENTICACIÓN
-- =====================================================

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    avatar_url VARCHAR(500),
    rol ENUM('cliente', 'admin', 'vendedor') DEFAULT 'cliente',
    activo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    token_verificacion VARCHAR(255),
    token_recuperacion VARCHAR(255),
    token_expiracion DATETIME,
    reset_token VARCHAR(64) NULL,
    reset_token_expiry DATETIME NULL,
    ultimo_acceso DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_usuarios_reset_token (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de direcciones de usuarios
CREATE TABLE direcciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    nombre_direccion VARCHAR(100),
    destinatario VARCHAR(200) NOT NULL,
    calle VARCHAR(255) NOT NULL,
    numero_exterior VARCHAR(20),
    numero_interior VARCHAR(20),
    colonia VARCHAR(100),
    ciudad VARCHAR(100) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    pais VARCHAR(100) DEFAULT 'México',
    telefono VARCHAR(20),
    instrucciones TEXT,
    es_principal BOOLEAN DEFAULT FALSE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de sesiones
CREATE TABLE sesiones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expira_en DATETIME NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE PRODUCTOS Y CATÁLOGO
-- =====================================================

-- Tabla de categorías
CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen_url VARCHAR(500),
    categoria_padre_id INT,
    orden INT DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_padre (categoria_padre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de marcas
CREATE TABLE marcas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    logo_url VARCHAR(500),
    sitio_web VARCHAR(255),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de productos
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    descripcion_corta VARCHAR(500),
    descripcion TEXT,
    marca_id INT,
    precio DECIMAL(10, 2) NOT NULL,
    precio_oferta DECIMAL(10, 2),
    costo DECIMAL(10, 2),
    impuesto_porcentaje DECIMAL(5, 2) DEFAULT 16.00,
    peso DECIMAL(10, 3),
    dimensiones_largo DECIMAL(10, 2),
    dimensiones_ancho DECIMAL(10, 2),
    dimensiones_alto DECIMAL(10, 2),
    stock INT DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    stock_maximo INT DEFAULT 1000,
    disponible BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    nuevo BOOLEAN DEFAULT TRUE,
    calificacion_promedio DECIMAL(3, 2) DEFAULT 0.00,
    total_resenas INT DEFAULT 0,
    total_vendidos INT DEFAULT 0,
    meta_titulo VARCHAR(255),
    meta_descripcion VARCHAR(500),
    meta_keywords VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL,
    INDEX idx_sku (sku),
    INDEX idx_slug (slug),
    INDEX idx_marca (marca_id),
    INDEX idx_precio (precio),
    INDEX idx_disponible (disponible),
    INDEX idx_destacado (destacado),
    FULLTEXT idx_busqueda (nombre, descripcion, descripcion_corta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación productos-categorías (muchos a muchos)
CREATE TABLE productos_categorias (
    producto_id INT NOT NULL,
    categoria_id INT NOT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (producto_id, categoria_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de imágenes de productos
CREATE TABLE productos_imagenes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    es_principal BOOLEAN DEFAULT FALSE,
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de atributos (talla, color, etc.)
CREATE TABLE atributos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('texto', 'color', 'numero', 'seleccion') DEFAULT 'texto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de valores de atributos
CREATE TABLE atributos_valores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    atributo_id INT NOT NULL,
    valor VARCHAR(100) NOT NULL,
    valor_color VARCHAR(7),
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (atributo_id) REFERENCES atributos(id) ON DELETE CASCADE,
    INDEX idx_atributo (atributo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de variantes de productos
CREATE TABLE productos_variantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255),
    precio DECIMAL(10, 2),
    precio_oferta DECIMAL(10, 2),
    stock INT DEFAULT 0,
    imagen_url VARCHAR(500),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    INDEX idx_producto (producto_id),
    INDEX idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de atributos de variantes
CREATE TABLE variantes_atributos (
    variante_id INT NOT NULL,
    atributo_valor_id INT NOT NULL,
    PRIMARY KEY (variante_id, atributo_valor_id),
    FOREIGN KEY (variante_id) REFERENCES productos_variantes(id) ON DELETE CASCADE,
    FOREIGN KEY (atributo_valor_id) REFERENCES atributos_valores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE CARRITO Y FAVORITOS
-- =====================================================

-- Tabla de carritos
CREATE TABLE carritos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    session_id VARCHAR(255),
    cupon_id INT,
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    impuestos DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de items del carrito
CREATE TABLE carritos_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    carrito_id INT NOT NULL,
    producto_id INT NOT NULL,
    variante_id INT,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES productos_variantes(id) ON DELETE SET NULL,
    INDEX idx_carrito (carrito_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de favoritos (lista de deseos)
CREATE TABLE favoritos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorito (usuario_id, producto_id),
    INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE PEDIDOS Y PAGOS
-- =====================================================

-- Tabla de cupones de descuento
CREATE TABLE cupones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    tipo ENUM('porcentaje', 'monto_fijo', 'envio_gratis') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    minimo_compra DECIMAL(10, 2) DEFAULT 0.00,
    maximo_descuento DECIMAL(10, 2),
    usos_maximos INT,
    usos_actuales INT DEFAULT 0,
    usos_por_usuario INT DEFAULT 1,
    fecha_inicio DATE,
    fecha_fin DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar foreign key del cupon al carrito
ALTER TABLE carritos ADD FOREIGN KEY (cupon_id) REFERENCES cupones(id) ON DELETE SET NULL;

-- Tabla de métodos de pago
CREATE TABLE metodos_pago (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    icono_url VARCHAR(500),
    comision_porcentaje DECIMAL(5, 2) DEFAULT 0.00,
    comision_fija DECIMAL(10, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    configuracion JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de métodos de envío
CREATE TABLE metodos_envio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    precio_gratis_desde DECIMAL(10, 2),
    tiempo_entrega_min INT,
    tiempo_entrega_max INT,
    activo BOOLEAN DEFAULT TRUE,
    orden INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pedidos
CREATE TABLE pedidos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE,
    usuario_id INT,
    estado ENUM('pendiente', 'pagado', 'procesando', 'enviado', 'entregado', 'cancelado', 'reembolsado') DEFAULT 'pendiente',
    
    -- Información del cliente
    cliente_email VARCHAR(255) NOT NULL,
    cliente_nombre VARCHAR(200) NOT NULL,
    cliente_telefono VARCHAR(20),
    
    -- Dirección de envío
    envio_direccion TEXT NOT NULL,
    envio_ciudad VARCHAR(100) NOT NULL,
    envio_estado VARCHAR(100) NOT NULL,
    envio_codigo_postal VARCHAR(10) NOT NULL,
    envio_pais VARCHAR(100) DEFAULT 'México',
    
    -- Dirección de facturación
    facturacion_direccion TEXT,
    facturacion_ciudad VARCHAR(100),
    facturacion_estado VARCHAR(100),
    facturacion_codigo_postal VARCHAR(10),
    facturacion_pais VARCHAR(100),
    
    -- Información de envío
    metodo_envio_id INT,
    envio_tracking VARCHAR(100),
    envio_empresa VARCHAR(100),
    costo_envio DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Información de pago
    metodo_pago_id INT,
    pago_referencia VARCHAR(255),
    pago_estado ENUM('pendiente', 'procesando', 'completado', 'fallido', 'reembolsado') DEFAULT 'pendiente',
    pago_fecha DATETIME,
    
    -- Totales
    subtotal DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    impuestos DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Cupón aplicado
    cupon_id INT,
    cupon_codigo VARCHAR(50),
    cupon_descuento DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Notas
    notas_cliente TEXT,
    notas_internas TEXT,
    
    -- Fechas
    fecha_envio DATETIME,
    fecha_entrega DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (metodo_envio_id) REFERENCES metodos_envio(id) ON DELETE SET NULL,
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE SET NULL,
    FOREIGN KEY (cupon_id) REFERENCES cupones(id) ON DELETE SET NULL,
    INDEX idx_numero (numero_pedido),
    INDEX idx_usuario (usuario_id),
    INDEX idx_estado (estado),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de items del pedido
CREATE TABLE pedidos_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    producto_id INT,
    variante_id INT,
    sku VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion_variante VARCHAR(255),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    impuesto DECIMAL(10, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
    FOREIGN KEY (variante_id) REFERENCES productos_variantes(id) ON DELETE SET NULL,
    INDEX idx_pedido (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de historial de estados del pedido
CREATE TABLE pedidos_historial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    comentario TEXT,
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_pedido (pedido_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de transacciones de pago
CREATE TABLE transacciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    metodo_pago_id INT,
    tipo ENUM('cargo', 'reembolso', 'retencion') NOT NULL,
    estado ENUM('pendiente', 'completado', 'fallido', 'cancelado') DEFAULT 'pendiente',
    monto DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'MXN',
    referencia_externa VARCHAR(255),
    datos_respuesta JSON,
    mensaje_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE SET NULL,
    INDEX idx_pedido (pedido_id),
    INDEX idx_referencia (referencia_externa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE INVENTARIO
-- =====================================================

-- Tabla de movimientos de inventario
CREATE TABLE inventario_movimientos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    variante_id INT,
    tipo ENUM('entrada', 'salida', 'ajuste', 'reserva', 'liberacion') NOT NULL,
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    referencia_tipo VARCHAR(50),
    referencia_id INT,
    motivo TEXT,
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES productos_variantes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_producto (producto_id),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de alertas de stock
CREATE TABLE alertas_stock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    variante_id INT,
    tipo ENUM('stock_bajo', 'sin_stock', 'sobrestock') NOT NULL,
    mensaje TEXT,
    leida BOOLEAN DEFAULT FALSE,
    resuelta BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (variante_id) REFERENCES productos_variantes(id) ON DELETE SET NULL,
    INDEX idx_producto (producto_id),
    INDEX idx_leida (leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE RESEÑAS Y VALORACIONES
-- =====================================================

-- Tabla de reseñas
CREATE TABLE resenas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    pedido_id INT,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    titulo VARCHAR(255),
    comentario TEXT,
    pros TEXT,
    contras TEXT,
    verificada BOOLEAN DEFAULT FALSE,
    aprobada BOOLEAN DEFAULT FALSE,
    util_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL,
    INDEX idx_producto (producto_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_calificacion (calificacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de votos de utilidad de reseñas
CREATE TABLE resenas_votos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resena_id INT NOT NULL,
    usuario_id INT NOT NULL,
    util BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resena_id) REFERENCES resenas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_voto (resena_id, usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS DE CONFIGURACIÓN
-- =====================================================

-- Tabla de configuración general
CREATE TABLE configuracion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    tipo ENUM('texto', 'numero', 'booleano', 'json') DEFAULT 'texto',
    descripcion VARCHAR(255),
    grupo VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clave (clave),
    INDEX idx_grupo (grupo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de banners/sliders
CREATE TABLE banners (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255),
    subtitulo VARCHAR(255),
    imagen_url VARCHAR(500) NOT NULL,
    imagen_movil_url VARCHAR(500),
    enlace VARCHAR(500),
    texto_boton VARCHAR(50),
    posicion ENUM('home_principal', 'home_secundario', 'categoria', 'promocion') DEFAULT 'home_principal',
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_posicion (posicion),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar métodos de pago
INSERT INTO metodos_pago (nombre, codigo, descripcion, comision_porcentaje, activo, orden) VALUES
('Tarjeta de Crédito/Débito', 'tarjeta', 'Pago seguro con tarjeta Visa, Mastercard o American Express', 3.50, TRUE, 1),
('PayPal', 'paypal', 'Paga de forma segura con tu cuenta de PayPal', 4.00, TRUE, 2),
('Transferencia Bancaria', 'transferencia', 'Realiza una transferencia desde tu banco', 0.00, TRUE, 3),
('Pago en Tienda', 'tienda', 'Paga en efectivo al recoger tu pedido', 0.00, TRUE, 4),
('Mercado Pago', 'mercadopago', 'Paga con Mercado Pago de forma segura', 3.99, TRUE, 5),
('Pago Contra Entrega', 'contraentrega', 'Paga en efectivo cuando recibas tu pedido', 2.00, TRUE, 6);

-- Insertar métodos de envío
INSERT INTO metodos_envio (nombre, codigo, descripcion, precio, precio_gratis_desde, tiempo_entrega_min, tiempo_entrega_max, activo, orden) VALUES
('Envío Estándar', 'estandar', 'Entrega en 5-7 días hábiles', 99.00, 999.00, 5, 7, TRUE, 1),
('Envío Express', 'express', 'Entrega en 2-3 días hábiles', 199.00, 1999.00, 2, 3, TRUE, 2),
('Envío al Día Siguiente', 'siguiente_dia', 'Entrega garantizada al día siguiente', 349.00, NULL, 1, 1, TRUE, 3),
('Recoger en Tienda', 'recoger', 'Recoge tu pedido en nuestra tienda sin costo', 0.00, NULL, 1, 2, TRUE, 4);

-- Insertar atributos comunes
INSERT INTO atributos (nombre, tipo) VALUES
('Color', 'color'),
('Talla', 'seleccion'),
('Material', 'texto'),
('Capacidad', 'seleccion');

-- Insertar valores de atributos
INSERT INTO atributos_valores (atributo_id, valor, valor_color, orden) VALUES
(1, 'Negro', '#000000', 1),
(1, 'Blanco', '#FFFFFF', 2),
(1, 'Rojo', '#FF0000', 3),
(1, 'Azul', '#0000FF', 4),
(1, 'Verde', '#00FF00', 5),
(1, 'Gris', '#808080', 6),
(2, 'XS', NULL, 1),
(2, 'S', NULL, 2),
(2, 'M', NULL, 3),
(2, 'L', NULL, 4),
(2, 'XL', NULL, 5),
(2, 'XXL', NULL, 6);

-- Insertar configuración inicial
INSERT INTO configuracion (clave, valor, tipo, descripcion, grupo) VALUES
('nombre_tienda', 'Mi Tienda Online', 'texto', 'Nombre de la tienda', 'general'),
('email_tienda', 'contacto@mitienda.com', 'texto', 'Email principal de contacto', 'general'),
('telefono_tienda', '+52 55 1234 5678', 'texto', 'Teléfono de contacto', 'general'),
('direccion_tienda', 'Calle Principal 123, Ciudad, País', 'texto', 'Dirección física de la tienda', 'general'),
('moneda', 'MXN', 'texto', 'Moneda predeterminada', 'general'),
('simbolo_moneda', '$', 'texto', 'Símbolo de la moneda', 'general'),
('impuesto_porcentaje', '16', 'numero', 'Porcentaje de IVA', 'impuestos'),
('envio_gratis_desde', '999', 'numero', 'Monto mínimo para envío gratis', 'envio'),
('max_items_carrito', '50', 'numero', 'Máximo de items en el carrito', 'carrito'),
('dias_devolucion', '30', 'numero', 'Días para devoluciones', 'politicas');

-- Insertar categorías de ejemplo
INSERT INTO categorias (nombre, slug, descripcion, activa) VALUES
('Electrónica', 'electronica', 'Dispositivos electrónicos y gadgets', TRUE),
('Ropa', 'ropa', 'Moda y vestimenta para todos', TRUE),
('Hogar', 'hogar', 'Artículos para el hogar y decoración', TRUE),
('Deportes', 'deportes', 'Equipamiento y ropa deportiva', TRUE),
('Libros', 'libros', 'Libros físicos y digitales', TRUE);

-- Insertar subcategorías
INSERT INTO categorias (nombre, slug, descripcion, categoria_padre_id, activa) VALUES
('Smartphones', 'smartphones', 'Teléfonos inteligentes', 1, TRUE),
('Laptops', 'laptops', 'Computadoras portátiles', 1, TRUE),
('Camisetas', 'camisetas', 'Camisetas para hombre y mujer', 2, TRUE),
('Pantalones', 'pantalones', 'Pantalones de todo tipo', 2, TRUE),
('Muebles', 'muebles', 'Muebles para el hogar', 3, TRUE);

-- Insertar marcas de ejemplo
INSERT INTO marcas (nombre, slug, descripcion, activa) VALUES
('TechPro', 'techpro', 'Tecnología de vanguardia', TRUE),
('FashionStyle', 'fashionstyle', 'Moda contemporánea', TRUE),
('HomeDecor', 'homedecor', 'Decoración del hogar', TRUE),
('SportMax', 'sportmax', 'Equipamiento deportivo profesional', TRUE);


-- Insertar usuario administrador de prueba
INSERT INTO tienda_online.usuarios
( email, password_hash, nombre, apellido, telefono, avatar_url, rol, activo, email_verificado, token_verificacion, token_recuperacion, token_expiracion, ultimo_acceso, created_at, updated_at, reset_token, reset_token_expiry)
VALUES( 'adminnf@nforero.com', '$2a$10$pO0LQ3G2vlWoP4L.Xp/aO.4TCr3yZy/aAh1vO0lYesYc6QzRgEZl2', 'Admin', 'Sistema', NULL, NULL, 'admin', 1, 1, NULL, NULL, NULL, NULL, '2026-03-17 11:57:20', '2026-03-17 11:57:20', NULL, NULL);

-- Insertar usuario cliente de prueba
INSERT INTO tienda_online.usuarios
(email, password_hash, nombre, apellido, telefono, avatar_url, rol, activo, email_verificado, token_verificacion, token_recuperacion, token_expiracion, ultimo_acceso, created_at, updated_at, reset_token, reset_token_expiry)
VALUES('forero-98@hotmail.com', '$2a$10$pO0LQ3G2vlWoP4L.Xp/aO.4TCr3yZy/aAh1vO0lYesYc6QzRgEZl2', 'Norbert', 'Forero', '3108854472', NULL, 'cliente', 1, 0, NULL, NULL, NULL, NULL, '2026-03-17 12:01:57', '2026-03-17 12:01:57', NULL, NULL);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de productos con información completa
CREATE VIEW vista_productos AS
SELECT 
    p.*,
    m.nombre AS marca_nombre,
    m.slug AS marca_slug,
    GROUP_CONCAT(DISTINCT c.nombre) AS categorias,
    (SELECT url FROM productos_imagenes WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) AS imagen_principal
FROM productos p
LEFT JOIN marcas m ON p.marca_id = m.id
LEFT JOIN productos_categorias pc ON p.id = pc.producto_id
LEFT JOIN categorias c ON pc.categoria_id = c.id
GROUP BY p.id;

-- Vista de pedidos con información resumida
CREATE VIEW vista_pedidos AS
SELECT 
    p.*,
    u.nombre AS usuario_nombre,
    u.apellido AS usuario_apellido,
    mp.nombre AS metodo_pago_nombre,
    me.nombre AS metodo_envio_nombre,
    (SELECT COUNT(*) FROM pedidos_items WHERE pedido_id = p.id) AS total_items
FROM pedidos p
LEFT JOIN usuarios u ON p.usuario_id = u.id
LEFT JOIN metodos_pago mp ON p.metodo_pago_id = mp.id
LEFT JOIN metodos_envio me ON p.metodo_envio_id = me.id;

-- Vista de stock bajo
CREATE VIEW vista_stock_bajo AS
SELECT 
    p.id,
    p.sku,
    p.nombre,
    p.stock,
    p.stock_minimo,
    m.nombre AS marca
FROM productos p
LEFT JOIN marcas m ON p.marca_id = m.id
WHERE p.stock <= p.stock_minimo AND p.disponible = TRUE;

-- =====================================================
-- TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger para actualizar stock después de un pedido
CREATE TRIGGER after_pedido_item_insert
AFTER INSERT ON pedidos_items
FOR EACH ROW
BEGIN
    UPDATE productos 
    SET stock = stock - NEW.cantidad,
        total_vendidos = total_vendidos + NEW.cantidad
    WHERE id = NEW.producto_id;
    
    IF NEW.variante_id IS NOT NULL THEN
        UPDATE productos_variantes 
        SET stock = stock - NEW.cantidad
        WHERE id = NEW.variante_id;
    END IF;
END//

-- Trigger para crear alerta de stock bajo
CREATE TRIGGER after_producto_stock_update
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    IF NEW.stock <= NEW.stock_minimo AND OLD.stock > OLD.stock_minimo THEN
        INSERT INTO alertas_stock (producto_id, tipo, mensaje)
        VALUES (NEW.id, 'stock_bajo', CONCAT('El producto "', NEW.nombre, '" tiene stock bajo (', NEW.stock, ' unidades)'));
    END IF;
    
    IF NEW.stock = 0 AND OLD.stock > 0 THEN
        INSERT INTO alertas_stock (producto_id, tipo, mensaje)
        VALUES (NEW.id, 'sin_stock', CONCAT('El producto "', NEW.nombre, '" se ha agotado'));
    END IF;
END//

-- Trigger para registrar movimientos de inventario
CREATE TRIGGER after_producto_stock_change
AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
    IF NEW.stock != OLD.stock THEN
        INSERT INTO inventario_movimientos 
            (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
        VALUES 
            (NEW.id, 
             IF(NEW.stock > OLD.stock, 'entrada', 'salida'),
             ABS(NEW.stock - OLD.stock),
             OLD.stock,
             NEW.stock,
             'Actualización directa de stock');
    END IF;
END//

-- Trigger para actualizar calificación promedio del producto
CREATE TRIGGER after_resena_insert
AFTER INSERT ON resenas
FOR EACH ROW
BEGIN
    UPDATE productos 
    SET calificacion_promedio = (
        SELECT AVG(calificacion) 
        FROM resenas 
        WHERE producto_id = NEW.producto_id AND aprobada = TRUE
    ),
    total_resenas = (
        SELECT COUNT(*) 
        FROM resenas 
        WHERE producto_id = NEW.producto_id AND aprobada = TRUE
    )
    WHERE id = NEW.producto_id;
END//

-- Trigger para generar número de pedido
CREATE TRIGGER before_pedido_insert
BEFORE INSERT ON pedidos
FOR EACH ROW
BEGIN
    SET NEW.numero_pedido = CONCAT('ORD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 100000), 5, '0'));
END//

DELIMITER ;

-- =====================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- =====================================================

CREATE INDEX idx_pedidos_fecha_estado ON pedidos(created_at, estado);
CREATE INDEX idx_productos_precio_stock ON productos(precio, stock, disponible);
CREATE INDEX idx_resenas_producto_calificacion ON resenas(producto_id, calificacion, aprobada);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
