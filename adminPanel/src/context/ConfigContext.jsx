import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { setCurrency } from '../utils/currency'

const ConfigContext = createContext()

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({ nombre_tienda: '' })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await api.get('/api/configuracion/publica')
        const data = response.data.data
        setConfig(prev => ({ ...prev, ...data }))
        if (data?.moneda) setCurrency(data.moneda)
        if (data?.nombre_tienda) {
          document.title = `${data.nombre_tienda} - Admin`
        }
      } catch (error) {
        console.log('Usando configuración por defecto')
      }
    }
    loadConfig()
  }, [])

  const refreshConfig = async () => {
    try {
      const response = await api.get('/api/configuracion/publica')
      const data = response.data.data
      setConfig(prev => ({ ...prev, ...data }))
      if (data?.moneda) setCurrency(data.moneda)
      if (data?.nombre_tienda) {
        document.title = `${data.nombre_tienda} - Admin`
      }
    } catch (error) {
      console.log('Error recargando configuración')
    }
  }

  return (
    <ConfigContext.Provider value={{ ...config, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = () => useContext(ConfigContext)
