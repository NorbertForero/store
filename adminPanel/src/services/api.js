import axios from 'axios'

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Servicios específicos
export const dashboardService = {
  getStats: () => api.get('/api/configuracion/dashboard')
}

export const uploadService = {
  uploadImagen: (file) => {
    const formData = new FormData()
    formData.append('imagen', file)
    return api.post('/api/uploads/imagen', formData, {
      headers: { 'Content-Type': undefined }
    })
  }
}

export const productosService = {
  getAll: (params) => api.get('/api/productos', { params }),
  getById: (id) => api.get(`/api/productos/${id}`),
  create: (data) => api.post('/api/productos', data),
  update: (id, data) => api.put(`/api/productos/${id}`, data),
  delete: (id) => api.delete(`/api/productos/${id}`),
  updateStock: (id, data) => api.patch(`/api/productos/${id}/stock`, data)
}

export const categoriasService = {
  getAll: (params) => api.get('/api/categorias', { params }),
  create: (data) => api.post('/api/categorias', data),
  update: (id, data) => api.put(`/api/categorias/${id}`, data),
  delete: (id) => api.delete(`/api/categorias/${id}`)
}

export const pedidosService = {
  getAll: (params) => api.get('/api/pedidos/admin/todos', { params }),
  getById: (numeroPedido) => api.get(`/api/pedidos/${numeroPedido}`),
  updateEstado: (id, data) => api.put(`/api/pedidos/admin/${id}/estado`, data)
}

export const inventarioService = {
  getAll: (params) => api.get('/api/inventario', { params }),
  getAlertas: () => api.get('/api/inventario/alertas'),
  registrarMovimiento: (data) => api.post('/api/inventario/movimiento', data),
  export: (format) => api.get(`/api/inventario/exportar?formato=${format}`, { responseType: 'blob' })
}

export const usuariosService = {
  getAll: (params) => api.get('/api/usuarios', { params }),
  getById: (id) => api.get(`/api/usuarios/${id}`),
  create: (data) => api.post('/api/usuarios', data),
  update: (id, data) => api.put(`/api/usuarios/${id}`, data),
  updateEstado: (id, activo) => api.patch(`/api/usuarios/${id}/estado`, { activo })
}

export const configuracionService = {
  getAll: () => api.get('/api/configuracion'),
  update: (data) => api.put('/api/configuracion', data),
  getBanners: () => api.get('/api/configuracion/banners'),
  createBanner: (data) => api.post('/api/configuracion/banners', data),
  deleteBanner: (id) => api.delete(`/api/configuracion/banners/${id}`)
}
