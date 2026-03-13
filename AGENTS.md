# Contexto del Proyecto para Agentes de IA

## Resumen del Proyecto

Sistema de e-commerce completo compuesto por tres módulos independientes que se comunican a través de una API REST.

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐
│  tiendaOnline   │     │   adminPanel    │
│  (Puerto 5173)  │     │  (Puerto 5174)  │
│   React + Vite  │     │  React + Vite   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │     API     │
              │ (Puerto 3001)│
              │ Node/Express │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │   MySQL     │
              │  ecommerce  │
              └─────────────┘
```

## Estructura de Directorios

```
store/
├── api/                          # Backend REST API
│   ├── src/
│   │   ├── index.js              # Entry point, Express app
│   │   ├── config/
│   │   │   └── database.js       # Pool de conexión MySQL
│   │   ├── middleware/
│   │   │   └── auth.middleware.js # JWT auth, roles
│   │   └── routes/
│   │       ├── auth.routes.js    # POST /login, /register
│   │       ├── productos.routes.js
│   │       ├── categorias.routes.js
│   │       ├── carrito.routes.js
│   │       ├── favoritos.routes.js
│   │       ├── pedidos.routes.js
│   │       ├── usuarios.routes.js
│   │       ├── inventario.routes.js
│   │       └── configuracion.routes.js
│   ├── package.json
│   └── .env.example
│
├── tiendaOnline/                 # Frontend cliente
│   ├── src/
│   │   ├── main.jsx              # Entry con providers
│   │   ├── App.jsx               # Rutas React Router
│   │   ├── index.css             # Tailwind + componentes
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Autenticación usuario
│   │   │   └── CartContext.jsx   # Estado del carrito
│   │   ├── services/
│   │   │   └── api.js            # Axios client + servicios
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Products.jsx
│   │       ├── ProductDetail.jsx
│   │       ├── Cart.jsx
│   │       ├── Checkout.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Favorites.jsx
│   │       ├── Profile.jsx
│   │       ├── Orders.jsx
│   │       └── OrderDetail.jsx
│   ├── vite.config.js            # Proxy a API en dev
│   ├── tailwind.config.js
│   └── package.json
│
├── adminPanel/                   # Panel administración
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Auth admin/vendedor
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── components/
│   │   │   └── Layout.jsx        # Sidebar + header
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx     # Estadísticas con Recharts
│   │       ├── Products.jsx
│   │       ├── ProductForm.jsx
│   │       ├── Categories.jsx
│   │       ├── Orders.jsx
│   │       ├── OrderDetail.jsx
│   │       ├── Inventory.jsx
│   │       ├── Users.jsx
│   │       └── Settings.jsx
│   ├── vite.config.js            # Puerto 5174
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   └── ecommerce.sql             # Schema completo + datos demo
│
└── README.md
```

## Base de Datos

### Tablas Principales

| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `usuarios` | Clientes y admins | id, email, password_hash, rol, activo |
| `productos` | Catálogo | id, nombre, precio, stock, categoria_id, activo |
| `categorias` | Jerarquía | id, nombre, padre_id, slug |
| `carritos` | Carrito usuario | id, usuario_id |
| `carrito_items` | Items carrito | carrito_id, producto_id, cantidad |
| `pedidos` | Órdenes | id, usuario_id, estado, total |
| `pedido_detalles` | Items pedido | pedido_id, producto_id, cantidad, precio |
| `favoritos` | Wishlist | usuario_id, producto_id |
| `direcciones` | Envío | usuario_id, calle, ciudad, cp |
| `metodos_pago` | Opciones pago | id, nombre, activo |
| `configuracion` | Settings tienda | clave, valor |
| `banners` | Carrusel home | id, imagen_url, enlace, activo |

### Roles de Usuario

- `admin`: Acceso total al panel
- `vendedor`: Gestión productos/pedidos
- `cliente`: Solo tienda online

## API Endpoints

> **Nota**: Todos los parámetros de la API están en inglés: `page`, `limit`, `search`, `sortBy`, `order`, `minPrice`, `maxPrice`, `featured`, `newProducts`, `onSale`, `status`, `role`, `active`, etc.

### Autenticación
```
POST /api/auth/register    # Crear cuenta
POST /api/auth/login       # Obtener JWT
GET  /api/auth/me          # Perfil actual
```

### Productos
```
GET    /api/productos                    # Listar (params: page, limit, search, sortBy, order, minPrice, maxPrice, featured, newProducts, onSale, category)
GET    /api/productos/:slug              # Detalle por slug
GET    /api/productos/id/:id             # Detalle por ID
POST   /api/productos                    # Crear (admin)
PUT    /api/productos/:id                # Actualizar (admin)
DELETE /api/productos/:id                # Eliminar (admin)
```

### Carrito
```
GET    /api/carrito                # Ver carrito
POST   /api/carrito/agregar        # Añadir item
PUT    /api/carrito/item/:id       # Actualizar cantidad
DELETE /api/carrito/item/:id       # Quitar item
DELETE /api/carrito                # Vaciar
```

### Pedidos
```
GET    /api/pedidos                    # Mis pedidos (params: page, limit, status)
GET    /api/pedidos/admin/todos        # Todos los pedidos - admin (params: page, limit, search, status)
GET    /api/pedidos/:numeroPedido      # Detalle
POST   /api/pedidos                    # Crear desde carrito
PUT    /api/pedidos/admin/:id/estado   # Cambiar estado (admin)
```

### Usuarios (admin)
```
GET    /api/usuarios                   # Listar (params: page, limit, search, role, active)
GET    /api/usuarios/:id               # Detalle
POST   /api/usuarios                   # Crear
PUT    /api/usuarios/:id               # Actualizar
PATCH  /api/usuarios/:id/estado        # Cambiar estado
```

### Inventario (admin)
```
GET    /api/inventario                 # Listar productos (params: page, limit, search, lowStock, category)
GET    /api/inventario/resumen         # Resumen general
GET    /api/inventario/stock-bajo      # Productos con stock bajo
GET    /api/inventario/movimientos     # Historial (params: page, limit, type, from, to)
GET    /api/inventario/alertas         # Alertas de stock
POST   /api/inventario/ajustar/:productoId  # Ajustar stock
```

### Respuestas de la API

Las respuestas con paginación tienen el formato:
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## Convenciones de Código

### Backend (Node.js)
- ES Modules (`import/export`)
- Async/await para operaciones DB
- Express Router por recurso
- Middleware JWT en rutas protegidas
- Respuestas: `{ success: true, data: {...} }`
- Errores: `{ success: false, message: "..." }`

### Frontend (React)
- Functional components con hooks
- Context API para estado global
- React Router v6 para navegación
- Axios con interceptors para auth
- Tailwind CSS para estilos
- Lucide React para iconos

### Nomenclatura
- Archivos: `camelCase.js` o `PascalCase.jsx` (componentes)
- Variables/funciones: `camelCase`
- Componentes React: `PascalCase`
- Tablas DB: `snake_case`
- Rutas API: `/api/recurso` en plural

## Dependencias Clave

### API
```json
{
  "express": "^4.18",
  "mysql2": "^3.6",
  "jsonwebtoken": "^9.0",
  "bcryptjs": "^2.4",
  "express-validator": "^7.0",
  "cors": "^2.8",
  "dotenv": "^16.3"
}
```

### Frontends
```json
{
  "react": "^18.2",
  "react-router-dom": "^6.20",
  "axios": "^1.6",
  "lucide-react": "^0.294",
  "tailwindcss": "^3.3"
}
```

### Admin Panel adicional
```json
{
  "recharts": "^2.10"
}
```

## Variables de Entorno

### API (.env)
```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=ecommerce
JWT_SECRET=secreto_seguro
JWT_EXPIRES_IN=7d
```

### Frontends (.env)
```
VITE_API_URL=http://localhost:3001/api
```

## Comandos de Desarrollo

```bash
# Iniciar API
cd api && npm run dev

