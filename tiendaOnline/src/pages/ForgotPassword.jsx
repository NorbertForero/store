import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Loader, ArrowLeft, CheckCircle } from 'lucide-react'
import { authService } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await authService.forgotPassword(email)
      setEnviado(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Revisa tu correo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Si existe una cuenta con el correo <strong className="text-gray-800 dark:text-white">{email}</strong>, 
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              El enlace expirará en 1 hora. Si no recibes el correo, revisa tu carpeta de spam.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEnviado(false)
                  setEmail('')
                }}
                className="btn btn-secondary w-full"
              >
                Enviar a otro correo
              </button>
              <Link to="/login" className="btn btn-primary w-full">
                Volver a iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
              ¿Olvidaste tu contraseña?
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Ingresa tu correo y te enviaremos instrucciones para restablecerla.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  placeholder="tu@email.com"
                  className="input pl-10"
                  required
                />
              </div>
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
                  Enviando...
                </>
              ) : (
                'Enviar instrucciones'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Recordaste tu contraseña?{' '}
            <Link 
              to="/login" 
              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
