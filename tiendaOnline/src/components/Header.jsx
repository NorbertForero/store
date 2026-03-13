import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, ShoppingCart, Heart, User, Menu, X, 
  LogOut, Package, ChevronDown, Moon, Sun 
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useTheme } from '../context/ThemeContext'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isAuthenticated, logout } = useAuth()
  const { itemCount } = useCart()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/productos?busqueda=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="font-bold text-xl text-gray-800 dark:text-white hidden sm:block">
              Tienda Online
            </span>
          </Link>

          {/* Buscador - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-4 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600"
              >
                <Search size={20} />
              </button>
            </div>
          </form>

          {/* Acciones */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Toggle Dark Mode */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            {/* Favoritos */}
            {isAuthenticated && (
              <Link 
                to="/favoritos" 
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Favoritos"
              >
                <Heart size={24} />
              </Link>
            )}

            {/* Carrito */}
            <Link 
              to="/carrito" 
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              title="Carrito"
            >
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Usuario */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <User size={24} />
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.nombre}
                  </span>
                  <ChevronDown size={16} className="hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 animate-fadeIn">
                    <Link
                      to="/perfil"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <User size={18} />
                      Mi Perfil
                    </Link>
                    <Link
                      to="/pedidos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Package size={18} />
                      Mis Pedidos
                    </Link>
                    <hr className="my-1 dark:border-gray-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                    >
                      <LogOut size={18} />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary text-sm"
              >
                Iniciar Sesión
              </Link>
            )}

            {/* Menú móvil */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 md:hidden"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Buscador móvil */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full pl-4 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 dark:text-gray-400"
              >
                <Search size={20} />
              </button>
            </div>
          </form>
        </div>

        {/* Navegación móvil */}
        {menuOpen && (
          <nav className="md:hidden border-t border-gray-100 dark:border-gray-700 py-4 animate-fadeIn">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/productos"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  Todos los Productos
                </Link>
              </li>
              <li>
                <Link
                  to="/productos/electronica"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  Electrónica
                </Link>
              </li>
              <li>
                <Link
                  to="/productos/ropa"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  Ropa
                </Link>
              </li>
              <li>
                <Link
                  to="/productos/hogar"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                >
                  Hogar
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>

      {/* Navegación Desktop */}
      <nav className="hidden md:block border-t border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-8 h-12">
            <li>
              <Link
                to="/productos"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
              >
                Todos los Productos
              </Link>
            </li>
            <li>
              <Link
                to="/productos/electronica"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
              >
                Electrónica
              </Link>
            </li>
            <li>
              <Link
                to="/productos/ropa"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
              >
                Ropa
              </Link>
            </li>
            <li>
              <Link
                to="/productos/hogar"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
              >
                Hogar
              </Link>
            </li>
            <li>
              <Link
                to="/productos/deportes"
                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
              >
                Deportes
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
