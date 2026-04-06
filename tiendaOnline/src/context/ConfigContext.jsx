import { createContext, useContext, useState, useEffect } from 'react'
import { configuracionService } from '../services/api'
import { setCurrency } from '../utils/currency'

const ConfigContext = createContext()

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    nombre_tienda: '',
    moneda: 'COP',
    simbolo_moneda: '$',
    email_tienda: '',
    telefono_tienda: '',
    direccion_tienda: ''
  })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await configuracionService.getPublica()
        const data = response.data.data
        setConfig(prev => ({ ...prev, ...data }))
        if (data?.moneda) {
          setCurrency(data.moneda)
        }
        if (data?.nombre_tienda) {
          document.title = data.nombre_tienda
        }
      } catch (error) {
        console.log('Usando configuración por defecto')
      }
    }
    loadConfig()
  }, [])

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = () => useContext(ConfigContext)
