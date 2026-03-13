import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Lock, Save, Loader, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/api'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('perfil')
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const [datos, setDatos] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: ''
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [direcciones, setDirecciones] = useState([])

  useEffect(() => {
    if (user) {
      setDatos({
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        telefono: user.telefono || ''
      })
      setDirecciones(user.direcciones || [])
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setDatos(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswords(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitPerfil = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensaje(null)

    try {
      await authService.updateProfile(datos)
      await updateProfile(datos)
      setMensaje({ type: 'success', text: 'Perfil actualizado correctamente' })
    } catch (error) {
      setMensaje({ type: 'error', text: error.response?.data?.message || 'Error al actualizar' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPassword = async (e) => {
    e.preventDefault()
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMensaje({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    if (passwords.newPassword.length < 6) {
      setMensaje({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
      return
    }

    setLoading(true)
    setMensaje(null)

    try {
      await authService.changePassword({
        passwordActual: passwords.currentPassword,
        passwordNuevo: passwords.newPassword
      })
      setMensaje({ type: 'success', text: 'Contraseña cambiada correctamente' })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setMensaje({ type: 'error', text: error.response?.data?.message || 'Error al cambiar contraseña' })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'perfil', label: 'Mi perfil', icon: User },
    { id: 'seguridad', label: 'Seguridad', icon: Lock },
    { id: 'direcciones', label: 'Direcciones', icon: MapPin }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Mi cuenta</h1>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg ${
          mensaje.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {mensaje.text}
        </div>
      )}

      {/* Contenido de tabs */}
      {activeTab === 'perfil' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Información personal</h2>
          <form onSubmit={handleSubmitPerfil} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    name="nombre"
                    value={datos.nombre}
                    onChange={handleChange}
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={datos.apellidos}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={datos.email}
                  onChange={handleChange}
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="telefono"
                  value={datos.telefono}
                  onChange={handleChange}
                  className="input pl-10"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar cambios
            </button>
          </form>

          <div className="mt-8 pt-6 border-t dark:border-gray-700">
            <Link to="/pedidos" className="flex items-center gap-2 text-primary-600 hover:text-primary-700">
              <Package size={18} />
              Ver mis pedidos
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'seguridad' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Cambiar contraseña</h2>
          <form onSubmit={handleSubmitPassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña actual</label>
              <input
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva contraseña</label>
              <input
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                className="input"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                className="input"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <Loader className="animate-spin" size={18} /> : <Lock size={18} />}
              Cambiar contraseña
            </button>
          </form>
        </div>
      )}

      {activeTab === 'direcciones' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-6">Mis direcciones</h2>
          
          {direcciones.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No tienes direcciones guardadas</p>
          ) : (
            <div className="space-y-4">
              {direcciones.map((dir) => (
                <div key={dir.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      {dir.es_principal && (
                        <span className="badge badge-primary text-xs mb-2">Principal</span>
                      )}
                      <p className="font-medium dark:text-white">{dir.nombre}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dir.direccion} {dir.numero_exterior} {dir.numero_interior}<br />
                        {dir.colonia && `${dir.colonia}, `}{dir.ciudad}, {dir.estado}<br />
                        CP: {dir.codigo_postal}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
