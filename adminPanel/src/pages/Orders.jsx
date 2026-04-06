import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Search, Filter, ChevronLeft, ChevronRight, Loader } from 'lucide-react'
import { pedidosService } from '../services/api'
import { formatCurrency } from '../utils/currency'

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  const [filtros, setFiltros] = useState({
    buscar: searchParams.get('buscar') || '',
    estado: searchParams.get('estado') || ''
  })

  useEffect(() => {
    loadPedidos()
  }, [searchParams])

  const loadPedidos = async () => {
    setLoading(true)
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 15,
        search: searchParams.get('buscar') || '',
        status: searchParams.get('estado') || ''
      }
      const response = await pedidosService.getAll(params)
      setPedidos(response.data.data.orders || [])
      setPagination({
        page: response.data.data.pagination?.page || 1,
        total: response.data.data.pagination?.total || 0,
        totalPages: response.data.data.pagination?.totalPages || 0
      })
    } catch (error) {
      console.error('Error cargando pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltrar = () => {
    const params = new URLSearchParams()
    if (filtros.buscar) params.set('buscar', filtros.buscar)
    if (filtros.estado) params.set('estado', filtros.estado)
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge-warning',
      confirmado: 'badge-info',
      preparando: 'bg-purple-100 text-purple-800',
      enviado: 'bg-indigo-100 text-indigo-800',
      entregado: 'badge-success',
      cancelado: 'badge-danger'
    }
    return badges[estado] || 'badge-gray'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pedidos</h1>

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
                placeholder="Buscar por # pedido o cliente..."
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros(f => ({ ...f, estado: e.target.value }))}
            className="select w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="preparando">Preparando</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
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
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="7">
                      <div className="animate-pulse h-12 bg-gray-100 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                pedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td className="font-medium">#{pedido.numero_pedido}</td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{pedido.cliente_nombre}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{pedido.cliente_email}</p>
                      </div>
                    </td>
                    <td className="text-gray-600 text-sm">
                      {formatDate(pedido.fecha_pedido)}
                    </td>
                    <td className="font-medium">
                      {formatCurrency(pedido.total)}
                    </td>
                    <td>
                      <span className={`badge ${getEstadoBadge(pedido.estado)} capitalize`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        pedido.estado_pago === 'pagado' ? 'badge-success' :
                        pedido.estado_pago === 'fallido' ? 'badge-danger' :
                        'badge-warning'
                      } capitalize`}>
                        {pedido.estado_pago || 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/pedidos/${pedido.numero_pedido}`}
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={16} />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {pedidos.length} de {pagination.total} pedidos
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
    </div>
  )
}
