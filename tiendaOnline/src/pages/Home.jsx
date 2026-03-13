import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ArrowRight } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { productosService, categoriasService, configuracionService } from '../services/api'

export default function Home() {
  const [destacados, setDestacados] = useState([])
  const [nuevos, setNuevos] = useState([])
  const [ofertas, setOfertas] = useState([])
  const [categorias, setCategorias] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [destacadosRes, nuevosRes, ofertasRes, categoriasRes, bannersRes] = await Promise.all([
        productosService.getAll({ featured: 'true', limit: 4 }),
        productosService.getAll({ newProducts: 'true', limit: 4 }),
        productosService.getAll({ onSale: 'true', limit: 4 }),
        categoriasService.getAll(),
        configuracionService.getBanners().catch(() => ({ data: { data: [] } }))
      ])

      setDestacados(destacadosRes.data.data.products)
      setNuevos(nuevosRes.data.data.products)
      setOfertas(ofertasRes.data.data.products)
      setCategorias(categoriasRes.data.data.slice(0, 6))
      setBanners(bannersRes.data.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Descubre las mejores ofertas
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Miles de productos con los mejores precios y envío gratis en compras mayores a $999
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/productos" className="btn bg-white text-primary-600 hover:bg-gray-100">
                Ver Productos
                <ArrowRight size={20} />
              </Link>
              <Link to="/productos?onSale=true" className="btn btn-outline border-white text-white hover:bg-white/10">
                Ver Ofertas
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-1/3 h-full hidden lg:block">
          <div className="w-full h-full bg-gradient-to-l from-white/10 to-transparent"></div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-12 bg-white dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Categorías</h2>
            <Link to="/productos" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1">
              Ver todas <ChevronRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categorias.map((categoria) => (
              <Link
                key={categoria.id}
                to={`/productos/${categoria.slug}`}
                className="group"
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-3">
                  <img
                    src={categoria.imagen_url || `https://via.placeholder.com/200x200?text=${categoria.nombre}`}
                    alt={categoria.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-center font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {categoria.nombre}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      {destacados.length > 0 && (
        <section className="py-12 bg-gray-50 dark:bg-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Productos Destacados</h2>
              <Link to="/productos?destacados=true" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1">
                Ver todos <ChevronRight size={20} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {destacados.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banner Promocional */}
      <section className="py-12 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-primary-400 font-semibold mb-2 block">Oferta Especial</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Hasta 50% de descuento
              </h2>
              <p className="text-gray-300 mb-6">
                En productos seleccionados. ¡No te lo pierdas!
              </p>
              <Link to="/productos?enOferta=true" className="btn btn-primary">
                Ver Ofertas <ArrowRight size={20} />
              </Link>
            </div>
            <div className="w-64 h-64 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <span className="text-6xl font-bold">50%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ofertas */}
      {ofertas.length > 0 && (
        <section className="py-12 bg-white dark:bg-gray-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">🔥 Ofertas del Día</h2>
              <Link to="/productos?enOferta=true" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1">
                Ver todas <ChevronRight size={20} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ofertas.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nuevos Productos */}
      {nuevos.length > 0 && (
        <section className="py-12 bg-gray-50 dark:bg-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">✨ Nuevos Productos</h2>
              <Link to="/productos?nuevos=true" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1">
                Ver todos <ChevronRight size={20} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {nuevos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Suscríbete a nuestro newsletter
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Recibe las últimas novedades, ofertas exclusivas y descuentos especiales directamente en tu correo.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 px-4 py-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button type="submit" className="btn bg-gray-900 text-white hover:bg-gray-800">
              Suscribirse
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
