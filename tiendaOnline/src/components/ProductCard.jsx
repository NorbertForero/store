import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { favoritosService } from '../services/api'
import { formatCurrency } from '../utils/currency'

export default function ProductCard({ producto }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(producto.enFavoritos || false)
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()

  const precioFinal = producto.precio_oferta || producto.precio
  const tieneDescuento = producto.precio_oferta && producto.precio_oferta < producto.precio
  const porcentajeDescuento = tieneDescuento 
    ? Math.round((1 - producto.precio_oferta / producto.precio) * 100)
    : 0

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoading(true)
    await addToCart(producto.id)
    setIsLoading(false)
  }

  const handleToggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }
    try {
      const response = await favoritosService.toggle(producto.id)
      setIsFavorite(response.data.data.enFavoritos)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  return (
    <div className="card group relative animate-fadeIn">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {tieneDescuento && (
          <span className="badge badge-danger">-{porcentajeDescuento}%</span>
        )}
        {producto.nuevo && (
          <span className="badge badge-info">Nuevo</span>
        )}
        {producto.stock === 0 && (
          <span className="badge bg-gray-800 text-white">Agotado</span>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleToggleFavorite}
          className={`p-2 rounded-full shadow-md transition-colors ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500'
          }`}
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <Link
          to={`/producto/${producto.slug}`}
          className="p-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 rounded-full shadow-md transition-colors"
          title="Ver detalles"
        >
          <Eye size={18} />
        </Link>
      </div>

      {/* Imagen */}
      <Link to={`/producto/${producto.slug}`} className="block aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={producto.imagen_principal || producto.imagen || '/placeholder.svg'}
          alt={producto.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
        />
      </Link>

      {/* Contenido */}
      <div className="p-4">
        {/* Marca */}
        {producto.marca_nombre && (
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {producto.marca_nombre}
          </p>
        )}

        {/* Nombre */}
        <Link to={`/producto/${producto.slug}`}>
          <h3 className="font-medium text-gray-800 dark:text-gray-100 line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-2">
            {producto.nombre}
          </h3>
        </Link>

        {/* Rating */}
        {producto.calificacion_promedio > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < Math.round(producto.calificacion_promedio) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({producto.total_resenas || 0})
            </span>
          </div>
        )}

        {/* Precio */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(precioFinal)}
          </span>
          {tieneDescuento && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(producto.precio)}
            </span>
          )}
        </div>

        {/* Botón agregar al carrito */}
        <button
          onClick={handleAddToCart}
          disabled={isLoading || producto.stock === 0}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart size={18} />
          {isLoading ? 'Agregando...' : producto.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  )
}
