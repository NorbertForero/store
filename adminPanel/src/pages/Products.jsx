import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Plus, Search, Edit2, Trash2, Eye, ChevronLeft, ChevronRight,
  Filter, MoreVertical
} from 'lucide-react'
import { productosService, categoriasService } from '../services/api'
import { formatCurrency } from '../utils/currency'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  
  const [filtros, setFiltros] = useState({
    buscar: searchParams.get('buscar') || '',
    categoria: searchParams.get('categoria') || '',
    estado: searchParams.get('estado') || ''
  })

  const [deleteModal, setDeleteModal] = useState({ open: false, producto: null })

  useEffect(() => {
    loadCategorias()
  }, [])

  useEffect(() => {
    loadProductos()
  }, [searchParams])

  const loadCategorias = async () => {
    try {
      const response = await categoriasService.getAll()
      setCategorias(response.data.data || [])
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  const loadProductos = async () => {
    setLoading(true)
    try {
      const estadoFiltro = searchParams.get('estado') || ''
      const params = {
        page: searchParams.get('page') || 1,
        limit: 10,
        search: searchParams.get('buscar') || '',
        category: searchParams.get('categoria') || '',
        ...(estadoFiltro === 'activo' && { status: 'active' }),
        ...(estadoFiltro === 'inactivo' && { status: 'inactive' })
      }
      const response = await productosService.getAll(params)
      setProductos(response.data.data.products || [])
      setPagination({
        page: response.data.data.pagination?.page || 1,
        total: response.data.data.pagination?.total || 0,
        totalPages: response.data.data.pagination?.totalPages || 0
      })
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    if (filtros.buscar) params.set('buscar', filtros.buscar)
    if (filtros.categoria) params.set('categoria', filtros.categoria)
    if (filtros.estado) params.set('estado', filtros.estado)
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
  }

  const handleDelete = async () => {
    if (!deleteModal.producto) return
    try {
      await productosService.delete(deleteModal.producto.id)
      loadProductos()
    } catch (error) {
      console.error('Error eliminando producto:', error)
    }
    setDeleteModal({ open: false, producto: null })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <Link to="/productos/nuevo" className="btn btn-primary">
          <Plus size={20} />
          Nuevo producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={filtros.buscar}
                onChange={(e) => setFiltros(f => ({ ...f, buscar: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleFiltrar()}
                placeholder="Buscar productos..."
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={filtros.categoria}
            onChange={(e) => setFiltros(f => ({ ...f, categoria: e.target.value }))}
            className="select w-auto"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.nombre}</option>
            ))}
          </select>
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(f => ({ ...f, estado: e.target.value }))}
            className="select w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <button onClick={handleFiltrar} className="btn btn-secondary">
            <Filter size={18} />
            Filtrar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="6">
                      <div className="animate-pulse h-12 bg-gray-100 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={producto.imagen_principal || '/placeholder.svg'}
                          alt={producto.nombre}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                        />
                        <div>
                          <p className="font-medium text-gray-800">{producto.nombre}</p>
                          <p className="text-xs text-gray-500">{producto.categoria_nombre}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{producto.sku}</td>
                    <td>
                      <div>
                        <p className="font-medium">
                          {formatCurrency(producto.precio)}
                        </p>
                        {producto.precio_oferta && (
                          <p className="text-xs text-green-600">
                            Oferta: {formatCurrency(producto.precio_oferta)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`font-medium ${
                        producto.stock === 0 ? 'text-red-600' :
                        producto.stock <= 10 ? 'text-yellow-600' :
                        'text-gray-800'
                      }`}>
                        {producto.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${producto.disponible ? 'badge-success' : 'badge-gray'}`}>
                        {producto.disponible ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <a
                          href={`http://localhost:5173/producto/${producto.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Ver en tienda"
                        >
                          <Eye size={18} />
                        </a>
                        <Link
                          to={`/productos/${producto.id}`}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => setDeleteModal({ open: true, producto })}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Mostrando {productos.length} de {pagination.total} productos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-secondary btn-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal eliminar */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Eliminar producto?</h3>
            <p className="text-gray-600 mb-6">
              Esta acción eliminará "{deleteModal.producto?.nombre}" permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, producto: null })}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
