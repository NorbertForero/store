import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  DollarSign, ShoppingCart, Package, Users, 
  TrendingUp, TrendingDown, AlertTriangle, Eye
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { dashboardService, inventarioService, pedidosService } from '../services/api'
import { formatCurrency, formatNumber } from '../utils/currency'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [alertas, setAlertas] = useState([])
  const [ultimosPedidos, setUltimosPedidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      // Simulamos datos de estadísticas ya que el endpoint aún no existe
      setStats({
        ventas: { total: 125840, cambio: 12.5 },
        pedidos: { total: 156, cambio: 8.2 },
        productos: { total: 342, cambio: 2.1 },
        usuarios: { total: 1250, cambio: 15.3 },
        ventasMensuales: [
          { mes: 'Ene', ventas: 12000 },
          { mes: 'Feb', ventas: 15000 },
          { mes: 'Mar', ventas: 18000 },
          { mes: 'Abr', ventas: 14000 },
          { mes: 'May', ventas: 21000 },
          { mes: 'Jun', ventas: 25000 },
          { mes: 'Jul', ventas: 20840 }
        ]
      })

      // Cargar alertas de inventario
      try {
        const alertasRes = await inventarioService.getAlertas()
        setAlertas(alertasRes.data.data?.slice(0, 5) || [])
      } catch (e) {
        setAlertas([])
      }

      // Cargar últimos pedidos
      try {
        const pedidosRes = await pedidosService.getAll({ limit: 5 })
        setUltimosPedidos(pedidosRes.data.data?.pedidos || [])
      } catch (e) {
        setUltimosPedidos([])
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, change, icon: Icon, color, prefix = '' }) => (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {prefix}{formatNumber(value)}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(change)}% vs mes anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas del mes"
          value={stats?.ventas?.total}
          change={stats?.ventas?.cambio}
          icon={DollarSign}
          color="bg-green-500"
          prefix="$"
        />
        <StatCard
          title="Pedidos"
          value={stats?.pedidos?.total}
          change={stats?.pedidos?.cambio}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Productos"
          value={stats?.productos?.total}
          change={stats?.productos?.cambio}
          icon={Package}
          color="bg-purple-500"
        />
        <StatCard
          title="Usuarios"
          value={stats?.usuarios?.total}
          change={stats?.usuarios?.cambio}
          icon={Users}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfica de ventas */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ventas mensuales</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.ventasMensuales || []}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Ventas']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ventas" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorVentas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas de inventario */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Alertas de stock</h2>
            <Link to="/inventario" className="text-sm text-primary-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {alertas.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay alertas de stock bajo
            </p>
          ) : (
            <div className="space-y-3">
              {alertas.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.producto_nombre}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Stock: {item.stock} unidades
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos pedidos */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Últimos pedidos</h2>
            <Link to="/pedidos" className="text-sm text-primary-600 hover:underline">
              Ver todos
            </Link>
          </div>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ultimosPedidos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay pedidos recientes
                  </td>
                </tr>
              ) : (
                ultimosPedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td className="font-medium">#{pedido.numero_pedido}</td>
                    <td>{pedido.cliente_nombre}</td>
                    <td>{formatCurrency(pedido.total)}</td>
                    <td>
                      <span className={`badge ${
                        pedido.estado === 'entregado' ? 'badge-success' :
                        pedido.estado === 'enviado' ? 'badge-info' :
                        pedido.estado === 'cancelado' ? 'badge-danger' :
                        'badge-warning'
                      } capitalize`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={`/pedidos/${pedido.id}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
