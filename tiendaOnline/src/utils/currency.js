// Configuraciones de moneda disponibles
export const CURRENCIES = {
  COP: {
    code: 'COP',
    symbol: '$',
    locale: 'es-CO',
    decimals: 0,
    name: 'Peso Colombiano'
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    locale: 'es-MX',
    decimals: 2,
    name: 'Peso Mexicano'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    decimals: 2,
    name: 'Dólar US'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    locale: 'es-ES',
    decimals: 2,
    name: 'Euro'
  }
}

// Moneda actual (se puede cambiar dinámicamente)
let currentCurrency = 'COP'

/**
 * Establecer la moneda actual
 * @param {string} currencyCode - Código de moneda (COP, MXN, USD, EUR)
 */
export const setCurrency = (currencyCode) => {
  if (CURRENCIES[currencyCode]) {
    currentCurrency = currencyCode
    // Guardar en localStorage para persistencia
    localStorage.setItem('currency', currencyCode)
  }
}

/**
 * Obtener la configuración de moneda actual
 */
export const getCurrencyConfig = () => {
  return CURRENCIES[currentCurrency] || CURRENCIES.COP
}

/**
 * Inicializar moneda desde localStorage o configuración
 */
export const initCurrency = () => {
  const saved = localStorage.getItem('currency')
  if (saved && CURRENCIES[saved]) {
    currentCurrency = saved
  }
}

// Inicializar al cargar
initCurrency()

/**
 * Formatea un número como moneda
 * @param {number} value - El valor a formatear
 * @param {boolean} showDecimals - Mostrar decimales (por defecto según config)
 * @returns {string} - Valor formateado con símbolo de moneda
 */
export const formatCurrency = (value, showDecimals = null) => {
  const config = getCurrencyConfig()
  const numValue = Number(value)

  if (value === null || value === undefined || isNaN(numValue)) {
    return `${config.symbol} 0`
  }

  const useDecimals = showDecimals !== null ? showDecimals : config.decimals > 0
  const options = {
    minimumFractionDigits: useDecimals ? config.decimals : 0,
    maximumFractionDigits: useDecimals ? config.decimals : 0
  }

  return `${config.symbol} ${numValue.toLocaleString(config.locale, options)}`
}

/**
 * Formatea un número como moneda sin símbolo
 * @param {number} value - El valor a formatear
 * @param {boolean} showDecimals - Mostrar decimales
 * @returns {string} - Valor formateado sin símbolo
 */
export const formatNumber = (value, showDecimals = null) => {
  const config = getCurrencyConfig()
  const numValue = Number(value)

  if (value === null || value === undefined || isNaN(numValue)) {
    return '0'
  }

  const useDecimals = showDecimals !== null ? showDecimals : config.decimals > 0
  const options = {
    minimumFractionDigits: useDecimals ? config.decimals : 0,
    maximumFractionDigits: useDecimals ? config.decimals : 0
  }

  return numValue.toLocaleString(config.locale, options)
}
