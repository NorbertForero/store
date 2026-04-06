import { Link } from 'react-router-dom'
import {
  Facebook, Twitter, Instagram, Youtube,
  Mail, Phone, MapPin, CreditCard, Truck, Shield
} from 'lucide-react'
import { useConfig } from '../context/ConfigContext'

export default function Footer() {
  const { nombre_tienda } = useConfig()
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Beneficios */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <Truck size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Envío Gratis</h4>
                <p className="text-sm">En compras mayores a $999</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <CreditCard size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Pago Seguro</h4>
                <p className="text-sm">Múltiples métodos de pago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Garantía</h4>
                <p className="text-sm">30 días de devolución</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Sobre Nosotros */}
          <div>
            <h3 className="text-white font-semibold mb-4">Sobre Nosotros</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/quienes-somos" className="hover:text-white transition-colors">
                  Quiénes Somos
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/trabaja-con-nosotros" className="hover:text-white transition-colors">
                  Trabaja con Nosotros
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-white font-semibold mb-4">Ayuda</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/preguntas-frecuentes" className="hover:text-white transition-colors">
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link to="/envios" className="hover:text-white transition-colors">
                  Envíos
                </Link>
              </li>
              <li>
                <Link to="/devoluciones" className="hover:text-white transition-colors">
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link to="/metodos-pago" className="hover:text-white transition-colors">
                  Métodos de Pago
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terminos" className="hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link to="/privacidad" className="hover:text-white transition-colors">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-white transition-colors">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Phone size={18} />
                <span>+57 310 885 4472</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={18} />
                <span>contacto@nforero.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={18} className="flex-shrink-0 mt-1" />
                <span>Calle Principal 123, Ciudad, Bogotá</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">
              © {new Date().getFullYear()} {nombre_tienda || 'Tienda Online'}. Todos los derechos reservados.
            </p>

            {/* Redes sociales */}
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Youtube">
                <Youtube size={20} />
              </a>
            </div>

            {/* Métodos de pago */}
            <div className="flex items-center gap-2 text-sm">
              <span>Pagos seguros:</span>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">VISA</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">MC</span>
                <span className="px-2 py-1 bg-gray-800 rounded text-xs">PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