# Iniciar tienda cliente
cd tiendaOnline && npm run dev

# Iniciar panel admin
cd adminPanel && npm run dev

# Build producción
npm run build  # en cada frontend
```

## Usuarios de Prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@tienda.com | admin123 | admin |
| vendedor@tienda.com | vendedor123 | vendedor |
| cliente@example.com | cliente123 | cliente |

## Flujos Principales

### Compra (Cliente)
1. Navegar productos → añadir al carrito
2. Ir a carrito → proceder a checkout
3. Seleccionar dirección y método de pago
4. Confirmar pedido → se crea en estado "pendiente"
5. Ver historial en "Mis pedidos"

### Gestión Pedido (Admin)
1. Ver pedidos pendientes en Dashboard
2. Abrir detalle del pedido
3. Cambiar estado: pendiente → procesando → enviado → entregado
4. Añadir número de guía si aplica

### Inventario (Admin)
1. Ver alertas de stock bajo
2. Registrar movimiento (entrada/salida)
3. El stock se actualiza automáticamente

## Notas para Modificaciones

- **Añadir endpoint**: Crear archivo en `api/src/routes/`, registrar en `index.js`
- **Nueva página frontend**: Crear en `pages/`, añadir ruta en `App.jsx`
- **Nuevo componente**: Crear en `components/`, importar donde se use
- **Modificar DB**: Actualizar `database/ecommerce.sql` y documentar migración
- **Estilos globales**: Editar `index.css` en la capa `@layer components`

## Seguridad

- Passwords hasheados con bcrypt (10 rounds)
- JWT en header `Authorization: Bearer <token>`
- Validación de inputs con express-validator
- Roles verificados en middleware
- CORS configurado para orígenes permitidos
