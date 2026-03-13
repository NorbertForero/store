import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { authService } from '../services/api'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [verificando, setVerificando] = useState(true)
  const [tokenValido, setTokenValido] = useState(false)
  const [email, setEmail] = useState('')
  
  const [datos, setDatos] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(false)

  // Verificar token al cargar
  useEffect(() => {
    const verificarToken = async () => {
      try {
        const response = await authService.verifyResetToken(token)
        setTokenValido(true)
        setEmail(response.data.data.email)
      } catch (err) {
        setTokenValido(false)
      } finally {
        setVerificando(false)
      }
    }

    verificarToken()
  }, [token])

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

    setLoading(true)
    setError(null)

    try {
      await authService.resetPassword(token, {
        password: datos.password,
        confirmPassword: datos.confirmPassword
      })
      setExito(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  // Estado de carga
  if (verificando) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <Loader className="animate-spin mx-auto text-primary-600 mb-4" size={40} />
            <p className="text-gray-600 dark:text-gray-400">Verificando enlace...</p>
          </div>
        </div>
      </div>
    )
  }

  // Token inválido o expirado
  if (!tokenValido) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="text-red-600 dark:text-red-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Enlace inválido o expirado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              El enlace para restablecer tu contraseña no es válido o ha expirado. 
              Los enlaces solo son válidos por 1 hora.
            </p>
            <div className="space-y-3">
              <Link to="/recuperar-password" className="btn btn-primary w-full">
                Solicitar nuevo enlace
              </Link>
              <Link to="/login" className="btn btn-secondary w-full">
                Volver al login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Contraseña restablecida exitosamente
  if (exito) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tu contraseña ha sido restablecida correctamente. 
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link to="/login" className="btn btn-primary w-full py-3">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Formulario de nueva contraseña
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6"
          >
            <ArrowLeft size={20} />
            Volver al login
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Nueva contraseña
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Ingresa tu nueva contraseña para <strong className="text-gray-700 dark:text-gray-300">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva contraseña
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
                  minLength={6}
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
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={datos.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  className="input pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Indicador de fortaleza */}
            {datos.password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        datos.password.length >= (i + 1) * 3
                          ? datos.password.length >= 12
                            ? 'bg-green-500'
                            : datos.password.length >= 8
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {datos.password.length < 6
                    ? 'Muy corta'
                    : datos.password.length < 8
                    ? 'Débil'
                    : datos.password.length < 12
                    ? 'Aceptable'
                    : 'Fuerte'}
                </p>
              </div>
            )}

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
                  Actualizando...
                </>
              ) : (
                'Restablecer contraseña'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
