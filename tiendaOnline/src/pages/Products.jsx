import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Filter, X, ChevronDown, Grid, List } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { productosService, categoriasService } from '../services/api'

export default function Products() {
  const { categoria } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [paginacion, setPaginacion] = useState({})
  
  // Filtros
  const [filtros, setFiltros] = useState({
    page: searchParams.get('page') || 1,
    limit: 12,
    sortBy: searchParams.get('sortBy') || 'created_at',
    order: searchParams.get('order') || 'DESC',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    search: searchParams.get('search') || '',
    featured: searchParams.get('featured') || '',
    newProducts: searchParams.get('newProducts') || '',
    onSale: searchParams.get('onSale') || ''
  })

  useEffect(() => {
    loadCategorias()
  }, [])

  useEffect(() => {
    loadProductos()
  }, [categoria, filtros])

  const loadCategorias = async () => {
    try {
      const response = await categoriasService.getAll()
      setCategorias(response.data.data)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  const loadProductos = async () => {
    setLoading(true)
    try {
      const params = {
        ...filtros,
        categoria: categoria || undefined
      }
      
      // Limpiar params vacíos
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key]
        }
      })

      const response = await productosService.getAll(params)
      setProductos(response.data.data.products)
      setPaginacion(response.data.data.pagination)
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltroChange = (key, value) => {
    const nuevosFiltros = { ...filtros, [key]: value, page: 1 }
    setFiltros(nuevosFiltros)
    
    // Actualizar URL
    const params = new URLSearchParams()
    Object.entries(nuevosFiltros).forEach(([k, v]) => {
      if (v && v !== '' && k !== 'limit') {
        params.set(k, v)
      }
    })
    setSearchParams(params)
  }

  const limpiarFiltros = () => {
    setFiltros({
      page: 1,
      limit: 12,
      sortBy: 'created_at',
      order: 'DESC',
      minPrice: '',
      maxPrice: '',
      search: '',
      featured: '',
      newProducts: '',
      onSale: ''
    })
    setSearchParams({})
  }

  const categoriaActual = categorias.find(c => c.slug === categoria)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {categoriaActual?.nombre || 'Todos los Productos'}
        </h1>
        {categoriaActual?.descripcion && (
          <p className="text-gray-600 dark:text-gray-400">{categoriaActual.descripcion}</p>
        )}
        {filtros.search && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Resultados para: "<span className="font-medium">{filtros.search}</span>"
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filtros - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800 dark:text-white">Filtros</h3>
              <button
                onClick={limpiarFiltros}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Limpiar
              </button>
            </div>

            {/* Categorías */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Categorías</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/productos"
                    className={`block text-sm ${!categoria ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                  >
                    Todas
                  </a>
                </li>
                {categorias.filter(c => !c.categoria_padre_id).map(cat => (
                  <li key={cat.id}>
                    <a
                      href={`/productos/${cat.slug}`}
                      className={`block text-sm ${categoria === cat.slug ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                    >
                      {cat.nombre}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Precio */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Precio</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filtros.minPrice}
                  onChange={(e) => handleFiltroChange('minPrice', e.target.value)}
                  className="input text-sm"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={filtros.maxPrice}
                  onChange={(e) => handleFiltroChange('maxPrice', e.target.value)}
                  className="input text-sm"
                />
              </div>
            </div>

            {/* Otros filtros */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.featured === 'true'}
                  onChange={(e) => handleFiltroChange('featured', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Destacados</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.newProducts === 'true'}
                  onChange={(e) => handleFiltroChange('newProducts', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Nuevos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.onSale === 'true'}
                  onChange={(e) => handleFiltroChange('onSale', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">En oferta</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1">
          {/* Barra de herramientas */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Botón filtros móvil */}
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden btn btn-secondary"
              >
                <Filter size={18} />
                Filtros
              </button>

              <span className="text-gray-600 dark:text-gray-400">
                {paginacion.total || 0} productos
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Ordenar */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Ordenar:</span>
                <select
                  value={`${filtros.sortBy}-${filtros.order}`}
                  onChange={(e) => {
                    const [sortBy, order] = e.target.value.split('-')
                    handleFiltroChange('sortBy', sortBy)
                    setFiltros(prev => ({ ...prev, order }))
                  }}
                  className="input text-sm py-2 pr-8"
                >
                  <option value="created_at-DESC">Más recientes</option>
                  <option value="precio-ASC">Precio: menor a mayor</option>
                  <option value="precio-DESC">Precio: mayor a menor</option>
                  <option value="nombre-ASC">Nombre: A-Z</option>
                  <option value="calificacion_promedio-DESC">Mejor valorados</option>
                  <option value="total_vendidos-DESC">Más vendidos</option>
                </select>
              </div>

              {/* Vista */}
              <div className="hidden sm:flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Productos */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card">
                  <div className="aspect-square skeleton"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 skeleton w-1/3"></div>
                    <div className="h-5 skeleton"></div>
                    <div className="h-4 skeleton w-2/3"></div>
                    <div className="h-10 skeleton"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Intenta con otros filtros o términos de búsqueda
              </p>
              <button onClick={limpiarFiltros} className="btn btn-primary">
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {productos.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>

              {/* Paginación */}
              {paginacion.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handleFiltroChange('page', paginacion.page - 1)}
                    disabled={paginacion.page === 1}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    Página {paginacion.page} de {paginacion.totalPages}
                  </span>
                  <button
                    onClick={() => handleFiltroChange('page', paginacion.page + 1)}
                    disabled={paginacion.page === paginacion.totalPages}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Filtros Móvil */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800">Filtros</h3>
              <button onClick={() => setFiltersOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            {/* Contenido de filtros igual que sidebar */}
            <div className="space-y-6">
              {/* Categorías */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Categorías</h4>
                <ul className="space-y-2">
                  {categorias.filter(c => !c.categoria_padre_id).map(cat => (
                    <li key={cat.id}>
                      <a
                        href={`/productos/${cat.slug}`}
                        className={`block text-sm ${categoria === cat.slug ? 'text-primary-600 font-medium' : 'text-gray-600'}`}
                      >
                        {cat.nombre}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Precio */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Precio</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={filtros.minPrice}
                    onChange={(e) => handleFiltroChange('minPrice', e.target.value)}
                    className="input text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    value={filtros.maxPrice}
                    onChange={(e) => handleFiltroChange('maxPrice', e.target.value)}
                    className="input text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  limpiarFiltros()
                  setFiltersOpen(false)
                }}
                className="btn btn-secondary w-full"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
