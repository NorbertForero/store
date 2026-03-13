import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader, AlertCircle, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [datos, setDatos] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [modalError, setModalError] = useState({ open: false, message: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setDatos(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (datos.password !== datos.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (datos.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (!aceptaTerminos) {
      setError('Debes aceptar los términos y condiciones')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await register({
        nombre: datos.nombre,
        apellido: datos.apellidos,
        email: datos.email,
        telefono: datos.telefono,
        password: datos.password
      })
      
      if (result.success) {
        navigate('/')
      } else {
        // Si el error es de usuario ya existente, mostrar modal
        if (result.message?.toLowerCase().includes('email') || 
            result.message?.toLowerCase().includes('registrado') ||
            result.message?.toLowerCase().includes('existe')) {
          setModalError({ open: true, message: result.message })
        } else {
          setError(result.message)
        }
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Crear cuenta</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Únete a nuestra tienda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="nombre"
                    value={datos.nombre}
                    onChange={handleChange}
                    placeholder="Juan"
                    className="input pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={datos.apellidos}
                  onChange={handleChange}
                  placeholder="Pérez"
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={datos.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  name="telefono"
                  value={datos.telefono}
                  onChange={handleChange}
                  placeholder="55 1234 5678"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={datos.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={datos.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terminos"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 mt-1 mr-2"
              />
              <label htmlFor="terminos" className="text-sm text-gray-600 dark:text-gray-400">
                Acepto los{' '}
                <Link to="/terminos" className="text-primary-600 dark:text-primary-400 hover:underline">
                  términos y condiciones
                </Link>{' '}
                y la{' '}
                <Link to="/privacidad" className="text-primary-600 dark:text-primary-400 hover:underline">
                  política de privacidad
                </Link>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Creando cuenta...
                </>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <Link 
              to={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`} 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de error - Usuario ya existe */}
      {modalError.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Usuario ya registrado
                </h3>
              </div>
              <button
                onClick={() => setModalError({ open: false, message: '' })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {modalError.message || 'El correo electrónico ya está registrado en nuestra tienda.'}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setModalError({ open: false, message: '' })}
                className="btn btn-secondary flex-1"
              >
                Intentar con otro
              </button>
              <Link
                to={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
                className="btn btn-primary flex-1 text-center"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
