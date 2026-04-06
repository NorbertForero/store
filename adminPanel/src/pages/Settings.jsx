import { useState, useEffect } from 'react'
import { Save, Plus, Trash2, Loader, ToggleLeft, ToggleRight, Pencil, X } from 'lucide-react'
import { configuracionService, metodosPagoService, metodosEnvioService } from '../services/api'
import { setCurrency, formatCurrency } from '../utils/currency'
import { useConfig } from '../context/ConfigContext'

// Flatten grouped config response into { clave: valor } map
function flattenConfig(grouped) {
  const flat = {}
  for (const items of Object.values(grouped)) {
    for (const item of items) {
      flat[item.clave] = item.tipo === 'numero' ? item.valor : item.valor
    }
  }
  return flat
}

export default function Settings() {
  const { refreshConfig } = useConfig()
  const [tab, setTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const [config, setConfig] = useState({
    nombre_tienda: '',
    email_tienda: '',
    telefono_tienda: '',
    direccion_tienda: '',
    moneda: 'COP',
    simbolo_moneda: '$',
    impuesto_porcentaje: '16',
    envio_gratis_desde: '999',
    meta_titulo: '',
    meta_descripcion: ''
  })

  const [metodosPago, setMetodosPago] = useState([])
  const [metodosEnvio, setMetodosEnvio] = useState([])
  const [editingEnvio, setEditingEnvio] = useState(null)
  const [envioForm, setEnvioForm] = useState({})

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
      const grouped = response.data.data || {}
      const flat = flattenConfig(grouped)

      setConfig(prev => ({
        ...prev,
        nombre_tienda: flat.nombre_tienda || '',
        email_tienda: flat.email_tienda || '',
        telefono_tienda: flat.telefono_tienda || '',
        direccion_tienda: flat.direccion_tienda || '',
        moneda: flat.moneda || 'COP',
        simbolo_moneda: flat.simbolo_moneda || '$',
        impuesto_porcentaje: flat.impuesto_porcentaje || '16',
        envio_gratis_desde: flat.envio_gratis_desde || '999',
        meta_titulo: flat.meta_titulo || '',
        meta_descripcion: flat.meta_descripcion || ''
      }))

      setCurrency(flat.moneda || 'COP')

      // Cargar banners
      try {
        const bannersRes = await configuracionService.getBanners()
        setBanners(bannersRes.data.data || [])
      } catch (e) {
        setBanners([])
      }

      // Cargar métodos de pago y envío
      try {
        const [pagosRes, envioRes] = await Promise.all([
          metodosPagoService.getAll(),
          metodosEnvioService.getAll()
        ])
        setMetodosPago(pagosRes.data.data || [])
        setMetodosEnvio(envioRes.data.data || [])
      } catch (e) {
        setMetodosPago([])
        setMetodosEnvio([])
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
        nombre_tienda: config.nombre_tienda,
        email_tienda: config.email_tienda,
        telefono_tienda: config.telefono_tienda,
        direccion_tienda: config.direccion_tienda,
        moneda: config.moneda,
        simbolo_moneda: config.simbolo_moneda,
        impuesto_porcentaje: config.impuesto_porcentaje,
        envio_gratis_desde: config.envio_gratis_desde,
        meta_titulo: config.meta_titulo,
        meta_descripcion: config.meta_descripcion
      })
      setCurrency(config.moneda)
      await refreshConfig()
      setEditing(false)
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

  const handleToggleMetodoEnvio = async (id, activo) => {
    try {
      await metodosEnvioService.update(id, { activo: !activo ? 1 : 0 })
      setMetodosEnvio(prev => prev.map(m => m.id === id ? { ...m, activo: !activo } : m))
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error al actualizar método de envío' })
    }
  }

  const handleEditEnvio = (metodo) => {
    setEditingEnvio(metodo.id)
    setEnvioForm({
      precio: metodo.precio,
      precio_gratis_desde: metodo.precio_gratis_desde || '',
      tiempo_entrega_min: metodo.tiempo_entrega_min || '',
      tiempo_entrega_max: metodo.tiempo_entrega_max || ''
    })
  }

  const handleSaveEnvio = async (id) => {
    try {
      await metodosEnvioService.update(id, {
        precio: parseFloat(envioForm.precio) || 0,
        precio_gratis_desde: envioForm.precio_gratis_desde ? parseFloat(envioForm.precio_gratis_desde) : null,
        tiempo_entrega_min: envioForm.tiempo_entrega_min ? parseInt(envioForm.tiempo_entrega_min) : null,
        tiempo_entrega_max: envioForm.tiempo_entrega_max ? parseInt(envioForm.tiempo_entrega_max) : null
      })
      setMetodosEnvio(prev => prev.map(m => m.id === id ? {
        ...m,
        precio: parseFloat(envioForm.precio) || 0,
        precio_gratis_desde: envioForm.precio_gratis_desde ? parseFloat(envioForm.precio_gratis_desde) : null,
        tiempo_entrega_min: envioForm.tiempo_entrega_min ? parseInt(envioForm.tiempo_entrega_min) : null,
        tiempo_entrega_max: envioForm.tiempo_entrega_max ? parseInt(envioForm.tiempo_entrega_max) : null
      } : m))
      setEditingEnvio(null)
      setMensaje({ type: 'success', text: 'Método de envío actualizado' })
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error al guardar método de envío' })
    }
  }

  const handleToggleMetodoPago = async (id, activo) => {
    try {
      await metodosPagoService.updateEstado(id, !activo)
      setMetodosPago(prev => prev.map(m => m.id === id ? { ...m, activo: !activo } : m))
    } catch (error) {
      setMensaje({ type: 'error', text: 'Error al actualizar método de pago' })
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

  const monedaLabel = { COP: 'COP - Peso Colombiano', MXN: 'MXN - Peso Mexicano', USD: 'USD - Dólar US', EUR: 'EUR - Euro' }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración</h1>

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
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'general', label: 'General' },
          { id: 'envios', label: 'Envíos' },
          { id: 'pagos', label: 'Pagos' },
          { id: 'banners', label: 'Banners' },
          { id: 'seo', label: 'SEO' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setMensaje(null) }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Configuración general</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn btn-outline flex items-center gap-2 text-sm"
              >
                <Pencil size={16} />
                Editar
              </button>
            )}
            {editing && (
              <button
                onClick={() => { setEditing(false); loadConfig() }}
                className="btn btn-outline flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
              >
                <X size={16} />
                Cancelar
              </button>
            )}
          </div>

          {!editing ? (
            /* Vista de solo lectura */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Nombre de la tienda</p>
                <p className="text-gray-800 dark:text-white">{config.nombre_tienda || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Email de contacto</p>
                <p className="text-gray-800 dark:text-white">{config.email_tienda || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Teléfono</p>
                <p className="text-gray-800 dark:text-white">{config.telefono_tienda || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Moneda</p>
                <p className="text-gray-800 dark:text-white">{monedaLabel[config.moneda] || config.moneda}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Impuesto (%)</p>
                <p className="text-gray-800 dark:text-white">{config.impuesto_porcentaje}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Envío gratis desde</p>
                <p className="text-gray-800 dark:text-white">{formatCurrency(config.envio_gratis_desde)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500 mb-1">Dirección</p>
                <p className="text-gray-800 dark:text-white">{config.direccion_tienda || '—'}</p>
              </div>
            </div>
          ) : (
            /* Vista de edición */
            <>
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
                    name="email_tienda"
                    value={config.email_tienda}
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
                    name="telefono_tienda"
                    value={config.telefono_tienda}
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
                    name="impuesto_porcentaje"
                    value={config.impuesto_porcentaje}
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
                    name="envio_gratis_desde"
                    value={config.envio_gratis_desde}
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
                    name="direccion_tienda"
                    value={config.direccion_tienda}
                    onChange={handleConfigChange}
                    rows={2}
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
            </>
          )}
        </div>
      )}

      {/* Tab Métodos de Envío */}
      {tab === 'envios' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Métodos de Envío</h2>
          <p className="text-sm text-gray-500 mb-6">Configura precios, tiempos de entrega y activa o desactiva métodos.</p>
          <div className="space-y-4">
            {metodosEnvio.map((metodo) => (
              <div
                key={metodo.id}
                className={`p-4 rounded-lg border transition-colors ${
                  metodo.activo
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white">{metodo.nombre}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{metodo.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {editingEnvio !== metodo.id && (
                      <button
                        onClick={() => handleEditEnvio(metodo)}
                        className="text-gray-400 hover:text-primary-600"
                        title="Editar"
                      >
                        <Pencil size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleMetodoEnvio(metodo.id, metodo.activo)}
                      className={`flex-shrink-0 transition-colors ${
                        metodo.activo ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'
                      }`}
                      title={metodo.activo ? 'Desactivar' : 'Activar'}
                    >
                      {metodo.activo ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                    </button>
                  </div>
                </div>

                {editingEnvio === metodo.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Precio</label>
                        <input
                          type="number"
                          value={envioForm.precio}
                          onChange={(e) => setEnvioForm(f => ({ ...f, precio: e.target.value }))}
                          className="input text-sm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Gratis desde</label>
                        <input
                          type="number"
                          value={envioForm.precio_gratis_desde}
                          onChange={(e) => setEnvioForm(f => ({ ...f, precio_gratis_desde: e.target.value }))}
                          className="input text-sm"
                          min="0"
                          placeholder="Sin límite"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Días mín.</label>
                        <input
                          type="number"
                          value={envioForm.tiempo_entrega_min}
                          onChange={(e) => setEnvioForm(f => ({ ...f, tiempo_entrega_min: e.target.value }))}
                          className="input text-sm"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Días máx.</label>
                        <input
                          type="number"
                          value={envioForm.tiempo_entrega_max}
                          onChange={(e) => setEnvioForm(f => ({ ...f, tiempo_entrega_max: e.target.value }))}
                          className="input text-sm"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleSaveEnvio(metodo.id)} className="btn btn-primary text-sm">
                        <Save size={16} />
                        Guardar
                      </button>
                      <button onClick={() => setEditingEnvio(null)} className="btn btn-outline text-sm">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Precio: <strong>{parseFloat(metodo.precio) === 0 ? 'Gratis' : formatCurrency(metodo.precio)}</strong></span>
                    {metodo.precio_gratis_desde && (
                      <span>Gratis desde: <strong>{formatCurrency(metodo.precio_gratis_desde)}</strong></span>
                    )}
                    {metodo.tiempo_entrega_min && metodo.tiempo_entrega_max && (
                      <span>Entrega: <strong>{metodo.tiempo_entrega_min}-{metodo.tiempo_entrega_max} días</strong></span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {metodosEnvio.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay métodos de envío configurados</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Métodos de Pago */}
      {tab === 'pagos' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Métodos de Pago</h2>
          <p className="text-sm text-gray-500 mb-6">Activa o desactiva los métodos de pago disponibles en el checkout.</p>
          <div className="space-y-3">
            {metodosPago.map((metodo) => (
              <div
                key={metodo.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  metodo.activo
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">{metodo.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{metodo.descripcion}</p>
                  {metodo.comision_porcentaje > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Comisión: {metodo.comision_porcentaje}%
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleMetodoPago(metodo.id, metodo.activo)}
                  className={`flex-shrink-0 transition-colors ${
                    metodo.activo ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-500'
                  }`}
                  title={metodo.activo ? 'Desactivar' : 'Activar'}
                >
                  {metodo.activo ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>
            ))}
            {metodosPago.length === 0 && (
              <p className="text-gray-500 text-center py-8">No hay métodos de pago configurados</p>
            )}
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">{banner.subtitulo}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`badge ${banner.activo ? 'badge-success' : 'badge-gray'}`}>
                          {banner.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400"
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
