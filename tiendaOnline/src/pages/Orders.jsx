import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronRight, Search, Filter } from 'lucide-react'
import { pedidosService } from '../services/api'
import { formatCurrency } from '../utils/currency'

export default function Orders() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')

  useEffect(() => {
    loadPedidos()
  }, [])

  const loadPedidos = async () => {
    try {
      const response = await pedidosService.getAll()
      setPedidos(response.data.data.orders || [])
    } catch (error) {
      console.error('Error cargando pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const pedidosFiltrados = filtroEstado 
    ? pedidos.filter(p => p.estado === filtroEstado)
    : pedidos

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: 'bg-yellow-100 text-yellow-700',
      confirmado: 'bg-blue-100 text-blue-700',
      preparando: 'bg-purple-100 text-purple-700',
      enviado: 'bg-indigo-100 text-indigo-700',
      entregado: 'bg-green-100 text-green-700',
      cancelado: 'bg-red-100 text-red-700'
    }
    return estados[estado] || 'bg-gray-100 text-gray-700'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-8 skeleton w-48 mb-8"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!pedidos.length) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Package className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">No tienes pedidos</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">¡Realiza tu primera compra!</p>
        <Link to="/productos" className="btn btn-primary">
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mis pedidos</h1>
        
        <div className="flex items-center gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="input py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="preparando">Preparando</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {pedidosFiltrados.map((pedido) => (
          <Link
            key={pedido.id}
            to={`/pedido/${pedido.numero_pedido}`}
            className="card p-4 block hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">
                  Pedido #{pedido.numero_pedido}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(pedido.fecha_pedido)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(pedido.estado)}`}>
                {pedido.estado}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              {pedido.items?.slice(0, 3).map((item, idx) => (
                <img
                  key={idx}
                  src={item.imagen_url || 'https://via.placeholder.com/48'}
                  alt={item.producto_nombre}
                  className="w-12 h-12 object-cover rounded"
                />
              ))}
              {pedido.items?.length > 3 && (
                <span className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  +{pedido.items.length - 3}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {pedido.total_items} {pedido.total_items === 1 ? 'producto' : 'productos'}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold dark:text-white">
                  {formatCurrency(pedido.total)}
                </span>
                <ChevronRight className="text-gray-400" size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {pedidosFiltrados.length === 0 && pedidos.length > 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No hay pedidos con el estado seleccionado</p>
        </div>
      )}
    </div>
  )
}
