import { useState, useEffect } from 'react'
import { 
  Search, Filter, AlertTriangle, Plus, Minus, 
  Download, ChevronLeft, ChevronRight, Loader 
} from 'lucide-react'
import { inventarioService, productosService } from '../services/api'

export default function Inventory() {
  const [productos, setProductos] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('todos')
  const [buscar, setBuscar] = useState('')
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  
  const [modal, setModal] = useState({ open: false, producto: null })
  const [movimiento, setMovimiento] = useState({ tipo: 'entrada', cantidad: '', motivo: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [tab, pagination.page])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'alertas') {
        const response = await inventarioService.getAlertas()
        setAlertas(response.data.data || [])
      } else {
        const params = {
          page: pagination.page,
          limit: 20,
          search: buscar,
          lowStock: tab === 'bajo' ? true : undefined
        }
        const response = await inventarioService.getAll(params)
        setProductos(response.data.data.products || [])
        setPagination({
          page: response.data.data.pagination?.page || 1,
          total: response.data.data.pagination?.total || 0,
          totalPages: response.data.data.pagination?.totalPages || 0
        })
      }
    } catch (error) {
      console.error('Error cargando inventario:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = () => {
    setPagination(p => ({ ...p, page: 1 }))
    loadData()
  }

  const openMovimientoModal = (producto) => {
    setModal({ open: true, producto })
    setMovimiento({ tipo: 'entrada', cantidad: '', motivo: '' })
  }

  const handleMovimiento = async () => {
    if (!movimiento.cantidad || parseInt(movimiento.cantidad) <= 0) return
    setSaving(true)

    try {
      await inventarioService.registrarMovimiento({
        producto_id: modal.producto.id,
        tipo: movimiento.tipo,
        cantidad: parseInt(movimiento.cantidad),
        motivo: movimiento.motivo
      })
      setModal({ open: false, producto: null })
      loadData()
    } catch (error) {
      console.error('Error registrando movimiento:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async (format) => {
    try {
      const response = await inventarioService.export(format)
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventario.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando:', error)
    }
  }

  const renderProductos = () => {
    const items = tab === 'alertas' ? alertas : productos

    if (loading) {
      return (
        <div className="p-8 text-center">
          <Loader className="animate-spin text-primary-600 mx-auto" size={40} />
        </div>
      )
    }

    if (items.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          {tab === 'alertas' ? 'No hay productos con stock bajo' : 'No se encontraron productos'}
        </div>
      )
    }

    return (
      <table className="table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Stock actual</th>
            <th>Stock mínimo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="flex items-center gap-3">
                  <img
                    src={item.imagen_principal || 'https://via.placeholder.com/40'}
                    alt=""
                    className="w-10 h-10 object-cover rounded"
                  />
                  <span className="font-medium">{item.nombre || item.producto_nombre}</span>
                </div>
              </td>
              <td className="font-mono text-sm">{item.sku}</td>
              <td>
                <span className={`font-semibold ${
                  item.stock === 0 ? 'text-red-600' :
                  item.stock <= (item.stock_minimo || 5) ? 'text-yellow-600' :
                  'text-gray-800'
                }`}>
                  {item.stock}
                </span>
              </td>
              <td className="text-gray-600 dark:text-gray-400">{item.stock_minimo || 5}</td>
              <td>
                {item.stock === 0 ? (
                  <span className="badge badge-danger">Agotado</span>
                ) : item.stock <= (item.stock_minimo || 5) ? (
                  <span className="badge badge-warning">Stock bajo</span>
                ) : (
                  <span className="badge badge-success">Normal</span>
                )}
              </td>
              <td>
                <div className="flex gap-2">
                  <button
                    onClick={() => openMovimientoModal({ ...item, id: item.producto_id || item.id })}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus size={14} />
                    <Minus size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventario</h1>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="btn btn-secondary">
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'bajo', label: 'Stock bajo' },
          { id: 'alertas', label: 'Alertas' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPagination(p => ({ ...p, page: 1 })) }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              tab === t.id 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.id === 'alertas' && alertas.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                {alertas.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      {tab !== 'alertas' && (
        <div className="card p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                placeholder="Buscar productos..."
                className="input pl-10"
              />
            </div>
            <button onClick={handleBuscar} className="btn btn-secondary">
              <Filter size={18} />
              Buscar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card">
        <div className="table-container">
          {renderProductos()}
        </div>

        {/* Paginación */}
        {tab !== 'alertas' && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Página {pagination.page} de {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={18} />
              </button>
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

      {/* Modal de movimiento */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Movimiento de inventario
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Producto: <strong>{modal.producto?.nombre || modal.producto?.producto_nombre}</strong>
              <br />
              Stock actual: <strong>{modal.producto?.stock}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={movimiento.tipo}
                  onChange={(e) => setMovimiento(m => ({ ...m, tipo: e.target.value }))}
                  className="select"
                >
                  <option value="entrada">Entrada (aumentar)</option>
                  <option value="salida">Salida (disminuir)</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  value={movimiento.cantidad}
                  onChange={(e) => setMovimiento(m => ({ ...m, cantidad: e.target.value }))}
                  className="input"
                  min="1"
                  placeholder="Cantidad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={movimiento.motivo}
                  onChange={(e) => setMovimiento(m => ({ ...m, motivo: e.target.value }))}
                  className="input"
                  placeholder="Ej: Reposición de stock"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModal({ open: false, producto: null })}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleMovimiento}
                disabled={saving || !movimiento.cantidad}
                className="btn btn-primary"
              >
                {saving ? <Loader className="animate-spin" size={18} /> : null}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
