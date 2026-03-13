import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, Image, Loader } from 'lucide-react'
import { configuracionService } from '../services/api'
import { setCurrency } from '../utils/currency'

export default function Settings() {
  const [tab, setTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const [config, setConfig] = useState({
    nombre_tienda: '',
    descripcion: '',
    email_contacto: '',
    telefono: '',
    direccion: '',
    moneda: 'COP',
    impuesto: '16',
    envio_gratis_minimo: '999',
    meta_titulo: '',
    meta_descripcion: ''
  })

  const [banners, setBanners] = useState([])
  const [nuevoBanner, setNuevoBanner] = useState({
    titulo: '',
    subtitulo: '',
    imagen_url: '',
    enlace: '',
    activo: true
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await configuracionService.getAll()
      const configData = response.data.data || {}
      setConfig({
        nombre_tienda: configData.nombre_tienda || 'Mi Tienda',
        descripcion: configData.descripcion || '',
        email_contacto: configData.email_contacto || '',
        telefono: configData.telefono || '',
        direccion: configData.direccion || '',
        moneda: configData.moneda || 'COP',
        impuesto: configData.impuesto?.toString() || '16',
        envio_gratis_minimo: configData.envio_gratis_minimo?.toString() || '999',
        meta_titulo: configData.meta_titulo || '',
        meta_descripcion: configData.meta_descripcion || ''
      })
      
      // Sincronizar moneda con el sistema
      setCurrency(configData.moneda || 'COP')

      // Cargar banners
      try {
        const bannersRes = await configuracionService.getBanners()
        setBanners(bannersRes.data.data || [])
      } catch (e) {
        setBanners([])
      }
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfigChange = (e) => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    setMensaje(null)

    try {
      await configuracionService.update({
        ...config,
        impuesto: parseFloat(config.impuesto) || 16,
        envio_gratis_minimo: parseFloat(config.envio_gratis_minimo) || 999
      })
      // Actualizar moneda en el sistema
      setCurrency(config.moneda)
      setMensaje({ type: 'success', text: 'Configuración guardada correctamente' })
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error al guardar la configuración' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddBanner = async () => {
    if (!nuevoBanner.imagen_url) return
    
    try {
      await configuracionService.createBanner(nuevoBanner)
      setNuevoBanner({ titulo: '', subtitulo: '', imagen_url: '', enlace: '', activo: true })
      loadConfig()
    } catch (error) {
      console.error('Error creando banner:', error)
    }
  }

  const handleDeleteBanner = async (id) => {
    try {
      await configuracionService.deleteBanner(id)
      loadConfig()
    } catch (error) {
      console.error('Error eliminando banner:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-600" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>

      {/* Mensaje */}
      {mensaje && (
        <div className={`p-4 rounded-lg ${
          mensaje.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'general', label: 'General' },
          { id: 'banners', label: 'Banners' },
          { id: 'seo', label: 'SEO' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tab === t.id 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab General */}
      {tab === 'general' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Configuración general</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la tienda
              </label>
              <input
                type="text"
                name="nombre_tienda"
                value={config.nombre_tienda}
                onChange={handleConfigChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contacto
              </label>
              <input
                type="email"
                name="email_contacto"
                value={config.email_contacto}
                onChange={handleConfigChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={config.telefono}
                onChange={handleConfigChange}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moneda
              </label>
              <select
                name="moneda"
                value={config.moneda}
                onChange={handleConfigChange}
                className="select"
              >
                <option value="COP">COP - Peso Colombiano</option>
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="USD">USD - Dólar US</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impuesto (%)
              </label>
              <input
                type="number"
                name="impuesto"
                value={config.impuesto}
                onChange={handleConfigChange}
                className="input"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Envío gratis desde ($)
              </label>
              <input
                type="number"
                name="envio_gratis_minimo"
                value={config.envio_gratis_minimo}
                onChange={handleConfigChange}
                className="input"
                min="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <textarea
                name="direccion"
                value={config.direccion}
                onChange={handleConfigChange}
                rows={2}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción de la tienda
              </label>
              <textarea
                name="descripcion"
                value={config.descripcion}
                onChange={handleConfigChange}
                rows={3}
                className="input"
              />
            </div>
          </div>
          <div className="mt-6">
            <button onClick={handleSaveConfig} disabled={saving} className="btn btn-primary">
              {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar cambios
            </button>
          </div>
        </div>
      )}

      {/* Tab Banners */}
      {tab === 'banners' && (
        <div className="space-y-6">
          {/* Lista de banners */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Banners activos</h2>
            {banners.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay banners configurados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={banner.imagen_url} 
                      alt={banner.titulo} 
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <p className="font-medium">{banner.titulo || 'Sin título'}</p>
                      <p className="text-sm text-gray-500">{banner.subtitulo}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`badge ${banner.activo ? 'badge-success' : 'badge-gray'}`}>
                          {banner.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agregar banner */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Agregar banner</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  type="text"
                  value={nuevoBanner.titulo}
                  onChange={(e) => setNuevoBanner(b => ({ ...b, titulo: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={nuevoBanner.subtitulo}
                  onChange={(e) => setNuevoBanner(b => ({ ...b, subtitulo: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen *</label>
                <input
                  type="url"
                  value={nuevoBanner.imagen_url}
                  onChange={(e) => setNuevoBanner(b => ({ ...b, imagen_url: e.target.value }))}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enlace</label>
                <input
                  type="text"
                  value={nuevoBanner.enlace}
                  onChange={(e) => setNuevoBanner(b => ({ ...b, enlace: e.target.value }))}
                  className="input"
                  placeholder="/productos o URL externa"
                />
              </div>
            </div>
            <button
              onClick={handleAddBanner}
              disabled={!nuevoBanner.imagen_url}
              className="btn btn-primary mt-4"
            >
              <Plus size={18} />
              Agregar banner
            </button>
          </div>
        </div>
      )}

      {/* Tab SEO */}
      {tab === 'seo' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Configuración SEO</h2>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta título
              </label>
              <input
                type="text"
                name="meta_titulo"
                value={config.meta_titulo}
                onChange={handleConfigChange}
                className="input"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1">
                {config.meta_titulo.length}/60 caracteres
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta descripción
              </label>
              <textarea
                name="meta_descripcion"
                value={config.meta_descripcion}
                onChange={handleConfigChange}
                rows={3}
                className="input"
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {config.meta_descripcion.length}/160 caracteres
              </p>
            </div>
          </div>
          <div className="mt-6">
            <button onClick={handleSaveConfig} disabled={saving} className="btn btn-primary">
              {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
