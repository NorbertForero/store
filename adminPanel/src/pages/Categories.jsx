import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ChevronRight, Loader } from 'lucide-react'
import { categoriasService } from '../services/api'

export default function Categories() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, mode: 'create', categoria: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, categoria: null })
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    imagen_url: '',
    categoria_padre_id: '',
    orden: 0,
    activa: true
  })

  useEffect(() => {
    loadCategorias()
  }, [])

  const loadCategorias = async () => {
    try {
      const response = await categoriasService.getAll()
      setCategorias(response.data.data || [])
    } catch (error) {
      console.error('Error cargando categorías:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = (padreId = null) => {
    setFormData({
      nombre: '',
      descripcion: '',
      imagen_url: '',
      categoria_padre_id: padreId || '',
      orden: 0,
      activa: true
    })
    setModal({ open: true, mode: 'create', categoria: null })
  }

  const openEditModal = (categoria) => {
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      imagen_url: categoria.imagen_url || '',
      categoria_padre_id: categoria.categoria_padre_id || '',
      orden: categoria.orden || 0,
      activa: categoria.activa ?? true
    })
    setModal({ open: true, mode: 'edit', categoria })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const data = {
        ...formData,
        categoria_padre_id: formData.categoria_padre_id || null,
        orden: parseInt(formData.orden) || 0
      }

      if (modal.mode === 'create') {
        await categoriasService.create(data)
      } else {
        await categoriasService.update(modal.categoria.id, data)
      }

      setModal({ open: false, mode: 'create', categoria: null })
      loadCategorias()
    } catch (error) {
      console.error('Error guardando categoría:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.categoria) return
    try {
      await categoriasService.delete(deleteModal.categoria.id)
      loadCategorias()
    } catch (error) {
      console.error('Error eliminando categoría:', error)
    }
    setDeleteModal({ open: false, categoria: null })
  }

  // Organizar categorías en árbol
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.categoria_padre_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }))
  }

  const categoriasArbol = buildTree(categorias)

  const CategoryItem = ({ categoria, level = 0 }) => (
    <>
      <tr className={level > 0 ? 'bg-gray-50/50' : ''}>
        <td>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            {level > 0 && <ChevronRight size={16} className="text-gray-400" />}
            <span className="font-medium text-gray-800">{categoria.nombre}</span>
          </div>
        </td>
        <td className="text-gray-600 max-w-xs truncate">{categoria.descripcion || '-'}</td>
        <td>
          <span className={`badge ${categoria.activa ? 'badge-success' : 'badge-gray'}`}>
            {categoria.activa ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td className="text-gray-600">{categoria.total_productos || 0}</td>
        <td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreateModal(categoria.id)}
              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
              title="Agregar subcategoría"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => openEditModal(categoria)}
              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
              title="Editar"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => setDeleteModal({ open: true, categoria })}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
              title="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </td>
      </tr>
      {categoria.children?.map(child => (
        <CategoryItem key={child.id} categoria={child} level={level + 1} />
      ))}
    </>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-primary-600" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
        <button onClick={() => openCreateModal()} className="btn btn-primary">
          <Plus size={20} />
          Nueva categoría
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Productos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categoriasArbol.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No hay categorías
                  </td>
                </tr>
              ) : (
                categoriasArbol.map(cat => (
                  <CategoryItem key={cat.id} categoria={cat} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {modal.mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(f => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen</label>
                <input
                  type="url"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData(f => ({ ...f, imagen_url: e.target.value }))}
                  className="input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría padre</label>
                <select
                  value={formData.categoria_padre_id}
                  onChange={(e) => setFormData(f => ({ ...f, categoria_padre_id: e.target.value }))}
                  className="select"
                >
                  <option value="">Ninguna (categoría principal)</option>
                  {categorias
                    .filter(c => c.id !== modal.categoria?.id)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.activa}
                  onChange={(e) => setFormData(f => ({ ...f, activa: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600"
                />
                <label htmlFor="activa" className="text-sm text-gray-700">Categoría activa</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, mode: 'create', categoria: null })}
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

      {/* Modal eliminar */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">¿Eliminar categoría?</h3>
            <p className="text-gray-600 mb-6">
              Esta acción eliminará "{deleteModal.categoria?.nombre}" y todas sus subcategorías.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, categoria: null })}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
