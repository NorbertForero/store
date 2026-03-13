import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductForm from './pages/ProductForm'
import Categories from './pages/Categories'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Inventory from './pages/Inventory'
import Users from './pages/Users'
import Settings from './pages/Settings'

function PrivateRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<Products />} />
        <Route path="productos/nuevo" element={<ProductForm />} />
        <Route path="productos/:id" element={<ProductForm />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="pedidos/:id" element={<OrderDetail />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="configuracion" element={<Settings />} />
      </Route>
    </Routes>
  )
}
