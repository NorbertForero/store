import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { favoritosService } from '../services/api'

export default function Favorites() {
  const [favoritos, setFavoritos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavoritos()
  }, [])

  const loadFavoritos = async () => {
    try {
      const response = await favoritosService.getAll()
      setFavoritos(response.data.data || [])
    } catch (error) {
      console.error('Error cargando favoritos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (productoId) => {
    try {
      await favoritosService.toggle(productoId)
      setFavoritos(prev => prev.filter(f => f.producto_id !== productoId))
    } catch (error) {
      console.error('Error eliminando favorito:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 skeleton w-48 mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-80 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!favoritos.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center bg-gray-50 dark:bg-gray-900 min-h-[60vh] transition-colors">
        <Heart className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No tienes favoritos</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Guarda tus productos favoritos para encontrarlos fácilmente</p>
        <Link to="/productos" className="btn btn-primary">
          Explorar productos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Mis favoritos ({favoritos.length})
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {favoritos.map((item) => (
          <div key={item.id} className="relative">
            <ProductCard 
              producto={{
                id: item.producto_id,
                nombre: item.producto_nombre,
                slug: item.producto_slug,
                precio: item.precio,
                precio_oferta: item.precio_oferta,
                imagen_principal: item.imagen_url,
                stock: item.stock,
                enFavoritos: true
              }} 
            />
            <button
              onClick={() => handleRemove(item.producto_id)}
              className="absolute top-2 right-2 z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
