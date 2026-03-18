import { useState, useEffect } from 'react'
import { 
  Search, Plus, Edit2, UserCheck, UserX, 
  ChevronLeft, ChevronRight, Loader 
} from 'lucide-react'
import { usuariosService } from '../services/api'

export default function Users() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })

  const [modal, setModal] = useState({ open: false, mode: 'create', usuario: null })
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'cliente',
    activo: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsuarios()
  }, [pagination.page, filtroRol])

  const loadUsuarios = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: 15,
        search: buscar,
        role: filtroRol || undefined
      }
      const response = await usuariosService.getAll(params)
      setUsuarios(response.data.data.users || [])
      setPagination({
        page: response.data.data.pagination?.page || 1,
        total: response.data.data.pagination?.total || 0,
        totalPages: response.data.data.pagination?.totalPages || 0
      })
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => {
    setPagination(p => ({ ...p, page: 1 }))
    loadUsuarios()
  }

  const openCreateModal = () => {
    setFormData({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      password: '',
      rol: 'cliente',
      activo: true
    })
    setModal({ open: true, mode: 'create', usuario: null })
  }

  const openEditModal = (usuario) => {
    setFormData({
      nombre: usuario.nombre,
      apellidos: usuario.apellido || '', // Ajuste: usar 'apellido' del backend
      email: usuario.email,
      telefono: usuario.telefono || '',
      password: '',
      rol: usuario.rol,
      activo: usuario.activo
    })
    setModal({ open: true, mode: 'edit', usuario })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = { ...formData }
      if (!data.password) delete data.password

      if (modal.mode === 'create') {
        await usuariosService.create(data)
      } else {
        await usuariosService.update(modal.usuario.id, data)
      }

      setModal({ open: false, mode: 'create', usuario: null })
      loadUsuarios()
    } catch (error) {
      console.error('Error guardando usuario:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleEstado = async (usuario) => {
    try {
      await usuariosService.updateEstado(usuario.id, !usuario.activo)
      loadUsuarios()
    } catch (error) {
      console.error('Error actualizando estado:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRolBadge = (rol) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      vendedor: 'bg-blue-100 text-blue-800',
      cliente: 'badge-gray'
    }
    return badges[rol] || 'badge-gray'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={20} />
          Nuevo usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              placeholder="Buscar por nombre o email..."
              className="input pl-10"
            />
          </div>
          <select
            value={filtroRol}
            onChange={(e) => { setFiltroRol(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            className="select w-auto"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor</option>
            <option value="cliente">Cliente</option>
          </select>
          <button onClick={handleBuscar} className="btn btn-secondary">
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Registro</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan="6">
                      <div className="animate-pulse h-12 bg-gray-100 rounded"></div>
                    </td>
                  </tr>
                ))
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                          {usuario.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {usuario.nombre} {usuario.apellidos}
                          </p>
                          {usuario.telefono && (
                            <p className="text-xs text-gray-500">{usuario.telefono}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600">{usuario.email}</td>
                    <td>
                      <span className={`badge ${getRolBadge(usuario.rol)} capitalize`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="text-gray-600 text-sm">
                      {formatDate(usuario.fecha_registro)}
                    </td>
                    <td>
                      <span className={`badge ${usuario.activo ? 'badge-success' : 'badge-danger'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(usuario)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => toggleEstado(usuario)}
                          className={`p-1.5 rounded ${
                            usuario.activo
                              ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={usuario.activo ? 'Desactivar' : 'Activar'}
                        >
                          {usuario.activo ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {pagination.total} usuarios encontrados
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-secondary btn-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {modal.mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData(f => ({ ...f, apellidos: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData(f => ({ ...f, telefono: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {modal.mode === 'create' ? '*' : '(dejar vacío para no cambiar)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                  className="input"
                  required={modal.mode === 'create'}
                  placeholder={modal.mode === 'edit' ? '••••••••' : ''}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData(f => ({ ...f, rol: e.target.value }))}
                  className="select"
                  required
                >
                  <option value="cliente">Cliente</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData(f => ({ ...f, activo: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">Usuario activo</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, mode: 'create', usuario: null })}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? <Loader className="animate-spin" size={18} /> : null}
                  {modal.mode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
