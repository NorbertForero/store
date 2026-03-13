# E-commerce Store

Sistema de e-commerce completo con tienda online, panel de administración y API backend.

## Estructura del proyecto

```
store/
├── api/                 # Backend Node.js/Express
├── tiendaOnline/        # Frontend cliente (React)
├── adminPanel/          # Panel administración (React)
└── database/            # Esquema SQL
```

## Requisitos previos

- Node.js 18+
- MySQL 8.0+ o MariaDB 10.5+
- npm o yarn

## Instalación rápida

### 1. Base de datos

```bash
# Crear la base de datos
mysql -u root -p < database/ecommerce.sql
```

### 2. Backend API

```bash
cd api
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

### 3. Tienda Online (cliente)

```bash
cd tiendaOnline
npm install
npm run dev
```

### 4. Panel de Administración

```bash
cd adminPanel
npm install
npm run dev
```

## URLs por defecto

| Servicio | URL | Puerto |
|----------|-----|--------|
| API | http://localhost:3001 | 3001 |
| Tienda | http://localhost:5173 | 5173 |
| Admin | http://localhost:5174 | 5174 |

## Credenciales de prueba

**Administrador:**
- Email: admin@tienda.com
- Password: admin123

**Cliente:**
- Email: cliente@example.com
- Password: cliente123

## Características

### Tienda Online
- ✅ Catálogo de productos con filtros
- ✅ Carrito de compras
- ✅ Lista de favoritos
- ✅ Sistema de autenticación
- ✅ Múltiples métodos de pago
- ✅ Historial de pedidos
- ✅ Perfil de usuario

### Panel de Administración
- ✅ Dashboard con estadísticas
- ✅ Gestión de productos
- ✅ Gestión de categorías
- ✅ Gestión de pedidos
- ✅ Control de inventario
- ✅ Gestión de usuarios
- ✅ Configuración de tienda

## Despliegue en producción

### Variables de entorno

Ver archivos `.env.example` en cada proyecto.

### Build de producción

```bash
# Tienda Online
cd tiendaOnline && npm run build

# Admin Panel
cd adminPanel && npm run build
```

Los builds se generan en las carpetas `dist/`.

## Tecnologías

- **Backend:** Node.js, Express, MySQL2, JWT, bcrypt
- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Base de datos:** MySQL/MariaDB

## Licencia

MIT

root
Norbert2026#*

nf
Ganfor2026#*