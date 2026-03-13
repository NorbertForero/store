import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await api.get('/api/auth/perfil')
        const userData = response.data.data
        if (userData.rol === 'admin' || userData.rol === 'vendedor') {
          setUser(userData)
        } else {
          localStorage.removeItem('admin_token')
        }
      } catch (error) {
        localStorage.removeItem('admin_token')
        delete api.defaults.headers.common['Authorization']
      }
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user: usuario } = response.data.data
      
      if (usuario.rol !== 'admin' && usuario.rol !== 'vendedor') {
        return { success: false, message: 'No tienes permisos de administrador' }
      }

      localStorage.setItem('admin_token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(usuario)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.rol === 'admin',
      isVendedor: user?.rol === 'vendedor',
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
