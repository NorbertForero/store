import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token de autorización
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Servicios específicos
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/perfil', data),
  changePassword: (data) => api.put('/auth/cambiar-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetToken: (token) => api.get(`/auth/reset-password/${token}`),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data)
}

export const productosService = {
  getAll: (params) => api.get('/productos', { params }),
  getBySlug: (slug) => api.get(`/productos/${slug}`),
  getRelacionados: (id) => api.get(`/productos/${id}/relacionados`)
}

export const categoriasService = {
  getAll: () => api.get('/categorias'),
  getBySlug: (slug) => api.get(`/categorias/${slug}`)
}

export const favoritosService = {
  getAll: () => api.get('/favoritos'),
  toggle: (productoId) => api.post(`/favoritos/toggle/${productoId}`),
  check: (productoId) => api.get(`/favoritos/check/${productoId}`)
}

export const pedidosService = {
  getAll: (params) => api.get('/pedidos', { params }),
  getByNumero: (numero) => api.get(`/pedidos/${numero}`),
  create: (data) => api.post('/pedidos', data),
  cancel: (numero, motivo) => api.post(`/pedidos/${numero}/cancelar`, { motivo }),
  getMetodosEnvio: () => api.get('/pedidos/metodos/envio'),
  getMetodosPago: () => api.get('/pedidos/metodos/pago')
}

export const configuracionService = {
  getPublica: () => api.get('/configuracion/publica'),
  getBanners: () => api.get('/configuracion/banners/activos')
}
