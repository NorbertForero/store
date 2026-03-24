import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  CreditCard, Truck, MapPin, Check, ChevronRight, 
  ShieldCheck, Tag, ArrowLeft, Loader 
} from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { pedidosService } from '../services/api'
import { formatCurrency } from '../utils/currency'

export default function Checkout() {
  const { cart, loading: cartLoading, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metodosPago, setMetodosPago] = useState([])
  const [metodosEnvio, setMetodosEnvio] = useState([])
  
  const [datos, setDatos] = useState({
    // Dirección de envío
    nombre: user?.nombre || '',
    apellidos: user?.apellidos || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    direccion: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    ciudad: '',
    estado: '',
    codigo_postal: '',
    referencias: '',
    // Envío y pago
    metodo_envio_id: '',
    metodo_pago_id: '',
    notas: ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout')
      return
    }
    loadMetodos()
  }, [isAuthenticated])

  useEffect(() => {
    if (user) {
      setDatos(prev => ({
        ...prev,
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        telefono: user.telefono || ''
      }))
    }
  }, [user])

  const loadMetodos = async () => {
    try {
      // Cargar métodos desde la API
      const [envioRes, pagoRes] = await Promise.all([
        pedidosService.getMetodosEnvio(),
        pedidosService.getMetodosPago()
      ])
      setMetodosEnvio(envioRes.data.data || [])
      setMetodosPago(pagoRes.data.data || [])
    } catch (error) {
      console.error('Error cargando métodos:', error)
      // Fallback a datos locales si la API falla
      setMetodosPago([
        { id: 1, nombre: 'Tarjeta de crédito/débito', codigo: 'tarjeta', activo: true },
        { id: 2, nombre: 'PayPal', codigo: 'paypal', activo: true },
        { id: 3, nombre: 'Transferencia bancaria', codigo: 'transferencia', activo: true },
        { id: 4, nombre: 'Pago contra entrega', codigo: 'contraentrega', activo: true }
      ])
      setMetodosEnvio([
        { id: 1, nombre: 'Envío estándar', codigo: 'estandar', precio: 99, precio_gratis_desde: 999, tiempo_entrega_min: 5, tiempo_entrega_max: 7, activo: true },
        { id: 2, nombre: 'Envío express', codigo: 'express', precio: 199, precio_gratis_desde: 1999, tiempo_entrega_min: 2, tiempo_entrega_max: 3, activo: true },
        { id: 3, nombre: 'Recoger en tienda', codigo: 'recoger', precio: 0, tiempo_entrega_min: 1, tiempo_entrega_max: 2, activo: true }
      ])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setDatos(prev => ({ ...prev, [name]: value }))
  }

  const validarPaso1 = () => {
    const requeridos = ['nombre', 'apellidos', 'email', 'telefono', 'direccion', 'ciudad', 'estado', 'codigo_postal']
    return requeridos.every(campo => datos[campo]?.trim())
  }

  const validarPaso2 = () => {
    return datos.metodo_envio_id && datos.metodo_pago_id
  }

  const envioSeleccionado = metodosEnvio.find(m => m.id === Number(datos.metodo_envio_id))
  // Calcular costo de envío considerando envío gratis
  const subtotalNum = parseFloat(cart?.subtotal) || 0
  const totalCarrito = parseFloat(cart?.total) || 0
  const costoEnvio = envioSeleccionado 
    ? (envioSeleccionado.precio_gratis_desde && subtotalNum >= parseFloat(envioSeleccionado.precio_gratis_desde) 
        ? 0 
        : parseFloat(envioSeleccionado.precio) || 0)
    : 0
  const totalFinal = totalCarrito + costoEnvio

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const pedidoData = {
        direccion_envio: {
          nombre: datos.nombre,
          apellidos: datos.apellidos,
          telefono: datos.telefono,
          direccion: datos.direccion,
          numero_exterior: datos.numero_exterior,
          numero_interior: datos.numero_interior,
          colonia: datos.colonia,
          ciudad: datos.ciudad,
          estado: datos.estado,
          codigo_postal: datos.codigo_postal,
          referencias: datos.referencias
        },
        metodo_envio_id: Number(datos.metodo_envio_id),
        metodo_pago_id: Number(datos.metodo_pago_id),
        notas: datos.notas
      }

      const response = await pedidosService.create(pedidoData)
      await clearCart()
      navigate(`/pedido/${response.data.data.numero_pedido}`, { 
        state: { nuevo: true } 
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el pedido')
    } finally {
      setLoading(false)
    }
  }

  if (cartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="animate-spin text-primary-600" size={40} />
        </div>
      </div>
    )
  }

  if (!cart?.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Tu carrito está vacío</h2>
        <Link to="/productos" className="btn btn-primary">Ver productos</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb / Pasos */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[
          { num: 1, label: 'Envío', icon: MapPin },
          { num: 2, label: 'Pago', icon: CreditCard },
          { num: 3, label: 'Confirmar', icon: Check }
        ].map((item, idx) => (
          <div key={item.num} className="flex items-center">
            <button
              onClick={() => item.num < paso && setPaso(item.num)}
              disabled={item.num > paso}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                paso === item.num 
                  ? 'bg-primary-600 text-white' 
                  : paso > item.num 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}
            >
              {paso > item.num ? (
                <Check size={18} />
              ) : (
                <item.icon size={18} />
              )}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
            {idx < 2 && <ChevronRight className="text-gray-300 mx-2" size={20} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <div className="lg:col-span-2">
          {/* Paso 1: Dirección de envío */}
          {paso === 1 && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <MapPin className="text-primary-600" />
                Dirección de envío
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={datos.nombre}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    name="apellidos"
                    value={datos.apellidos}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={datos.email}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={datos.telefono}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección *</label>
                  <input
                    type="text"
                    name="direccion"
                    value={datos.direccion}
                    onChange={handleChange}
                    placeholder="Calle"
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número exterior</label>
                  <input
                    type="text"
                    name="numero_exterior"
                    value={datos.numero_exterior}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número interior</label>
                  <input
                    type="text"
                    name="numero_interior"
                    value={datos.numero_interior}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colonia</label>
                  <input
                    type="text"
                    name="colonia"
                    value={datos.colonia}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ciudad *</label>
                  <input
                    type="text"
                    name="ciudad"
                    value={datos.ciudad}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado *</label>
                  <input
                    type="text"
                    name="estado"
                    value={datos.estado}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código postal *</label>
                  <input
                    type="text"
                    name="codigo_postal"
                    value={datos.codigo_postal}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referencias</label>
                  <textarea
                    name="referencias"
                    value={datos.referencias}
                    onChange={handleChange}
                    rows={2}
                    className="input"
                    placeholder="Indicaciones para el repartidor..."
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Link to="/carrito" className="btn btn-secondary">
                  <ArrowLeft size={18} />
                  Volver al carrito
                </Link>
                <button
                  onClick={() => setPaso(2)}
                  disabled={!validarPaso1()}
                  className="btn btn-primary"
                >
                  Continuar
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Método de envío y pago */}
          {paso === 2 && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <Truck className="text-primary-600" />
                  Método de envío
                </h2>
                <div className="space-y-3">
                  {metodosEnvio.map((metodo) => (
                    <label
                      key={metodo.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                        Number(datos.metodo_envio_id) === metodo.id
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="metodo_envio_id"
                          value={metodo.id}
                          checked={Number(datos.metodo_envio_id) === metodo.id}
                          onChange={handleChange}
                          className="text-primary-600"
                        />
                        <div>
                          <p className="font-medium dark:text-white">{metodo.nombre}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {metodo.tiempo_entrega_min && metodo.tiempo_entrega_max 
                              ? `${metodo.tiempo_entrega_min}-${metodo.tiempo_entrega_max} días hábiles`
                              : metodo.descripcion || ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {metodo.precio === 0 ? (
                          <span className="font-semibold text-green-600 dark:text-green-400">Gratis</span>
                        ) : metodo.precio_gratis_desde && (cart?.subtotal || 0) >= metodo.precio_gratis_desde ? (
                          <div>
                            <span className="font-semibold text-green-600 dark:text-green-400">¡Gratis!</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-through">{formatCurrency(metodo.precio)}</p>
                          </div>
                        ) : (
                          <span className="font-semibold dark:text-white">{formatCurrency(metodo.precio)}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <CreditCard className="text-primary-600" />
                  Método de pago
                </h2>
                <div className="space-y-3">
                  {metodosPago.map((metodo) => (
                    <label
                      key={metodo.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        Number(datos.metodo_pago_id) === metodo.id
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="metodo_pago_id"
                        value={metodo.id}
                        checked={Number(datos.metodo_pago_id) === metodo.id}
                        onChange={handleChange}
                        className="text-primary-600 mr-3"
                      />
                      <span className="font-medium dark:text-white">{metodo.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setPaso(1)} className="btn btn-secondary">
                  <ArrowLeft size={18} />
                  Atrás
                </button>
                <button
                  onClick={() => setPaso(3)}
                  disabled={!validarPaso2()}
                  className="btn btn-primary"
                >
                  Revisar pedido
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación */}
          {paso === 3 && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Confirmar pedido</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Dirección de envío</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {datos.nombre} {datos.apellidos}<br />
                      {datos.direccion} {datos.numero_exterior} {datos.numero_interior}<br />
                      {datos.colonia && `${datos.colonia}, `}{datos.ciudad}, {datos.estado}<br />
                      CP: {datos.codigo_postal}<br />
                      Tel: {datos.telefono}
                    </p>
                    <button 
                      onClick={() => setPaso(1)} 
                      className="text-sm text-primary-600 hover:underline mt-2"
                    >
                      Editar
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Envío y pago</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Envío:</strong> {envioSeleccionado?.nombre}<br />
                      <strong>Pago:</strong> {metodosPago.find(m => m.id === Number(datos.metodo_pago_id))?.nombre}
                    </p>
                    <button 
                      onClick={() => setPaso(2)} 
                      className="text-sm text-primary-600 hover:underline mt-2"
                    >
                      Editar
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas adicionales (opcional)
                    </label>
                    <textarea
                      name="notas"
                      value={datos.notas}
                      onChange={handleChange}
                      rows={2}
                      className="input"
                      placeholder="Instrucciones especiales para tu pedido..."
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button onClick={() => setPaso(2)} className="btn btn-secondary">
                    <ArrowLeft size={18} />
                    Atrás
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-primary py-3 px-8"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={18} />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        Confirmar y pagar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Resumen</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.imagen || '/placeholder.svg'}
                    alt={item.producto_nombre}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 dark:text-white">{item.producto_nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cant: {item.cantidad}</p>
                  </div>
                  <span className="text-sm font-medium dark:text-white">
                    {formatCurrency(parseFloat(item.precio_unitario) * item.cantidad)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t dark:border-gray-700 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="dark:text-white">{formatCurrency(subtotalNum)}</span>
              </div>
              {parseFloat(cart.descuento) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Tag size={14} />Descuento</span>
                  <span>-{formatCurrency(cart.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Envío</span>
                <span className="dark:text-white">
                  {costoEnvio === 0 ? 'Gratis' : formatCurrency(costoEnvio)}
                </span>
              </div>
              {parseFloat(cart.impuestos) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Impuestos (IVA)</span>
                  <span className="dark:text-white">{formatCurrency(cart.impuestos)}</span>
                </div>
              )}
            </div>

            <div className="border-t dark:border-gray-700 pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span className="dark:text-white">Total</span>
                <span className="dark:text-white">{formatCurrency(totalFinal)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
              <ShieldCheck size={18} />
              <span>Compra 100% segura</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
