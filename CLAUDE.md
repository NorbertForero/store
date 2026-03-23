# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full e-commerce system with three independent modules communicating via a REST API:
- `tiendaOnline/` — customer-facing storefront (React + Vite, port 5173)
- `adminPanel/` — admin/seller dashboard (React + Vite, port 5174)
- `api/` — Node.js/Express REST API (port 3001)
- `database/` — MySQL schema (`ecommerce.sql`) and migrations

## Development Commands

Each module is run independently from its own directory:

```bash
# API (requires MySQL running and api/.env configured)
cd api && npm run dev        # nodemon watch

# Customer store
cd tiendaOnline && npm run dev

# Admin panel
cd adminPanel && npm run dev

# Production builds
cd tiendaOnline && npm run build
cd adminPanel && npm run build
```

No test runner is wired up beyond `jest` listed in the API's package.json (no test files exist yet).

## Environment Setup

**`api/.env`** (required):
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

**`tiendaOnline/.env` and `adminPanel/.env`**:
```
VITE_API_URL=http://localhost:3001/api
```

In dev, both Vite frontends proxy `/api` requests to `localhost:3001`, so `VITE_API_URL` is only needed for production builds.

## Architecture

### API
- **CommonJS** (`require`/`module.exports`) — not ES Modules
- One file per resource in `api/src/routes/`, each registered in `api/src/index.js`
- Auth middleware: `auth` (required JWT), `optionalAuth`, `isAdmin`, `isAdminOrVendedor` — imported from `api/src/middleware/auth.middleware.js`
- DB access via a MySQL2 connection pool (`api/src/config/database.js`)
- Response shape: `{ success: true, data: {...} }` on success, `{ success: false, message: "..." }` on error
- Paginated responses include a `pagination: { page, limit, total, totalPages }` object inside `data`

### Frontends (both tiendaOnline and adminPanel)
- **ES Modules** (`import`/`export`)
- Global state via React Context: `AuthContext` (JWT + user), `CartContext` (tiendaOnline only)
- All API calls go through `src/services/api.js` — an Axios instance with auth interceptors
- Routes defined in `App.jsx` using React Router v6
- Tailwind CSS; custom component classes go in `src/index.css` under `@layer components`
- Icons: Lucide React
- Admin panel additionally uses Recharts for dashboard charts

### Database
User roles: `admin` (full access), `vendedor` (products/orders), `cliente` (storefront only).

Key tables: `usuarios`, `productos`, `categorias`, `carritos`/`carrito_items`, `pedidos`/`pedido_detalles`, `favoritos`, `inventario_movimientos`, `configuracion`, `banners`.

## Deployment

Pushing to `main` triggers GitHub Actions (`.github/workflows/deploy.yml`), which SSHs into the server, pulls, runs `npm install`, restarts the API with `pm2 restart api`, and rebuilds both frontends.

## Code Conventions

- API query params are in English (`page`, `limit`, `search`, `sortBy`, `order`, `status`, etc.), even though route names are in Spanish
- Files: `camelCase.js` for utilities/services, `PascalCase.jsx` for React components
- To add an API endpoint: create/edit the route file in `api/src/routes/`, register it in `api/src/index.js` if new
- To add a frontend page: create in `pages/`, add the `<Route>` in `App.jsx`
- DB schema changes: update `database/ecommerce.sql` and add a migration file under `database/migrations/`
