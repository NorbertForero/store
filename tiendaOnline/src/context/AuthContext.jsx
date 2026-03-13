import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const loadUser = async () => {
    try {
      const response = await api.get('/auth/perfil')
      setUser(response.data.data)
    } catch (error) {
      console.error('Error cargando usuario:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      return { success: true, user: userData }
    } catch (error) {
      console.error('Error en login:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Credenciales incorrectas' 
      }
    }
  }

  const register = async (data) => {
    try {
      const response = await api.post('/auth/registro', data)
      const { token: newToken, user: userData } = response.data.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      return { success: true, user: userData }
    } catch (error) {
      console.error('Error en registro:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al crear la cuenta' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const updateProfile = async (data) => {
    const response = await api.put('/auth/perfil', data)
    await loadUser()
    return response.data
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    loadUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
