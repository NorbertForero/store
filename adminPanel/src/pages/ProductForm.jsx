import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, Plus, X, Image, Loader, Upload } from 'lucide-react'
import { productosService, categoriasService, uploadService } from '../services/api'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const [producto, setProducto] = useState({
    nombre: '',
    descripcion: '',
    descripcion_corta: '',
    sku: '',
    precio: '',
    precio_oferta: '',
    stock: '',
    stock_minimo: '5',
    categoria_ids: [],
    marca_id: '',
    peso: '',
    dimensiones: '',
    activo: true,
    destacado: false,
    nuevo: true,
    imagenes: []
  })

  useEffect(() => {
    loadCategorias()
    if (isEdit) {
      loadProducto()
    }
  }, [id])

  const loadCategorias = async () => {
    try {
      const response = await categoriasService.getAll({ jerarquica: 'false' })
      setCategorias(response.data.data || [])
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  const loadProducto = async () => {
    try {
      const response = await productosService.getById(id)
      const prod = response.data.data
      setProducto({
        nombre: prod.nombre || '',
        descripcion: prod.descripcion || '',
        descripcion_corta: prod.descripcion_corta || '',
        sku: prod.sku || '',
        precio: prod.precio?.toString() || '',
        precio_oferta: prod.precio_oferta?.toString() || '',
        stock: prod.stock?.toString() || '',
        stock_minimo: prod.stock_minimo?.toString() || '5',
        categoria_ids: prod.categorias?.map(c => c.id) || [],
        marca_id: prod.marca_id || '',
        peso: prod.peso?.toString() || '',
        dimensiones: prod.dimensiones || '',
        activo: prod.disponible ?? true,
        destacado: prod.destacado ?? false,
        nuevo: prod.nuevo ?? false,
        imagenes: prod.imagenes || []
      })
    } catch (error) {
      console.error('Error cargando producto:', error)
      setError('No se pudo cargar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setProducto(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleCategoriaChange = (catId) => {
    setProducto(prev => ({
      ...prev,
      categoria_ids: prev.categoria_ids.includes(catId)
        ? prev.categoria_ids.filter(id => id !== catId)
        : [...prev.categoria_ids, catId]
    }))
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    for (const file of files) {
      try {
        const response = await uploadService.uploadImagen(file)
        const url = response.data.data.url
        setProducto(prev => ({
          ...prev,
          imagenes: [...prev.imagenes, { url, orden: prev.imagenes.length }]
        }))
      } catch (err) {
        setError(err.response?.data?.message || `Error al subir ${file.name}`)
      }
    }

    setUploading(false)
    e.target.value = ''
  }

  const handleRemoveImage = (index) => {
    setProducto(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const data = {
        ...producto,
        precio: parseFloat(producto.precio) || 0,
        precio_oferta: producto.precio_oferta ? parseFloat(producto.precio_oferta) : null,
        stock: parseInt(producto.stock) || 0,
        stock_minimo: parseInt(producto.stock_minimo) || 5,
        peso: producto.peso ? parseFloat(producto.peso) : null,
        marca_id: producto.marca_id || null,
        disponible: producto.activo,
        categorias: producto.categoria_ids
      }
      delete data.activo
      delete data.categoria_ids

      if (isEdit) {
        await productosService.update(id, data)
      } else {
        await productosService.create(data)
      }
      
      navigate('/productos')
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar el producto')
    } finally {
      setSaving(false)
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/productos')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Información básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={producto.nombre}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción corta</label>
              <input
                type="text"
                name="descripcion_corta"
                value={producto.descripcion_corta}
                onChange={handleChange}
                className="input"
                maxLength={255}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción completa</label>
              <textarea
                name="descripcion"
                value={producto.descripcion}
                onChange={handleChange}
                rows={4}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input
                type="text"
                name="sku"
                value={producto.sku}
                onChange={handleChange}
                className="input font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* Precio e inventario */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Precio e inventario</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
              <input
                type="number"
                name="precio"
                value={producto.precio}
                onChange={handleChange}
                className="input"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio oferta</label>
              <input
                type="number"
                name="precio_oferta"
                value={producto.precio_oferta}
                onChange={handleChange}
                className="input"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                name="stock"
                value={producto.stock}
                onChange={handleChange}
                className="input"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
              <input
                type="number"
                name="stock_minimo"
                value={producto.stock_minimo}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Categorías */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Categorías</h2>
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <label
                key={cat.id}
                className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                  producto.categoria_ids.includes(cat.id)
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={producto.categoria_ids.includes(cat.id)}
                  onChange={() => handleCategoriaChange(cat.id)}
                  className="sr-only"
                />
                {cat.categoria_padre_id ? `↳ ${cat.nombre}` : cat.nombre}
              </label>
            ))}
          </div>
        </div>

        {/* Imágenes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Imágenes</h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-secondary btn-sm"
            >
              {uploading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Subir imagen
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {producto.imagenes.map((img, idx) => (
              <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                    Principal
                  </span>
                )}
              </div>
            ))}
            {producto.imagenes.length === 0 && !uploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-200 hover:text-gray-500 transition-colors"
              >
                <Image size={40} />
                <span className="text-sm">Subir imagen</span>
              </button>
            )}
            {uploading && (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                <Loader size={32} className="animate-spin" />
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Formatos: JPEG, PNG, WebP, GIF · Máximo 5 MB por imagen · La primera imagen será la principal</p>
        </div>

        {/* Opciones */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Opciones</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="activo"
                checked={producto.activo}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Activo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="destacado"
                checked={producto.destacado}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Destacado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="nuevo"
                checked={producto.nuevo}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-gray-700 dark:text-gray-300">Nuevo</span>
            </label>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/productos')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? (
              <>
                <Loader className="animate-spin" size={18} />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEdit ? 'Actualizar' : 'Crear producto'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
