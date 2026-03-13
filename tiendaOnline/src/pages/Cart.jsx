import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Minus, Plus, ShoppingBag, Tag, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { formatCurrency } from '../utils/currency'

export default function Cart() {
  const { cart, loading, updateQuantity, removeFromCart, applyCoupon, removeCoupon } = useCart()
  const [codigoDescuento, setCodigoDescuento] = useState('')
  const [aplicandoCupon, setAplicandoCupon] = useState(false)
  const [mensajeCupon, setMensajeCupon] = useState(null)
  const navigate = useNavigate()

  const handleUpdateQuantity = async (itemId, cantidad) => {
    await updateQuantity(itemId, cantidad)
  }

  const handleRemoveItem = async (itemId) => {
    await removeFromCart(itemId)
  }

  const handleApplyCoupon = async () => {
    if (!codigoDescuento.trim()) return
    setAplicandoCupon(true)
    const result = await applyCoupon(codigoDescuento.trim())
    setMensajeCupon(result)
    setTimeout(() => setMensajeCupon(null), 3000)
    if (result.success) setCodigoDescuento('')
    setAplicandoCupon(false)
  }

  const handleRemoveCoupon = async () => {
    await removeCoupon()
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-8 skeleton w-48 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32"></div>
            ))}
          </div>
          <div className="skeleton h-64"></div>
        </div>
      </div>
    )
  }

  if (!cart?.items?.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center bg-gray-50 dark:bg-gray-900 min-h-[60vh] transition-colors">
        <ShoppingBag className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">¡Agrega productos para comenzar tu compra!</p>
        <Link to="/productos" className="btn btn-primary">
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
        Carrito de compras ({cart.items.length} {cart.items.length === 1 ? 'producto' : 'productos'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items del carrito */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="card p-4 flex gap-4">
              <Link to={`/producto/${item.producto_slug}`} className="w-24 h-24 flex-shrink-0">
                <img
                  src={item.imagen_url || 'https://via.placeholder.com/96'}
                  alt={item.producto_nombre}
                  className="w-full h-full object-cover rounded-lg"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link 
                  to={`/producto/${item.producto_slug}`}
                  className="font-medium text-gray-800 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
                >
                  {item.producto_nombre}
                </Link>
                {item.variante_nombre && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.variante_nombre}</p>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      disabled={item.cantidad <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center text-sm dark:text-gray-200">{item.cantidad}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
                      className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {formatCurrency(parseFloat(item.precio_unitario) * item.cantidad)}
                    </p>
                    {item.cantidad > 1 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.precio_unitario)} c/u
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemoveItem(item.id)}
                className="self-start p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Resumen del pedido</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium dark:text-white">
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>

              {parseFloat(cart.descuento) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag size={14} />
                    Descuento
                  </span>
                  <span>-{formatCurrency(cart.descuento)}</span>
                </div>
              )}

              {/* Aplicar cupón */}
              {!cart.cupon && (
                <div className="pt-3 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={codigoDescuento}
                      onChange={(e) => setCodigoDescuento(e.target.value.toUpperCase())}
                      placeholder="Código de descuento"
                      className="input flex-1 text-sm"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={aplicandoCupon || !codigoDescuento}
                      className="btn btn-secondary text-sm px-3"
                    >
                      {aplicandoCupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {mensajeCupon && (
                    <p className={`text-xs mt-2 ${mensajeCupon.success ? 'text-green-600' : 'text-red-600'}`}>
                      {mensajeCupon.message}
                    </p>
                  )}
                </div>
              )}

              {/* Cupón aplicado */}
              {cart.cupon && (
                <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg">
                  <span className="text-sm text-green-700 flex items-center gap-1">
                    <Tag size={14} />
                    {cart.cupon.codigo}
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * El envío se calculará en el checkout
              </p>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary w-full mt-6 py-3"
            >
              Proceder al pago
              <ArrowRight size={18} />
            </button>

            <Link 
              to="/productos" 
              className="block text-center text-sm text-primary-600 hover:text-primary-700 mt-4"
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
