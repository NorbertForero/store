import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionId] = useState(() => {
    let id = localStorage.getItem('sessionId')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('sessionId', id)
    }
    return id
  })

  useEffect(() => {
    loadCart()
  }, [isAuthenticated])

  const loadCart = async () => {
    try {
      setLoading(true)
      const response = await api.get('/carrito', {
        headers: { 'x-session-id': sessionId }
      })
      setCart(response.data.data)
    } catch (error) {
      console.error('Error cargando carrito:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productoId, varianteId = null, cantidad = 1) => {
    try {
      await api.post('/carrito/items', 
        { producto_id: productoId, variante_id: varianteId, cantidad },
        { headers: { 'x-session-id': sessionId } }
      )
      await loadCart()
      return { success: true, message: 'Producto agregado al carrito' }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al agregar al carrito' 
      }
    }
  }

  const updateQuantity = async (itemId, cantidad) => {
    try {
      await api.put(`/carrito/items/${itemId}`, 
        { cantidad },
        { headers: { 'x-session-id': sessionId } }
      )
      await loadCart()
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al actualizar cantidad' 
      }
    }
  }

  const removeFromCart = async (itemId) => {
    try {
      await api.delete(`/carrito/items/${itemId}`, {
        headers: { 'x-session-id': sessionId }
      })
      await loadCart()
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al eliminar del carrito' 
      }
    }
  }

  const clearCart = async () => {
    try {
      await api.delete('/carrito', {
        headers: { 'x-session-id': sessionId }
      })
      await loadCart()
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al vaciar carrito' 
      }
    }
  }

  const applyCoupon = async (codigo) => {
    try {
      const response = await api.post('/carrito/cupon', 
        { codigo },
        { headers: { 'x-session-id': sessionId } }
      )
      await loadCart()
      return { success: true, message: 'Cupón aplicado exitosamente', data: response.data.data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al aplicar cupón' 
      }
    }
  }

  const removeCoupon = async () => {
    try {
      await api.delete('/carrito/cupon', {
        headers: { 'x-session-id': sessionId }
      })
      await loadCart()
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al quitar cupón' 
      }
    }
  }

  const itemCount = cart?.items?.reduce((total, item) => total + item.cantidad, 0) || 0

  const value = {
    cart,
    loading,
    itemCount,
    sessionId,
    loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return context
}
