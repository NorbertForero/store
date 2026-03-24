import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { 
  Package, Truck, MapPin, CreditCard, Check, 
  Clock, ChevronRight, ArrowLeft, CheckCircle 
} from 'lucide-react'
import { pedidosService } from '../services/api'
import { formatCurrency } from '../utils/currency'

export default function OrderDetail() {
  const { numeroPedido } = useParams()
  const location = useLocation()
  const esNuevo = location.state?.nuevo
  
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPedido()
  }, [numeroPedido])

  const loadPedido = async () => {
    try {
      const response = await pedidosService.getByNumero(numeroPedido)
      setPedido(response.data.data)
    } catch (error) {
      console.error('Error cargando pedido:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const estadosPedido = [
    { key: 'pendiente', label: 'Pendiente', icon: Clock },
    { key: 'confirmado', label: 'Confirmado', icon: Check },
    { key: 'preparando', label: 'Preparando', icon: Package },
    { key: 'enviado', label: 'Enviado', icon: Truck },
    { key: 'entregado', label: 'Entregado', icon: CheckCircle }
  ]

  const getEstadoIndex = (estado) => {
    if (estado === 'cancelado') return -1
    return estadosPedido.findIndex(e => e.key === estado)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="skeleton h-8 w-48 mb-8"></div>
        <div className="skeleton h-96 rounded-xl"></div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Pedido no encontrado</h2>
        <Link to="/pedidos" className="btn btn-primary">Ver mis pedidos</Link>
      </div>
    )
  }

  const estadoActualIndex = getEstadoIndex(pedido.estado)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Mensaje de éxito para pedido nuevo */}
      {esNuevo && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
          <CheckCircle size={24} />
          <div>
            <p className="font-semibold">¡Pedido realizado con éxito!</p>
            <p className="text-sm">Te enviaremos un correo con los detalles.</p>
          </div>
        </div>
      )}

      <Link to="/pedidos" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6">
        <ArrowLeft size={20} />
        Volver a mis pedidos
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Pedido #{pedido.numero_pedido}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Realizado el {formatDate(pedido.fecha_pedido)}
          </p>
        </div>
        {pedido.estado === 'cancelado' ? (
          <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium">
            Cancelado
          </span>
        ) : null}
      </div>

      {/* Timeline del estado */}
      {pedido.estado !== 'cancelado' && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-6">Estado del pedido</h2>
          <div className="flex items-center justify-between relative">
            {/* Línea de progreso */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 z-0"></div>
            <div 
              className="absolute top-5 left-0 h-1 bg-primary-600 z-0 transition-all duration-500"
              style={{ width: `${(estadoActualIndex / (estadosPedido.length - 1)) * 100}%` }}
            ></div>

            {estadosPedido.map((estado, idx) => {
              const isCompleted = idx <= estadoActualIndex
              const isCurrent = idx === estadoActualIndex
              return (
                <div key={estado.key} className="flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-primary-100 dark:ring-primary-900' : ''}`}>
                    <estado.icon size={20} />
                  </div>
                  <span className={`text-xs font-medium ${
                    isCompleted ? 'text-primary-600' : 'text-gray-400'
                  }`}>
                    {estado.label}
                  </span>
                </div>
              )
            })}
          </div>

          {pedido.numero_guia && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Número de guía</p>
              <p className="font-mono font-semibold dark:text-white">{pedido.numero_guia}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Dirección de envío */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="text-primary-600" size={20} />
            Dirección de envío
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {pedido.direccion_envio?.nombre} {pedido.direccion_envio?.apellidos}<br />
            {pedido.direccion_envio?.direccion} {pedido.direccion_envio?.numero_exterior}<br />
            {pedido.direccion_envio?.colonia && `${pedido.direccion_envio.colonia}, `}
            {pedido.direccion_envio?.ciudad}, {pedido.direccion_envio?.estado}<br />
            CP: {pedido.direccion_envio?.codigo_postal}
          </p>
        </div>

        {/* Método de pago */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <CreditCard className="text-primary-600" size={20} />
            Método de pago
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {pedido.metodo_pago?.nombre || 'Método de pago'}
          </p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            Estado: <span className="capitalize">{pedido.estado_pago || 'Pendiente'}</span>
          </p>
        </div>
      </div>

      {/* Productos */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Productos ({pedido.items?.length})</h2>
        <div className="divide-y dark:divide-gray-700">
          {pedido.items?.map((item) => (
            <div key={item.id} className="py-4 flex gap-4">
              <img
                src={item.imagen_url || '/placeholder.svg'}
                alt={item.producto_nombre}
                className="w-20 h-20 object-cover rounded-lg"
                onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
              />
              <div className="flex-1">
                <Link 
                  to={`/producto/${item.producto_slug}`}
                  className="font-medium text-gray-800 dark:text-white hover:text-primary-600"
                >
                  {item.producto_nombre}
                </Link>
                {item.variante_nombre && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.variante_nombre}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">Cantidad: {item.cantidad}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold dark:text-white">
                  {formatCurrency(item.precio_unitario * item.cantidad)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(item.precio_unitario)} c/u
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-4">Resumen del pedido</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="dark:text-white">{formatCurrency(pedido.subtotal)}</span>
          </div>
          {pedido.descuento > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>-{formatCurrency(pedido.descuento)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Envío</span>
            <span className="dark:text-white">
              {pedido.costo_envio === 0 
                ? 'Gratis' 
                : formatCurrency(pedido.costo_envio)
              }
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t dark:border-gray-700">
            <span className="dark:text-white">Total</span>
            <span className="dark:text-white">{formatCurrency(pedido.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
