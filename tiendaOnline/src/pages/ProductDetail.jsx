import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  Heart, ShoppingCart, Minus, Plus, Star, 
  Truck, Shield, RotateCcw, Share2, ChevronRight 
} from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { productosService, favoritosService } from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/currency'

export default function ProductDetail() {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  
  const [producto, setProducto] = useState(null)
  const [relacionados, setRelacionados] = useState([])
  const [loading, setLoading] = useState(true)
  const [cantidad, setCantidad] = useState(1)
  const [imagenActiva, setImagenActiva] = useState(0)
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    loadProducto()
  }, [slug])

  const loadProducto = async () => {
    setLoading(true)
    try {
      const response = await productosService.getBySlug(slug)
      const prod = response.data.data
      setProducto(prod)
      setIsFavorite(prod.enFavoritos)

      // Cargar relacionados
      const relResponse = await productosService.getRelacionados(prod.id)
      setRelacionados(relResponse.data.data)
    } catch (error) {
      console.error('Error cargando producto:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    setAddingToCart(true)
    const result = await addToCart(producto.id, varianteSeleccionada?.id, cantidad)
    setMensaje(result)
    setTimeout(() => setMensaje(null), 3000)
    setAddingToCart(false)
  }

  const handleToggleFavorite = async () => {
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-8 skeleton w-3/4"></div>
            <div className="h-6 skeleton w-1/2"></div>
            <div className="h-24 skeleton"></div>
            <div className="h-12 skeleton w-1/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Producto no encontrado</h2>
        <Link to="/productos" className="btn btn-primary">Ver todos los productos</Link>
      </div>
    )
  }

  const precioFinal = varianteSeleccionada?.precio_oferta || varianteSeleccionada?.precio || producto.precio_oferta || producto.precio
  const tieneDescuento = (producto.precio_oferta && producto.precio_oferta < producto.precio) || 
                         (varianteSeleccionada?.precio_oferta && varianteSeleccionada?.precio_oferta < (varianteSeleccionada?.precio || producto.precio))
  const stockActual = varianteSeleccionada?.stock ?? producto.stock

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
        <Link to="/" className="hover:text-primary-600">Inicio</Link>
        <ChevronRight size={16} />
        <Link to="/productos" className="hover:text-primary-600">Productos</Link>
        {producto.categorias?.[0] && (
          <>
            <ChevronRight size={16} />
            <Link to={`/productos/${producto.categorias[0].slug}`} className="hover:text-primary-600">
              {producto.categorias[0].nombre}
            </Link>
          </>
        )}
        <ChevronRight size={16} />
        <span className="text-gray-800 dark:text-white truncate">{producto.nombre}</span>
      </nav>

      {/* Toast mensaje */}
      {mensaje && (
        <div className={`toast ${mensaje.success ? 'toast-success' : 'toast-error'}`}>
          {mensaje.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Galería de imágenes */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
            <img
              src={producto.imagenes?.[imagenActiva]?.url || '/placeholder.svg'}
              alt={producto.nombre}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
            />
          </div>
          {producto.imagenes?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {producto.imagenes.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setImagenActiva(idx)}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                    imagenActiva === idx ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/placeholder.svg' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div>
          {/* Marca y badges */}
          <div className="flex items-center gap-2 mb-2">
            {producto.marca_nombre && (
              <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {producto.marca_nombre}
              </span>
            )}
            {producto.nuevo && <span className="badge badge-info">Nuevo</span>}
            {stockActual === 0 && <span className="badge bg-gray-800 text-white">Agotado</span>}
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {producto.nombre}
          </h1>

          {/* Rating */}
          {producto.calificacion_promedio > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.round(producto.calificacion_promedio) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                {producto.calificacion_promedio.toFixed(1)} ({producto.total_resenas} reseñas)
              </span>
            </div>
          )}

          {/* Precio */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(precioFinal)}
            </span>
            {tieneDescuento && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  {formatCurrency(producto.precio)}
                </span>
                <span className="badge badge-danger">
                  -{Math.round((1 - precioFinal / producto.precio) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Descripción corta */}
          {producto.descripcion_corta && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">{producto.descripcion_corta}</p>
          )}

          {/* Variantes */}
          {producto.variantes?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Opciones:</h3>
              <div className="flex flex-wrap gap-2">
                {producto.variantes.map((variante) => (
                  <button
                    key={variante.id}
                    onClick={() => setVarianteSeleccionada(variante)}
                    disabled={variante.stock === 0}
                    className={`px-4 py-2 border rounded-lg text-sm transition-all ${
                      varianteSeleccionada?.id === variante.id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                        : variante.stock === 0
                        ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {variante.nombre || variante.atributos?.map(a => a.valor).join(' / ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad y botones */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Minus size={18} />
              </button>
              <span className="w-12 text-center font-medium dark:text-white">{cantidad}</span>
              <button
                onClick={() => setCantidad(Math.min(stockActual, cantidad + 1))}
                className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={cantidad >= stockActual}
              >
                <Plus size={18} />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={addingToCart || stockActual === 0}
              className="btn btn-primary flex-1 py-3 disabled:opacity-50"
            >
              <ShoppingCart size={20} />
              {addingToCart ? 'Agregando...' : stockActual === 0 ? 'Agotado' : 'Agregar al carrito'}
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`p-3 rounded-lg border transition-colors ${
                isFavorite 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-500' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-500 hover:text-red-500'
              }`}
            >
              <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Stock */}
          {stockActual > 0 && stockActual <= 10 && (
            <p className="text-orange-600 text-sm mb-6">
              ¡Solo quedan {stockActual} unidades!
            </p>
          )}

          {/* Beneficios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Truck className="text-primary-600" size={24} />
              <div>
                <p className="font-medium text-sm dark:text-white">Envío Gratis</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">En compras +$999</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="text-primary-600" size={24} />
              <div>
                <p className="font-medium text-sm dark:text-white">Compra Segura</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pago protegido</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="text-primary-600" size={24} />
              <div>
                <p className="font-medium text-sm dark:text-white">30 días</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Para devolución</p>
              </div>
            </div>
          </div>

          {/* SKU */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            SKU: {varianteSeleccionada?.sku || producto.sku}
          </p>
        </div>
      </div>

      {/* Descripción completa */}
      {producto.descripcion && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Descripción</h2>
          <div className="prose max-w-none text-gray-600 dark:text-gray-400">
            {producto.descripcion}
          </div>
        </div>
      )}

      {/* Reseñas */}
      {producto.resenas?.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Reseñas de clientes</h2>
          <div className="space-y-4">
            {producto.resenas.map((resena) => (
              <div key={resena.id} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < resena.calificacion ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span className="font-medium">{resena.usuario_nombre}</span>
                  {resena.verificada && (
                    <span className="badge badge-success text-xs">Compra verificada</span>
                  )}
                </div>
                {resena.titulo && <h4 className="font-medium mb-1 dark:text-white">{resena.titulo}</h4>}
                <p className="text-gray-600 dark:text-gray-400">{resena.comentario}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Productos relacionados */}
      {relacionados.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Productos relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relacionados.map((prod) => (
              <ProductCard key={prod.id} producto={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
