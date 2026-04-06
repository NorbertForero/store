import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Package, Truck, MapPin, CreditCard, 
  User, Clock, Save, Loader, CheckCircle
} from 'lucide-react'
import { pedidosService } from '../services/api'
import { formatCurrency } from '../utils/currency'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [numeroGuia, setNumeroGuia] = useState('')

  useEffect(() => {
    loadPedido()
  }, [id])

  const loadPedido = async () => {
    try {
      const response = await pedidosService.getById(id)
      const data = response.data.data
      setPedido(data)
      setNuevoEstado(data.estado)
      setNumeroGuia(data.numero_guia || '')
    } catch (error) {
      console.error('Error cargando pedido:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEstado = async () => {
    setSaving(true)
    try {
      await pedidosService.updateEstado(pedido.id, {
        estado: nuevoEstado,
        tracking: nuevoEstado === 'enviado' ? numeroGuia : undefined
      })
      loadPedido()
    } catch (error) {
      console.error('Error actualizando estado:', error)
    } finally {
      setSaving(false)
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

  const estados = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'preparando', label: 'Preparando' },
    { value: 'enviado', label: 'Enviado' },
    { value: 'entregado', label: 'Entregado' },
    { value: 'cancelado', label: 'Cancelado' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-600" size={40} />
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Pedido no encontrado</h2>
        <button onClick={() => navigate('/pedidos')} className="btn btn-primary">
          Volver a pedidos
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/pedidos')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Pedido #{pedido.numero_pedido}</h1>
          <p className="text-gray-500 dark:text-gray-400">{formatDate(pedido.fecha_pedido)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Productos */}
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Package size={20} className="text-primary-600" />
                Productos ({pedido.items?.length})
              </h2>
            </div>
            <div className="divide-y">
              {pedido.items?.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <img
                    src={item.imagen_url || '/placeholder.svg'}
                    alt={item.producto_nombre}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-white">{item.producto_nombre}</p>
                    {item.variante_nombre && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.variante_nombre}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Cantidad: {item.cantidad} × {formatCurrency(item.precio_unitario)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.cantidad * item.precio_unitario)}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span>{formatCurrency(pedido.subtotal)}</span>
              </div>
              {pedido.descuento > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Descuento</span>
                  <span>-{formatCurrency(pedido.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Envío</span>
                <span>
                  {pedido.costo_envio === 0 ? 'Gratis' : formatCurrency(pedido.costo_envio)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(pedido.total)}</span>
              </div>
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin size={20} className="text-primary-600" />
              Dirección de envío
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-800 dark:text-white">
                {pedido.direccion_envio?.nombre} {pedido.direccion_envio?.apellidos}
              </p>
              <p>{pedido.direccion_envio?.direccion} {pedido.direccion_envio?.numero_exterior}</p>
              {pedido.direccion_envio?.colonia && <p>{pedido.direccion_envio.colonia}</p>}
              <p>{pedido.direccion_envio?.ciudad}, {pedido.direccion_envio?.estado}</p>
              <p>CP: {pedido.direccion_envio?.codigo_postal}</p>
              <p>Tel: {pedido.direccion_envio?.telefono}</p>
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Estado del pedido */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-primary-600" />
              Estado del pedido
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="select"
                >
                  {estados.map((est) => (
                    <option key={est.value} value={est.value}>{est.label}</option>
                  ))}
                </select>
              </div>

              {nuevoEstado === 'enviado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de guía
                  </label>
                  <input
                    type="text"
                    value={numeroGuia}
                    onChange={(e) => setNumeroGuia(e.target.value)}
                    className="input"
                    placeholder="Ingresa el número de guía"
                  />
                </div>
              )}

              <button
                onClick={handleUpdateEstado}
                disabled={saving || nuevoEstado === pedido.estado}
                className="btn btn-primary w-full"
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Actualizar estado
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cliente */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User size={20} className="text-primary-600" />
              Cliente
            </h2>
            <div className="text-sm">
              <p className="font-medium text-gray-800 dark:text-white">{pedido.cliente_nombre}</p>
              <p className="text-gray-600 dark:text-gray-400">{pedido.cliente_email}</p>
              {pedido.cliente_telefono && (
                <p className="text-gray-600 dark:text-gray-400">Tel: {pedido.cliente_telefono}</p>
              )}
            </div>
          </div>

          {/* Pago */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard size={20} className="text-primary-600" />
              Información de pago
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Método</span>
                <span className="font-medium">{pedido.metodo_pago?.nombre || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Estado</span>
                <span className={`badge ${
                  pedido.estado_pago === 'pagado' ? 'badge-success' :
                  pedido.estado_pago === 'fallido' ? 'badge-danger' :
                  'badge-warning'
                } capitalize`}>
                  {pedido.estado_pago || 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Envío */}
          <div className="card p-4">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Truck size={20} className="text-primary-600" />
              Envío
            </h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Método</span>
                <span className="font-medium">{pedido.metodo_envio?.nombre || '-'}</span>
              </div>
              {pedido.numero_guia && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Guía</span>
                  <span className="font-mono">{pedido.numero_guia}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
