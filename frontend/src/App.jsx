import adminNotificationSound from './assets/mrfriends-pistol-shot-233473.mp3'
import { M } from './messages'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiBarChart2,
  FiBell,
  FiChevronRight,
  FiCreditCard,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiFileText,
  FiGlobe,
  FiHelpCircle,
  FiHome,
  FiInfo,
  FiLogOut,
  FiMessageCircle,
  FiRefreshCw,
  FiSearch,
  FiSettings,
  FiShield,
  FiTrendingDown,
  FiTrendingUp,
  FiUpload,
  FiUser,
  FiXCircle,
} from 'react-icons/fi'
import { AiOutlineIdcard } from 'react-icons/ai'
import { BsArrowDownLeftCircle, BsArrowUpRightCircle, BsCashCoin, BsClipboard2Check } from 'react-icons/bs'
import { FaBitcoin, FaDollarSign, FaTelegramPlane, FaUserTie } from 'react-icons/fa'
import { MdOutlineAccountBalanceWallet, MdOutlineVerifiedUser } from 'react-icons/md'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const TELEGRAM_URL = 'https://t.me/Manage_digifinex'
const TELEGRAM_LABEL = '@Manage_digifinex'

const IMAGE_BASE = 'https://dg.houtai.xyz/uploads/20250823'
const DIGIFINEX_LOGO = `${IMAGE_BASE}/780d452e8991897bbc5d68aaea949c98.png`
const BANNERS = [
  `${IMAGE_BASE}/75e9001b962425c80fc93fee2bbf53da.jpg`,
  `${IMAGE_BASE}/77885f7af684a8d2013b88ced2b923e3.png`,
  `${IMAGE_BASE}/d27a15d82b9ea17dde5ccba671482bc2.png`,
]

const BINANCE_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT', 'LINKUSDT', 'AVAXUSDT', 'LTCUSDT', 'DOTUSDT', 'BCHUSDT', 'ATOMUSDT']
const WS_BASE = 'wss://stream.binance.com:9443/ws'
const MARKET_SAMPLE_MS = 60 * 1000

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

async function apiRequest(url, options = {}) {
  const method = options.method || 'GET'
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  if (method !== 'GET') headers['X-CSRFToken'] = getCsrfToken()
  const response = await fetch(url, { credentials: 'same-origin', ...options, headers })
  let data = {}
  try { data = await response.json() } catch (_) {}
  if (!response.ok) throw new Error(data.error || 'Request failed')
  return data
}

function money(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

const APP_TIME_ZONE = 'America/New_York'

function formatNewYorkParts(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return null

  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value
    return acc
  }, {})

  return parts
}

function formatAppDateTime(value) {
  const parts = formatNewYorkParts(value)
  if (!parts) return ''
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
}

function formatAppTime(value) {
  const parts = formatNewYorkParts(value)
  if (!parts) return '--:--:--'
  return `${parts.hour}:${parts.minute}:${parts.second}`
}

function formatOrderPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.000000'
  return n.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })
}

function orderNumber(item) {
  const market = String(item.market_name || 'XAU/USD').replace(/[^a-z0-9]/gi, '').toUpperCase() || 'ORDER'
  const source = `${item.id}-${item.user_id}-${item.created_at}-${item.market_name}`
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let hash = 0
  for (let i = 0; i < source.length; i += 1) hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  let suffix = ''
  for (let i = 0; i < 8; i += 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0
    suffix += alphabet[hash % alphabet.length]
  }
  return `${market}${suffix}`
}

const marketProducts = [
  { name: 'XAU/USD', code: 'XAUUSD', apiSymbol: 'BTCUSDT', volume: '3248.49', price: '4155.1312', meta: '-53.30', change: '-1.27%', trend: 'up' },
  { name: 'GBP/AUD', code: 'GBPAUD', apiSymbol: 'ETHUSDT', volume: '1.8536', price: '1.88300756186', meta: '0.00', change: '0%', trend: 'up' },
  { name: 'NZD/USD', code: 'NZDUSD', apiSymbol: 'BNBUSDT', volume: '0.5578', price: '0.57398', meta: '-0.00', change: '-0.23%', trend: 'up' },
  { name: 'XAG/USD', code: 'XAGUSD', apiSymbol: 'SOLUSDT', volume: '35.26', price: '64.7708', meta: '-0.91', change: '-1.4%', trend: 'up' },
  { name: 'GBP/JPY', code: 'UKOIL', apiSymbol: 'XRPUSDT', volume: '58.72', price: '79.6401', meta: '0.74', change: '+0.94%', trend: 'down' },
  { name: 'USD/SGD', code: 'XAGUSD', apiSymbol: 'ADAUSDT', volume: '35.26', price: '64.7708', meta: '-0.91', change: '-1.4%', trend: 'up' },
  { name: 'Nasdaq Futures', code: 'NASUS', apiSymbol: 'DOGEUSDT', volume: '8.8', price: '10.6035', meta: '-0.09', change: '-0.86%', trend: 'up' },
  { name: 'US Index', code: 'UKOIL', apiSymbol: 'TRXUSDT', volume: '58.72', price: '79.6401', meta: '0.74', change: '+0.94%', trend: 'down' },
  { name: 'AUD/CAD', code: 'AUDCAD', apiSymbol: 'LINKUSDT', volume: '0.8789', price: '0.99107251', meta: '0.00', change: '+0.03%', trend: 'down' },
  { name: 'EUR/GBP', code: 'EURGBP', apiSymbol: 'AVAXUSDT', volume: '0.5421', price: '0.8665', meta: '-0.00', change: '-0.1%', trend: 'up' },
  { name: 'AUD/JPY', code: 'AUDJPY', apiSymbol: 'LTCUSDT', volume: '0.6671', price: '113.04816099677', meta: '-0.10', change: '-0.09%', trend: 'up' },
  { name: 'EUR/JPY', code: 'EURJPY', apiSymbol: 'DOTUSDT', volume: '0.8420', price: '184.5906', meta: '-0.28', change: '-0.16%', trend: 'up' },
  { name: 'HKD/JPY', code: 'HKDJPY', apiSymbol: 'BCHUSDT', volume: '0.9188', price: '20.57690344975', meta: '-0.01', change: '-0.07%', trend: 'up' },
  { name: 'USD/RUB', code: 'USDRUB', apiSymbol: 'ATOMUSDT', volume: '44.00', price: '73.8999', meta: '0.44', change: '+0.61%', trend: 'down' },
]

const futuresList = [
  { name: 'XAU/USD', volume: '3248.49', price: '4156.1013', change: '-1.24%', positive: false },
  { name: 'GBP/AUD', volume: '1.8536', price: '1.88257954054', change: '-0.02%', positive: false },
  { name: 'NZD/USD', volume: '0.5578', price: '0.57353', change: '-0.31%', positive: false },
  { name: 'XAG/USD', volume: '35.26', price: '64.76', change: '-1.42%', positive: false },
  { name: 'GBP/JPY', volume: '58.72', price: '79.5782', change: '+0.86%', positive: true },
  { name: 'USD/SGD', volume: '35.26', price: '64.76', change: '-1.42%', positive: false },
  { name: 'NasdaqFutures', volume: '8.8', price: '10.6035', change: '-0.86%', positive: false },
  { name: 'USIndex', volume: '58.72', price: '79.5782', change: '+0.86%', positive: true },
  { name: 'AUD/CAD', volume: '0.8789', price: '0.99107243', change: '+0.03%', positive: true },
  { name: 'EUR/GBP', volume: '0.5421', price: '0.8667', change: '-0.09%', positive: false },
]

const accountRows = [
  { label: 'Yu’ ebao', icon: MdOutlineAccountBalanceWallet, page: 'savings', accent: 'green' },
  { label: 'Order Record', icon: FiFileText, page: 'orders', accent: 'blue' },
  { label: 'Deposit Details', icon: BsArrowDownLeftCircle, page: 'depositDetails', accent: 'blue' },
  { label: 'Withdrawal Details', icon: BsArrowUpRightCircle, page: 'withdrawDetails', accent: 'blue' },
  { label: 'Capital Record', icon: BsCashCoin, page: 'capital', accent: 'pink' },
  { label: 'Withdrawal Account', icon: FiDownload, page: 'withdrawAccount', accent: 'cyan' },
  { label: 'Settings', icon: FiSettings, page: 'settings', accent: 'violet' },
  { label: 'Real Name Verification', icon: AiOutlineIdcard, page: 'verify', accent: 'orange' },
  { label: 'Log Out', icon: FiLogOut, page: 'login', accent: 'cyan' },
]


function prettySymbol(symbol = 'BTCUSDT') {
  if (symbol.endsWith('USDT')) return `${symbol.replace('USDT', '')}/USDT`
  if (symbol.endsWith('BTC')) return `${symbol.replace('BTC', '')}/BTC`
  return symbol
}

function formatPrice(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0.0000'
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n >= 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 })
}

function formatCompact(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  return n.toFixed(2)
}

function toMarketRow(raw, index = 0) {
  const base = marketProducts[index] || marketProducts[0]
  const symbol = raw.symbol || raw.s || base?.apiSymbol || BINANCE_SYMBOLS[index] || 'BTCUSDT'
  const price = raw.lastPrice || raw.c || raw.price || base?.price || '0'
  const changeValue = raw.priceChangePercent ?? raw.P ?? String(base?.change || '0').replace('%', '')
  const change = Number(changeValue)
  const volume = raw.volume || raw.v || base?.volume || '0'
  const isPositive = Number.isFinite(change) && change >= 0
  return {
    ...base,
    symbol,
    name: base?.name || prettySymbol(symbol),
    code: base?.code || symbol,
    apiSymbol: symbol,
    price: formatPrice(price),
    rawPrice: Number(price) || Number(base?.price || 0) || 0,
    meta: formatCompact(raw.priceChange || raw.p || base?.meta || 0),
    change: `${isPositive ? '+' : ''}${Number.isFinite(change) ? change.toFixed(2) : '0.00'}%`,
    trend: isPositive ? 'up' : 'down',
    volume: formatCompact(volume),
    positive: isPositive,
    highPrice: raw.highPrice || raw.h,
    lowPrice: raw.lowPrice || raw.l,
    quoteVolume: raw.quoteVolume || raw.q,
  }
}


function varyPercentText(percentText, tick = 0, index = 0) {
  const base = Number(String(percentText || '0').replace('%', ''))
  const safeBase = Number.isFinite(base) ? base : 0
  const wave = Math.sin((tick + 1) * 0.73 + index * 1.91) * 0.035
  const micro = Math.cos((tick + 1) * 0.41 + index * 0.67) * 0.015
  const value = safeBase + wave + micro
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

function withLivePercent(rows = [], tick = 0) {
  return rows.map((item, index) => {
    const liveChange = varyPercentText(item.change, tick, index)
    const positive = Number(String(liveChange).replace('%', '')) >= 0
    return {
      ...item,
      change: liveChange,
      positive,
      trend: positive ? 'up' : 'down',
    }
  })
}

function clampPricePrecision(basePrice, value) {
  const original = String(basePrice || '')
  const decimals = original.includes('.') ? Math.min(Math.max(original.split('.')[1].length, 2), 10) : 2
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function buildMiniPoints(seed = 1, positive = true) {
  const values = Array.from({ length: 12 }, (_, i) => {
    const wave = Math.sin(seed * 0.91 + i * 0.78) * 7
    const drift = positive ? i * -1.6 : i * 1.4
    const noise = Math.cos(seed * 1.37 + i * 1.31) * 3.2
    return Math.max(6, Math.min(36, 28 + drift + wave + noise))
  })
  return values.map((y, i) => `${i * 8},${y.toFixed(1)}`).join(' ')
}

function buildMiniPointsFromValues(values = []) {
  const clean = values.map(Number).filter(Number.isFinite).slice(-26)
  if (clean.length < 2) return buildMiniPoints(1, true)
  const min = Math.min(...clean)
  const max = Math.max(...clean)
  const spread = max - min || Math.max(Math.abs(max) * 0.002, 1)
  return clean.map((value, index) => {
    const x = (index / Math.max(clean.length - 1, 1)) * 88
    const y = 36 - ((value - min) / spread) * 28
    return `${x.toFixed(1)},${Math.max(5, Math.min(37, y)).toFixed(1)}`
  }).join(' ')
}

function useLiveMarkets() {
  const [markets, setMarkets] = useState(() => marketProducts.map((item, index) => {
    const positive = String(item.change || '').trim().startsWith('+') || item.positive === true
    return {
      ...item,
      positive,
      trend: positive ? 'up' : 'down',
      rawPrice: Number(String(item.price).replace(/,/g, '')) || 0,
      chartPoints: buildMiniPoints(index + 1, positive),
    }
  }))
  const [percentTick, setPercentTick] = useState(0)

  useEffect(() => {
    let alive = true

    fetch('/api/binance/tickers/')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((tickerData) => {
        if (!alive) return
        const rawTickers = Array.isArray(tickerData.tickers) ? tickerData.tickers : Array.isArray(tickerData) ? tickerData : []
        const tickerBySymbol = new Map(rawTickers.map((item) => [item.symbol || item.s, item]))
        const rows = marketProducts.map((base, index) => {
          const symbol = base.apiSymbol || BINANCE_SYMBOLS[index] || 'BTCUSDT'
          const row = toMarketRow({ ...(tickerBySymbol.get(symbol) || {}), symbol }, index)
          return {
            ...row,
            trend: row.positive ? 'up' : 'down',
            chartPoints: buildMiniPoints(index + 1, row.positive),
          }
        })
        if (rows.length) setMarkets(rows)
      })
      .catch(() => {
        // Keep the bundled stable market snapshot if the request fails.
      })

    return () => { alive = false }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setPercentTick((value) => value + 1), 2000)
    return () => window.clearInterval(timer)
  }, [])

  return useMemo(() => withLivePercent(markets, percentTick), [markets, percentTick])
}

function buildSyntheticKlines(product, count = 80) {
  const base = Number(String(product?.rawPrice || product?.price || '1').replace(/,/g, '')) || 1
  let price = base
  const now = Date.now()
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index * 0.34 + base) * 0.0025
    const drift = (index - count / 2) * 0.00004
    const open = price
    const close = Math.max(0.0001, open * (1 + wave + drift))
    const high = Math.max(open, close) * 1.0015
    const low = Math.min(open, close) * 0.9985
    price = close
    return { time: now - (count - index) * MARKET_SAMPLE_MS, open, high, low, close, volume: 1 }
  })
}

function useLiveTradeKlines(baseKlines, product) {
  return useMemo(() => {
    if (baseKlines?.length) return baseKlines.slice(-80)
    return buildSyntheticKlines(product)
  }, [baseKlines, product?.name, product?.price, product?.apiSymbol])
}

function useBinanceMarkets() {
  const [markets, setMarkets] = useState(() => BINANCE_SYMBOLS.map((symbol, index) => toMarketRow({ symbol }, index)))

  useEffect(() => {
    let alive = true
    const updateFromArray = (arr) => {
      if (!Array.isArray(arr)) return
      const rows = arr
        .filter((item) => BINANCE_SYMBOLS.includes(item.symbol || item.s))
        .sort((a, b) => BINANCE_SYMBOLS.indexOf(a.symbol || a.s) - BINANCE_SYMBOLS.indexOf(b.symbol || b.s))
        .map(toMarketRow)
      if (alive && rows.length) setMarkets(rows)
    }

    fetch('/api/binance/tickers/')
      .then((res) => res.ok ? res.json() : Promise.reject(res))
      .then((data) => updateFromArray(data.tickers || data))
      .catch(() => {})

    let ws
    try {
      ws = new WebSocket(`${WS_BASE}/!ticker@arr`)
      ws.onmessage = (event) => {
        try {
          updateFromArray(JSON.parse(event.data))
        } catch (_) {}
      }
    } catch (_) {}

    return () => {
      alive = false
      if (ws) ws.close()
    }
  }, [])

  return markets
}

function normalizeKline(row) {
  if (Array.isArray(row)) {
    return {
      time: row[0],
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }
  }
  return {
    time: row.t,
    open: Number(row.o),
    high: Number(row.h),
    low: Number(row.l),
    close: Number(row.c),
    volume: Number(row.v),
  }
}

function useBinanceDetail(symbol = 'BTCUSDT', interval = '1m') {
  const [ticker, setTicker] = useState(null)
  const [klines, setKlines] = useState([])
  const [depth] = useState({ bids: [], asks: [] })
  const [trades] = useState([])
  const [serverTime, setServerTime] = useState(null)

  useEffect(() => {
    let alive = true
    const safeJson = (res) => res.ok ? res.json() : Promise.reject(res)

    Promise.all([
      fetch(`/api/binance/ticker/?symbol=${symbol}`).then(safeJson),
      fetch(`/api/binance/klines/?symbol=${symbol}&interval=${interval}&limit=120`).then(safeJson),
    ]).then(([tickerData, klineData]) => {
      if (!alive) return
      setTicker(tickerData)
      setServerTime(tickerData.serverTime || tickerData.closeTime || Date.now())
      setKlines((klineData.klines || klineData).map(normalizeKline).filter((item) => Number.isFinite(item.close)))
    }).catch(() => {
      // Keep the stable fallback chart if Binance data is temporarily unavailable.
    })

    return () => { alive = false }
  }, [symbol, interval])

  return { ticker, klines, depth, trades, serverTime }
}

function formatChartTime(ms, withSeconds = false) {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return '--:--'
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}${withSeconds ? `:${second}` : ''}`
}

function scaleKlinesForProduct(klines, product) {
  const rows = (klines || []).filter((item) => Number.isFinite(item.close) && Number.isFinite(item.open))
  if (!rows.length) return []
  const target = Number(product?.price || rows[rows.length - 1].close) || rows[rows.length - 1].close
  const sourceLast = rows[rows.length - 1].close || 1
  const ratio = target / sourceLast
  return rows.map((row) => ({
    ...row,
    open: row.open * ratio,
    high: row.high * ratio,
    low: row.low * ratio,
    close: row.close * ratio,
    volume: row.volume,
  }))
}

function CandlestickChart({ klines }) {
  const rows = (klines || []).slice(-58)
  const [activeIndex, setActiveIndex] = useState(null)
  useEffect(() => {
    setActiveIndex(null)
  }, [rows.length])

  if (!rows.length) return <div className="chart-placeholder">Loading Binance chart...</div>

  const w = 1220
  const h = 370
  const left = 0
  const right = 72
  const top = 18
  const chartH = 245
  const volumeTop = 292
  const volumeH = 58
  const innerW = w - left - right
  const highs = rows.map((row) => row.high).filter(Number.isFinite)
  const lows = rows.map((row) => row.low).filter(Number.isFinite)
  const max = Math.max(...highs)
  const min = Math.min(...lows)
  const spread = max - min || Math.max(max * 0.02, 1)
  const paddedMax = max + spread * 0.18
  const paddedMin = min - spread * 0.18
  const priceToY = (price) => top + ((paddedMax - price) / (paddedMax - paddedMin)) * chartH
  const volumeMax = Math.max(...rows.map((row) => row.volume || 0), 1)
  const slot = innerW / Math.max(rows.length, 1)
  const candleW = Math.max(4, Math.min(19, slot * 0.58))
  const selected = rows[activeIndex ?? rows.length - 1]
  const last = rows[rows.length - 1]
  const currentY = priceToY(last.close)
  const labels = Array.from({ length: 5 }, (_, i) => paddedMin + ((paddedMax - paddedMin) / 4) * i).reverse()
  const xLabels = [0, Math.floor(rows.length * 0.2), Math.floor(rows.length * 0.4), Math.floor(rows.length * 0.6), Math.floor(rows.length * 0.8), rows.length - 1]
    .filter((value, index, arr) => value >= 0 && arr.indexOf(value) === index)

  return (
    <div className="candle-shell">
      <div className="chart-range-strip"><span /><b /><em /></div>
      <svg
        className="candlestick-chart"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-label="Trading candlestick chart"
        onMouseLeave={() => setActiveIndex(null)}
      >
        <g className="chart-grid">
          {labels.map((price) => {
            const y = priceToY(price)
            return <line key={price} x1={left} x2={w - right + 4} y1={y} y2={y} />
          })}
        </g>

        <line className="current-price-line" x1={left} x2={w - right} y1={currentY} y2={currentY} />

        {rows.map((row, index) => {
          const x = left + slot * index + slot / 2
          const openY = priceToY(row.open)
          const closeY = priceToY(row.close)
          const highY = priceToY(row.high)
          const lowY = priceToY(row.low)
          const isUp = row.close >= row.open
          const bodyTop = Math.min(openY, closeY)
          const bodyHeight = Math.max(Math.abs(openY - closeY), 2.3)
          const volumeHeight = ((row.volume || 0) / volumeMax) * volumeH
          return (
            <g key={`${row.time}-${index}`} className={isUp ? 'candle up' : 'candle down'}>
              <line x1={x} x2={x} y1={highY} y2={lowY} />
              <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyHeight} rx="1" />
              <rect className="volume-bar" x={x - candleW / 2} y={volumeTop + volumeH - volumeHeight} width={candleW} height={Math.max(volumeHeight, 1)} rx="1" />
              <rect
                className="hit-zone"
                x={x - slot / 2}
                y={0}
                width={slot}
                height={h}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              />
            </g>
          )
        })}

        {activeIndex !== null && selected && (
          <line
            className="hover-line"
            x1={left + slot * activeIndex + slot / 2}
            x2={left + slot * activeIndex + slot / 2}
            y1={top}
            y2={volumeTop + volumeH}
          />
        )}

        <g className="axis-labels">
          {labels.map((price) => <text key={price} x={w - right + 10} y={priceToY(price) + 4}>{formatPrice(price)}</text>)}
          {xLabels.map((index) => {
            const x = left + slot * index + slot / 2
            return <text key={index} x={x} y={282} textAnchor="middle">{formatChartTime(rows[index]?.time)}</text>
          })}
        </g>

        <g className="current-price-badge" transform={`translate(${w - right - 62}, ${Math.max(24, Math.min(currentY - 13, 250))})`}>
          <rect width="68" height="22" rx="4" />
          <text x="34" y="15" textAnchor="middle">{formatPrice(last.close)}</text>
        </g>
      </svg>
      {selected && (
        <div className="chart-tooltip">
          <p><i />{formatChartTime(selected.time, true)}</p>
          <p><i />open <b>{formatPrice(selected.open)}</b></p>
          <p><i />close <b>{formatPrice(selected.close)}</b></p>
          <p><i />lowest <b>{formatPrice(selected.low)}</b></p>
          <p><i />highest <b>{formatPrice(selected.high)}</b></p>
        </div>
      )}
    </div>
  )
}

function DepthTrades({ depth, trades }) {
  const bids = (depth.bids || []).slice(0, 5)
  const asks = (depth.asks || []).slice(0, 5)
  return (
    <div className="market-live-panel">
      <div>
        <h4>Depth</h4>
        {[...asks.slice().reverse(), ...bids].map((row, i) => {
          const isAsk = i < asks.length
          return <p key={`${row[0]}-${i}`} className={isAsk ? 'ask' : 'bid'}><span>{formatPrice(row[0])}</span><b>{Number(row[1] || 0).toFixed(5)}</b></p>
        })}
      </div>
      <div>
        <h4>Trades</h4>
        {(trades || []).slice(0, 10).map((trade, i) => {
          const price = trade.p || trade.price
          const qty = trade.q || trade.qty
          const maker = trade.m ?? trade.isBuyerMaker
          return <p key={`${trade.t || trade.id || i}`} className={maker ? 'bid' : 'ask'}><span>{formatPrice(price)}</span><b>{Number(qty || 0).toFixed(5)}</b></p>
        })}
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="logo" aria-label="Digifinex">
      <img src={DIGIFINEX_LOGO} alt="Digifinex" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'inline-flex' }} />
      <span className="logo-fallback"><b>DIGI</b>FINEX</span>
    </div>
  )
}

function Language() {
  return (
    <div className="language-chip">
      <FiGlobe />
      <strong>{M.languageName}</strong>
    </div>
  )
}

function TopBar({ title, onBack, right }) {
  return (
    <header className="page-topbar">
      <button className="back-button" onClick={onBack} aria-label="Back"><FiArrowLeft /></button>
      <h1>{title}</h1>
      <div className="topbar-right">{right}</div>
    </header>
  )
}

function LoadingOverlay({ active }) {
  if (!active) return null
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="spinner" />
        <span>Loading</span>
      </div>
    </div>
  )
}

function MiniChart({ trend = 'up', points }) {
  const safePoints = points || (trend === 'up'
    ? '0,30 8,34 16,29 24,31 32,24 40,25 48,20 56,18 64,15 72,17 80,13 88,12'
    : '0,18 8,30 16,22 24,28 32,23 40,24 48,18 56,20 64,15 72,19 80,17 88,14')
  return (
    <svg className={`mini-chart ${trend}`} viewBox="0 0 90 42" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`fade-${trend}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={safePoints} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`${safePoints} 88,42 0,42`} fill={`url(#fade-${trend})`} />
    </svg>
  )
}

function BottomNav({ current, go }) {
  const items = [
    { key: 'home', label: 'Home', icon: FiHome },
    { key: 'products', label: 'Products', icon: FiBarChart2 },
    { key: 'customer', label: 'Customer', icon: FiMessageCircle },
    { key: 'my', label: 'My', icon: FiUser },
  ]
  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon
        const active = current === item.key
        return (
          <button key={item.key} className={active ? 'active' : ''} onClick={() => item.key === 'customer' ? window.open(TELEGRAM_URL, '_blank') : go(item.key)}>
            <Icon />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function EmptyState({ type, text }) {
  const Icon = type === 'order' ? FiSearch : type === 'withdraw' ? BsArrowUpRightCircle : type === 'deposit' ? BsArrowDownLeftCircle : BsCashCoin
  return (
    <div className="empty-state">
      <div className="empty-illustration"><Icon /></div>
      <p>{text}</p>
    </div>
  )
}

function AppFrame({ page, go, children, className = '' }) {
  return (
    <div className={`app-page with-nav ${className}`}>
      {children}
      <BottomNav current={page} go={go} />
    </div>
  )
}

function LoginPage({ onLogin, onRegister, overlay }) {
  const [showPassword, setShowPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const submit = () => {
    if (isRegister) onRegister({ username: account, password, full_name: fullName })
    else onLogin(account, password)
  }
  return (
    <div className="login-page">
      <div className="login-head"><Logo /><Language /></div>
      <main className="login-main">
        <h1>{isRegister ? 'Create Account' : 'Account Login'}</h1>
        {isRegister && <><label>Name</label><div className="input-shell"><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Please enter name" /></div></>}
        <label>Account</label>
        <div className="input-shell focused">
          <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Please enter account" />
          {account && <button onClick={() => setAccount('')}><FiXCircle /></button>}
        </div>
        <label>Password</label>
        <div className="input-shell">
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Please enter password" />
          <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button>
          <button onClick={() => setPassword('')}><FiXCircle /></button>
        </div>
        <button className="primary-button" onClick={submit}>{isRegister ? 'Register' : 'Login'}</button>
        <button className="login-switch" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Login' : 'Create a new client account'}
        </button>
      </main>
      <LoadingOverlay active={overlay} />
    </div>
  )
}

function CustomerAssistantLogo() {
  return (
    <span className="customer-assistant-logo" aria-hidden="true">
      <svg viewBox="0 0 72 72" role="presentation">
        <defs>
          <linearGradient id="customerHeadset" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#6ea6ff" />
            <stop offset="1" stopColor="#174dff" />
          </linearGradient>
          <radialGradient id="customerFace" cx="45%" cy="34%" r="72%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.58" stopColor="#e9f4ff" />
            <stop offset="1" stopColor="#76a7ff" />
          </radialGradient>
          <filter id="customerShadow" x="-30%" y="-20%" width="160%" height="150%">
            <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#3363d7" floodOpacity="0.28" />
          </filter>
        </defs>
        <path d="M18 29c0-12 8-21 19-21s19 9 19 21" fill="none" stroke="url(#customerHeadset)" strokeWidth="5" strokeLinecap="round" />
        <path d="M13 32c0-3 3-6 6-6h3v20h-3c-4 0-6-3-6-7v-7z" fill="url(#customerHeadset)" />
        <path d="M59 32c0-3-3-6-6-6h-3v20h3c4 0 6-3 6-7v-7z" fill="url(#customerHeadset)" />
        <path d="M25 56c5 5 18 7 28-1 0 7-5 11-13 11-6 0-11-3-15-10z" fill="#4d80ff" opacity="0.95" />
        <rect x="20" y="20" width="35" height="36" rx="17" fill="url(#customerFace)" filter="url(#customerShadow)" />
        <circle cx="32" cy="35" r="3.8" fill="#1554ff" />
        <circle cx="45" cy="35" r="3.8" fill="#1554ff" />
        <path d="M31 44c4 5 12 5 16 0" fill="none" stroke="#1554ff" strokeWidth="3" strokeLinecap="round" />
        <path d="M55 44c5 0 8-3 8-7" fill="none" stroke="#1554ff" strokeWidth="3" strokeLinecap="round" />
        <circle cx="63" cy="37" r="2.2" fill="#1554ff" />
      </svg>
    </span>
  )
}

function HomePage({ go }) {
  const markets = useLiveMarkets()
  const [banner, setBanner] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setBanner((current) => (current + 1) % BANNERS.length), 4500)
    return () => window.clearInterval(id)
  }, [])

  return (
    <AppFrame page="home" go={go} className="home-page">
      <div className="home-head"><Logo /><Language /></div>
      <section className="hero-banner image-banner">
        <img src={BANNERS[banner]} alt="Digifinex banner" />
      </section>

      <section className="quick-grid">
        <button onClick={() => go('deposit')}><span className="icon blue"><FiCreditCard /></span><b>Deposit</b></button>
        <button onClick={() => go('products')}><span className="icon green"><FiTrendingUp /></span><b>Trading</b></button>
        <button onClick={() => go('orders')}><span className="icon blue"><FiFileText /></span><b>Orders</b></button>
        <button onClick={() => go('withdraw')}><span className="icon cyan"><FiDownload /></span><b>Withdrawal</b></button>
        <button onClick={() => go('about')}><span className="icon green"><FiInfo /></span><b>About</b></button>
        <button onClick={() => window.open(TELEGRAM_URL, '_blank')}><span className="icon pink"><FaTelegramPlane /></span><b>Message</b></button>
        <button className="customer-card" onClick={() => window.open(TELEGRAM_URL, '_blank')}>
          <span><b>Customer</b><small>High-quality<br />service for you</small></span>
          <CustomerAssistantLogo />
        </button>
      </section>

      <a className="notice-card" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
        <span className="notice-icon"><FiBell /></span>
        <span>Customer service account has been changed to: {TELEGRAM_LABEL}</span>
      </a>

      <section className="recommendation recommendation-desc">
        <h3>Product Recommendation</h3>
        <div className="product-strip">
          {markets.map((item) => (
            <button className="small-card" key={item.name} onClick={() => go('tradeDetail', item)}>
              <div className="recommendation-name">
                <strong>{item.name}</strong>
                <small>{item.code}</small>
              </div>
              <MiniChart trend={item.trend} points={item.chartPoints} />
              <div className="recommendation-values">
                <div className="card-price">{item.price}</div>
                <div className="card-change"><span>{item.meta}</span><b className={String(item.change).startsWith('+') ? 'rise' : 'fall'}>{item.change}</b></div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <FuturesTable go={go} markets={markets} />
    </AppFrame>
  )
}

function FuturesTable({ compact = false, go, markets }) {
  const liveRows = markets && markets.length ? markets : marketProducts
  const rows = compact ? liveRows.slice(0, 2) : liveRows
  return (
    <section className="futures-section">
      <h3>Futures</h3>
      <div className="futures-head"><span>Name</span><span>Latest Price</span><span>24H Increase</span></div>
      <div className="futures-list">
        {rows.map((item) => {
          const up = item.positive ?? String(item.change || '').trim().startsWith('+')
          return (
            <button className="future-row" key={item.symbol || item.name} onClick={() => go('tradeDetail', item)}>
              <span className="future-name"><b>{item.name}</b><small>24H Volume{item.volume || '0'}</small></span>
              <span className="future-price">{item.price}</span>
              <span className={`percent-pill ${up ? 'positive' : 'negative'}`}>{item.change}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function ProductsPage({ go }) {
  const markets = useLiveMarkets()
  const [query, setQuery] = useState('')
  const filtered = markets.filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <AppFrame page="products" go={go} className="products-page">
      <div className="search-shell"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Please enter product name" /><FiSearch /></div>
      <FuturesTable go={go} markets={filtered} />
    </AppFrame>
  )
}

function MyPage({ go, overlay, user }) {
  return (
    <AppFrame page="my" go={go} className="my-page">
      <section className="profile-top">
        <div className="profile-name">
          <h2>{user?.full_name || user?.username || 'Client'}</h2>
          <p>{user?.username || 'client'} <span>Regular</span></p>
          <small><MdOutlineVerifiedUser /> Credit Score:{user?.credit_score || 100}</small>
        </div>
        <div className="account-code">Account Code {user?.account_code || '------'} <BsClipboard2Check /></div>
      </section>

      <section className="asset-card">
        <div><small>Total Assets</small><strong>${money(user?.wallet?.total_assets)}</strong><span>Frozen ${money(user?.wallet?.frozen_balance)}</span></div>
        <div className="asset-result"><small>Account Results</small><b>0</b></div>
        <div className="asset-result"><small>Today</small><b>0</b></div>
      </section>

      <section className="money-actions">
        <button><small>Available Balance</small><b>${money(user?.wallet?.available_balance)}</b></button>
        <button onClick={() => go('deposit')}><span className="icon blue"><FiCreditCard /></span><b>Deposit</b></button>
        <button onClick={() => go('withdraw')}><span className="icon blue"><FiCreditCard /></span><b>Withdrawal</b></button>
      </section>

      <section className="account-list">
        {user?.is_staff && <button className="account-row admin-entry" onClick={() => go('admin')}><span className="round-icon violet"><FaUserTie /></span><b>Admin Dashboard</b><FiChevronRight /></button>}
        {accountRows.map((row) => {
          const Icon = row.icon
          return (
            <button key={row.label} className="account-row" onClick={() => row.page === 'login' ? go('login') : go(row.page)}>
              <span className={`round-icon ${row.accent}`}><Icon /></span>
              <b>{row.label}</b>
              <FiChevronRight />
            </button>
          )
        })}
      </section>
      <LoadingOverlay active={overlay} />
    </AppFrame>
  )
}

function DepositPage({ back, overlay, showLoading, user, onDeposit }) {
  const [tab, setTab] = useState('USDT-TRC20')
  const [amount, setAmount] = useState('')
  const submit = () => onDeposit({ amount, network: tab })
  return (
    <div className="app-page form-page">
      <TopBar title="Deposit" onBack={back} />
      <div className="tabs three-tabs">
        {['USDT-TRC20', 'USDT-ERC20', 'BTC'].map((item) => <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}
      </div>
      <section className="white-panel amount-panel">
        <label>Recharge Amount</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        <small>≈ $</small>
        <p>Available Balance:<span>$ {money(user?.wallet?.available_balance)}</span></p>
      </section>
      <label className="form-label">Address</label>
      <a className="address-panel" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
        <span>Please contact online customer service.........</span><FiFileText />
      </a>
      <button className="primary-button" onClick={submit}>Submit</button>
      <LoadingOverlay active={overlay} />
    </div>
  )
}

function VerifyPage({ back, overlay, showLoading }) {
  return (
    <div className="app-page form-page verify-page">
      <TopBar title="Real Name Verification" onBack={back} />
      <label className="form-label">Name</label>
      <input className="full-input" placeholder="Please enter name" />
      <label className="form-label">ID Number</label>
      <input className="full-input" placeholder="Please enter ID number" />
      <label className="form-label">Please upload ID photo</label>
      <section className="upload-row">
        <button className="id-upload">
          <div className="id-card-front"><FaUserTie /></div>
          <b>ID Front</b>
          <small>Click to upload ID portrait</small>
        </button>
        <button className="id-upload">
          <div className="id-card-back"><AiOutlineIdcard /></div>
          <b>ID Back</b>
          <small>Click to upload ID back</small>
        </button>
      </section>
      <button className="primary-button" onClick={showLoading}>Submit</button>
      <LoadingOverlay active={overlay} />
    </div>
  )
}

function SettingsPage({ back }) {
  return (
    <div className="app-page settings-page">
      <TopBar title="Settings" onBack={back} />
      <section className="settings-list">
        <button><span>Language Settings</span><em>Simplified Chinese</em><FiChevronRight /></button>
        <button><span>Login Password</span><em>Modify</em><FiChevronRight /></button>
        <button><span>Transaction Password</span><em>Modify</em><FiChevronRight /></button>
        <button><span>Clear Cache</span></button>
      </section>
      <a className="password-warning" href={TELEGRAM_URL} target="_blank" rel="noreferrer">If you need to change your password, please contact customer service <FiChevronRight /></a>
    </div>
  )
}

function WithdrawalPage({ back, overlay, user, onWithdraw }) {
  const [network, setNetwork] = useState('USDT-TRC20')
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState('')
  return (
    <div className="app-page form-page">
      <TopBar title="Withdrawal" onBack={back} />
      <div className="tabs three-tabs">
        {['USDT-TRC20', 'USDT-ERC20', 'BTC'].map((item) => <button className={network === item ? 'active' : ''} onClick={() => setNetwork(item)} key={item}>{item}</button>)}
      </div>
      <section className="white-panel amount-panel">
        <label>Withdrawal Amount</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        <small>≈ $</small>
        <p>Available Balance:<span>$ {money(user?.wallet?.available_balance)}</span></p>
      </section>
      <label className="form-label">Address</label>
      <input className="full-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Please enter withdrawal address" />
      <p className="approval-note">Withdrawal requests require admin approval before the balance changes.</p>
      <button className="primary-button" onClick={() => onWithdraw({ amount, network, address })}>Submit</button>
      <LoadingOverlay active={overlay} />
    </div>
  )
}

function WithdrawAccountPage({ back }) {
  return (
    <div className="app-page withdraw-account-page">
      <TopBar title="Withdrawal Account" onBack={back} />
      <div className="wallet-illustration"><FiFileText /><FaDollarSign /></div>
      <section className="account-type">
        <label>Select Account Type</label>
        <button className="blue-card"><FaDollarSign />USDT-TRC20</button>
        <button className="orange-card"><FaDollarSign />USDT-ERC20</button>
        <button className="green-card"><FaBitcoin />BTC</button>
      </section>
    </div>
  )
}

function RecordPage({ title, type, text, back, records }) {
  const items = records || []
  return (
    <div className="app-page record-page">
      <TopBar title={title} onBack={back} />
      {items.length ? (
        <section className="record-list-real">
          {items.map((item) => (
            <div className="record-real-row" key={`${type}-${item.id}`}>
              <div><b>{item.record_type || item.network || type}</b><small>{formatAppDateTime(item.created_at)}</small>{item.address && <small>{item.address}</small>}</div>
              <div><strong>${money(item.amount)}</strong><span className={`status ${item.status}`}>{item.status}</span></div>
            </div>
          ))}
        </section>
      ) : <EmptyState type={type} text={text} />}
    </div>
  )
}


function playAdminBeep() {
  try {
    const audio = new Audio(adminNotificationSound)
    audio.volume = 1
    audio.currentTime = 0

    const playPromise = audio.play()

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('Sound notification blocked:', error)
      })
    }
  } catch (error) {
    console.warn('Sound notification error:', error)
  }
}

function getRemainingSeconds(order, now = Date.now()) {
  const createdAt = new Date(order.created_at).getTime()
  const duration = Number(order.duration_seconds || 0)

  if (!createdAt || Number.isNaN(createdAt) || !duration) return 0

  const endAt = createdAt + duration * 1000
  return Math.max(0, Math.ceil((endAt - now) / 1000))
}

function OrdersPage({ back, trades = [], onExpireOrder }) {
  const [tab, setTab] = useState('position')
  const [now, setNow] = useState(Date.now())
  const expiringRef = useRef(new Set())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    trades
      .filter((item) => item.status === 'open')
      .forEach((item) => {
        const remaining = getRemainingSeconds(item, now)
        if (remaining <= 0 && !expiringRef.current.has(item.id)) {
          expiringRef.current.add(item.id)
          Promise.resolve(onExpireOrder?.(item.id))
            .then(() => setTab('close'))
            .finally(() => expiringRef.current.delete(item.id))
        }
      })
  }, [trades, now, onExpireOrder])

  const positionTrades = trades.filter((item) => item.status === 'open')
  const closedTrades = trades.filter((item) => item.status === 'closed')
  const items = tab === 'position' ? positionTrades : closedTrades

  return (
    <div className="app-page order-page order-record-shot">
      <TopBar title={M.orderRecord} onBack={back} />

      <div className="order-tabs order-record-tabs">
        <button
          type="button"
          className={tab === 'position' ? 'active' : 'muted'}
          onClick={() => setTab('position')}
        >
          {M.positionList}
        </button>

        <button
          type="button"
          className={tab === 'close' ? 'active' : 'muted'}
          onClick={() => setTab('close')}
        >
          {M.closePositionRecord}
        </button>
      </div>

      {items.length ? (
        <section className="order-list-real order-record-list">
          {items.map((item) => {
            const remaining = item.status === 'open' ? getRemainingSeconds(item, now) : 0
            const displayedSeconds = item.status === 'open' ? remaining : Number(item.duration_seconds || 0)
            const sideLabel = item.side === 'buy' ? M.buy : M.sell

            return (
              <article className="order-record-card" key={item.id}>
                <header className="order-card-head">
                  <h3>
                    {item.market_name}{' '}
                    <span>{displayedSeconds}S</span>
                  </h3>
                  <strong className={item.side === 'buy' ? 'order-side-buy' : 'order-side-sell'}>
                    {sideLabel}
                  </strong>
                </header>

                <div className="order-card-divider" />

                <div className="order-number-line">
                  <span>{M.orderNumber}</span>
                  <b>{orderNumber(item)}</b>
                </div>

                <div className="order-value-grid">
                  <p>
                    <span>{M.amount}</span>
                    <b>{money(item.amount)}</b>
                  </p>
                  <p>
                    <span>{M.profitAndLoss}</span>
                    <b className={Number(item.profit_loss) >= 0 ? 'profit-green' : 'profit-red'}>
                      {money(item.profit_loss)}
                    </b>
                  </p>
                </div>

                <div className="order-detail-grid">
                  <div>
                    <small>{M.purchasePrice}</small>
                    <b>{formatOrderPrice(item.entry_price)}</b>
                  </div>
                  <div>
                    <small>{M.transactionPrice}</small>
                    <b>{formatOrderPrice(item.close_price || item.entry_price)}</b>
                  </div>
                  <div>
                    <small>{M.holdingTime}</small>
                    <b>{formatAppDateTime(item.created_at)}</b>
                  </div>
                  <div>
                    <small>{M.closeTime}</small>
                    <b>{item.closed_at ? formatAppDateTime(item.closed_at) : ''}</b>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState type="order" text={M.noOrderRecord} />
      )}
    </div>
  )
}

function SavingsPage({ go }) {
  const products = [
    ['NASDAQ Product One', '1Day', '0.2%'],
    ['NASDAQ Product Two', '3Day', '1%'],
    ['NASDAQ Product Three', '5Day', '1.5%'],
    ['NASDAQ Product Four', '15Day', '2%'],
    ['NASDAQ Product five', '30Day', '3%'],
  ]
  return (
    <AppFrame page="products" go={go} className="savings-page">
      <button className="help-floating"><FiHelpCircle /></button>
      <section className="savings-asset">
        <div><small>Total assets in Yu’ebao</small><strong>$0</strong><span>Frozen $0</span></div>
        <div><strong>Total profit</strong><b>0</b></div>
      </section>
      <section className="savings-actions">
        <button><BsArrowDownLeftCircle /><span>Order</span></button>
        <button><BsArrowUpRightCircle /><span>Withdraw</span></button>
        <button><BsCashCoin /><span>Details</span></button>
      </section>
      <section className="savings-products">
        {products.map(([name, cycle, rate]) => (
          <div className="savings-product" key={name}>
            <h3>{name}</h3>
            <div><span>Cycle:{cycle}</span><span>Yield rate:{rate}</span></div>
            <button>Purchase</button>
          </div>
        ))}
      </section>
    </AppFrame>
  )
}

function AboutPage({ back }) {
  return (
    <div className="app-page company-profile-page">
      <TopBar title="Company Profile" onBack={back} />
      <section className="company-profile-content">
        <p>
          DigiFinex was founded in 2017 and<br />
          is a globally leading digital asset<br />
          trading platform. We have offices<br />
          in 6 countries and provide over 700<br />
          trading pairs to over 6 million users<br />
          worldwide. Our mission is to offer<br />
          cutting-edge financial technology<br />
          services to global users. As a<br />
          trustworthy platform, we prioritize<br />
          innovation, reliability, and customer<br />
          satisfaction to meet the constantly<br />
          changing needs of the digital asset<br />
          trading community. Our product portfolio<br />
          includes spot trading ofcryptocurrencies,<br />
          derivatives trading,cryptocurrency credit<br />
          cards, asset management products, and<br />
          mining services.
        </p>
      </section>
    </div>
  )
}

function AdminPage({ back, user }) {
  const [clients, setClients] = useState([])
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [trades, setTrades] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [depositClientId, setDepositClientId] = useState('')
  const [adjustClientId, setAdjustClientId] = useState('')
  const [clientForm, setClientForm] = useState({ username: '', password: '123456', full_name: '', initial_deposit: '' })
  const [depositForm, setDepositForm] = useState({ amount: '', network: 'USDT-TRC20', note: '' })
  const [adjustForm, setAdjustForm] = useState({ amount: '', note: '' })
  const [closeForm, setCloseForm] = useState({ result: 'win', profit_loss: '', close_price: '' })
  const [adminNow, setAdminNow] = useState(Date.now())
  const [adminSoundReady, setAdminSoundReady] = useState(true)
  const knownOpenTradesRef = useRef(new Set())
  const adminSoundReadyRef = useRef(true)

  const enableAdminSound = () => {
    adminSoundReadyRef.current = true
    setAdminSoundReady(true)
    playAdminBeep()
    toast.success('Gunshot notification sound is active', { autoClose: 1200, position: 'top-center' })
  }

  const loadAdmin = async () => {
    try {
      const [c, d, w, t] = await Promise.all([
        apiRequest('/api/app/admin/clients/'),
        apiRequest('/api/app/admin/deposits/'),
        apiRequest('/api/app/admin/withdrawals/'),
        apiRequest('/api/app/admin/trades/'),
      ])

      setClients(c.clients || [])
      setDeposits(d.deposits || [])
      setWithdrawals(w.withdrawals || [])

      const nextTrades = t.trades || []
      const openTradeItems = nextTrades.filter((item) => item.status === 'open')
      const previousIds = knownOpenTradesRef.current
      const hasPreviousData = previousIds.size > 0
      const hasNewOpenTrade = openTradeItems.some((item) => !previousIds.has(item.id))

      knownOpenTradesRef.current = new Set(openTradeItems.map((item) => item.id))
      setTrades(nextTrades)

      if (c.clients?.[0]) {
        const firstClientId = String(c.clients[0].id)
        setSelectedClient((current) => current || firstClientId)
        setDepositClientId((current) => current || firstClientId)
        setAdjustClientId((current) => current || firstClientId)
      }

      if (hasPreviousData && hasNewOpenTrade) {
        toast.info('New trading order received', { autoClose: 2500, position: 'top-center' })
        if (adminSoundReadyRef.current) playAdminBeep()
      }
    } catch (error) {
      toast.error(error.message || M.serverError, { position: 'top-center' })
    }
  }

  useEffect(() => {
    if (!user?.is_staff) return undefined

    loadAdmin()

    const refreshTimer = setInterval(() => {
      loadAdmin()
    }, 5000)

    const clockTimer = setInterval(() => {
      setAdminNow(Date.now())
    }, 1000)

    return () => {
      clearInterval(refreshTimer)
      clearInterval(clockTimer)
    }
  }, [user?.is_staff])

  if (!user?.is_staff) {
    return (
      <div className="app-page settings-page">
        <TopBar title="Admin" onBack={back} />
        <section className="about-card"><p>{M.adminOnly}</p></section>
      </div>
    )
  }

  const createClient = async () => {
    try {
      await apiRequest('/api/app/admin/create-client/', { method: 'POST', body: JSON.stringify(clientForm) })
      toast.success(M.clientCreated)
      setClientForm({ username: '', password: '123456', full_name: '', initial_deposit: '' })
      loadAdmin()
    } catch (error) {
      toast.error(error.message || M.serverError)
    }
  }

  const deleteClient = async (client) => {
    if (!client?.id) return
    if (!window.confirm(M.deleteClientConfirm)) return

    try {
      await apiRequest('/api/app/admin/delete-client/', {
        method: 'POST',
        body: JSON.stringify({ user_id: client.id }),
      })
      toast.success(M.clientDeleted)
      if (String(selectedClient) === String(client.id)) setSelectedClient('')
      if (String(depositClientId) === String(client.id)) setDepositClientId('')
      if (String(adjustClientId) === String(client.id)) setAdjustClientId('')
      loadAdmin()
    } catch (error) {
      toast.error(error.message || M.serverError)
    }
  }

  const addDeposit = async () => {
    if (!depositClientId) return toast.error(M.selectDepositClient)
    if (!depositForm.amount) return toast.error(M.enterAmount)

    try {
      await apiRequest('/api/app/admin/add-deposit/', {
        method: 'POST',
        body: JSON.stringify({ ...depositForm, user_id: depositClientId, auto_approve: true }),
      })
      toast.success(M.depositApproved)
      setDepositForm({ amount: '', network: 'USDT-TRC20', note: '' })
      loadAdmin()
    } catch (error) {
      toast.error(error.message || M.serverError)
    }
  }

  const adjustBalance = async () => {
    if (!adjustClientId) return toast.error(M.selectAdjustClient)
    if (!adjustForm.amount) return toast.error(M.enterAmount)

    try {
      await apiRequest('/api/app/admin/adjust-balance/', {
        method: 'POST',
        body: JSON.stringify({
          user_id: adjustClientId,
          amount: adjustForm.amount,
          note: adjustForm.note || 'Admin balance adjustment',
        }),
      })
      toast.success(M.balanceAdjusted)
      setAdjustForm({ amount: '', note: '' })
      loadAdmin()
    } catch (error) {
      toast.error(error.message || M.serverError)
    }
  }

  const closeTrade = async (id) => {
    if (!closeForm.profit_loss) return toast.error('Please enter profit/loss')

    try {
      await apiRequest('/api/app/admin/close-trade/', {
        method: 'POST',
        body: JSON.stringify({
          id,
          result: closeForm.result,
          profit_loss: closeForm.profit_loss,
          close_price: closeForm.close_price || '0',
        }),
      })
      toast.success(M.orderClosed)
      setCloseForm({ result: 'win', profit_loss: '', close_price: '' })
      loadAdmin()
    } catch (error) {
      toast.error(error.message || M.serverError)
    }
  }

  const review = async (kind, id, action) => {
    try {
      await apiRequest('/api/app/admin/review/', { method: 'POST', body: JSON.stringify({ kind, id, action }) })
      toast.success(action === 'approve' ? M.approved : M.rejected)
      loadAdmin()
    } catch (error) {
      toast.error(error.message || M.serverError)
    }
  }

  const pendingWithdrawals = withdrawals.filter((item) => item.status === 'pending')
  const pendingDeposits = deposits.filter((item) => item.status === 'pending')
  const openTrades = trades.filter((item) => item.status === 'open')
  const closedTrades = trades.filter((item) => item.status === 'closed').slice(0, 15)
  const selectedDepositClient = clients.find((client) => String(client.id) === String(depositClientId))
  const selectedAdjustClient = clients.find((client) => String(client.id) === String(adjustClientId))

  return (
    <div className="app-page admin-page">
      <TopBar title="Admin Dashboard" onBack={back} />

      <div className="admin-sound-box">
        <button
          type="button"
          className={adminSoundReady ? 'admin-sound-button active' : 'admin-sound-button'}
          onClick={enableAdminSound}
        >
          {adminSoundReady ? 'Gunshot notification active' : 'Enable gunshot notification'}
        </button>
      </div>

      <section className="admin-grid">
        <div className="admin-card">
          <h3>Create client account</h3>
          <input value={clientForm.full_name} onChange={(e) => setClientForm({ ...clientForm, full_name: e.target.value })} placeholder="Client name" />
          <input value={clientForm.username} onChange={(e) => setClientForm({ ...clientForm, username: e.target.value })} placeholder="Client account" />
          <input value={clientForm.password} onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })} placeholder="Password" />
          <input value={clientForm.initial_deposit} onChange={(e) => setClientForm({ ...clientForm, initial_deposit: e.target.value })} placeholder="Initial deposit optional" />
          <button className="primary-button" onClick={createClient}>Create client</button>
        </div>

        <div className="admin-card admin-deposit-card">
          <h3>Add approved deposit</h3>
          <label className="admin-field-label">{M.depositTarget}</label>
          <select value={depositClientId} onChange={(e) => { setDepositClientId(e.target.value); setSelectedClient(e.target.value) }}>
            <option value="">Select deposit account</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.username} — {client.account_code} — ${money(client.wallet?.available_balance)}
              </option>
            ))}
          </select>
          {selectedDepositClient && (
            <div className="admin-selected-account">
              <span>{M.selectedAccount}</span>
              <strong>{selectedDepositClient.username}</strong>
              <small>{selectedDepositClient.account_code} · {M.availableBalance}: ${money(selectedDepositClient.wallet?.available_balance)}</small>
            </div>
          )}
          <select value={depositForm.network} onChange={(e) => setDepositForm({ ...depositForm, network: e.target.value })}>
            <option>USDT-TRC20</option><option>USDT-ERC20</option><option>BTC</option>
          </select>
          <input value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })} placeholder="Deposit amount" />
          <input value={depositForm.note} onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })} placeholder="Admin note" />
          <button className="primary-button" disabled={!depositClientId || !depositForm.amount} onClick={addDeposit}>Approve deposit</button>
        </div>

        <div className="admin-card">
          <h3>Adjust client balance</h3>
          <select value={adjustClientId} onChange={(e) => { setAdjustClientId(e.target.value); setSelectedClient(e.target.value) }}>
            <option value="">Select client account</option>
            {clients.map((client) => <option key={client.id} value={client.id}>{client.username} — ${money(client.wallet?.available_balance)}</option>)}
          </select>
          {selectedAdjustClient && (
            <div className="admin-selected-account compact">
              <strong>{selectedAdjustClient.username}</strong>
              <small>{selectedAdjustClient.account_code} · {M.availableBalance}: ${money(selectedAdjustClient.wallet?.available_balance)}</small>
            </div>
          )}
          <input value={adjustForm.amount} onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })} placeholder="Amount: -100 or 250" />
          <input value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} placeholder="Reason" />
          <button className="primary-button" onClick={adjustBalance}>Apply adjustment</button>
        </div>
      </section>

      <section className="admin-card wide">
        <h3>Clients</h3>
        <div className="admin-table admin-client-table">
          {clients.map((client) => (
            <div key={client.id} className={String(selectedClient) === String(client.id) ? 'admin-client-row selected' : 'admin-client-row'}>
              <button
                type="button"
                className="admin-client-select"
                onClick={() => {
                  setSelectedClient(String(client.id))
                  setDepositClientId(String(client.id))
                  setAdjustClientId(String(client.id))
                }}
              >
                <span>{client.username}</span>
                <span>{client.account_code}</span>
                <b>${money(client.wallet?.available_balance)}</b>
              </button>
              <button type="button" className="admin-delete-client" onClick={() => deleteClient(client)}>🗑 {M.deleteClient}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-card">
          <h3>Pending withdrawals</h3>
          {pendingWithdrawals.length ? pendingWithdrawals.map((item) => (
            <div className="admin-request" key={item.id}>
              <p><b>{item.username}</b> ${money(item.amount)} {item.network}</p>
              <small>{item.address}</small>
              <div><button onClick={() => review('withdrawal', item.id, 'approve')}>Approve</button><button onClick={() => review('withdrawal', item.id, 'reject')}>Reject</button></div>
            </div>
          )) : <small>No pending withdrawal</small>}
        </div>

        <div className="admin-card">
          <h3>Pending deposits</h3>
          {pendingDeposits.length ? pendingDeposits.map((item) => (
            <div className="admin-request" key={item.id}>
              <p><b>{item.username}</b> ${money(item.amount)} {item.network}</p>
              <div><button onClick={() => review('deposit', item.id, 'approve')}>Approve</button><button onClick={() => review('deposit', item.id, 'reject')}>Reject</button></div>
            </div>
          )) : <small>No pending deposit</small>}
        </div>
      </section>

      <section className="admin-card wide">
        <h3>Open trade orders</h3>
        <div className="admin-close-form">
          <select value={closeForm.result} onChange={(e) => setCloseForm({ ...closeForm, result: e.target.value })}>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="draw">Draw</option>
          </select>
          <input value={closeForm.profit_loss} onChange={(e) => setCloseForm({ ...closeForm, profit_loss: e.target.value })} placeholder="Profit/Loss: 100 or -50" />
          <input value={closeForm.close_price} onChange={(e) => setCloseForm({ ...closeForm, close_price: e.target.value })} placeholder="Close price" />
        </div>

        {openTrades.length ? openTrades.map((item) => {
          const remaining = getRemainingSeconds(item, adminNow)

          return (
            <div className="admin-request admin-trade-request" key={item.id}>
              <div>
                <p>
                  <b>{item.username}</b> — {item.market_name}{' '}
                  <span className={item.side === 'buy' ? 'admin-buy' : 'admin-sell'}>
                    {item.side === 'buy' ? 'Buy' : 'Sell'}
                  </span>
                </p>
                <small>Amount: ${money(item.amount)} | Entry: {item.entry_price}</small>
                <small>
                  Duration: {item.duration_seconds}s | Remaining:{' '}
                  <b className={remaining <= 10 ? 'admin-countdown danger' : 'admin-countdown'}>
                    {remaining}s
                  </b>
                </small>
              </div>
              <div><button onClick={() => closeTrade(item.id)}>Close order</button></div>
            </div>
          )
        }) : <small>No open trade order</small>}
      </section>

      <section className="admin-card wide">
        <h3>Closed trade orders</h3>
        {closedTrades.length ? closedTrades.map((item) => (
          <div className="admin-request trade-admin-row" key={item.id}>
            <p><b>{item.username}</b> {item.market_name} {item.side} — {item.result}</p>
            <small>Profit/Loss: ${money(item.profit_loss)} | Close price: {item.close_price || '-'}</small>
          </div>
        )) : <small>No closed trade order</small>}
      </section>
    </div>
  )
}

function TradeDetailPage({ back, overlay, product = marketProducts[0], onPlaceOrder, onOpenOrders, user }) {
  const symbol = product?.apiSymbol || product?.symbol || 'BTCUSDT'
  const [activeTime, setActiveTime] = useState('30m')
  const [tradeSheet, setTradeSheet] = useState(null)
  const [orderAmount, setOrderAmount] = useState('5000')
  const [orderDuration, setOrderDuration] = useState(900)

  const amountOptions = [1000, 5000, 10000, 50000, 100000, 500000]
  const durationOptions = [300, 600, 900, 1200, 1500, 1800]
  const balance = Number(user?.wallet?.available_balance || 0)
  const numericAmount = Number(orderAmount || 0)
  const canSubmit = numericAmount > 0 && balance >= numericAmount
  const estimate = Math.max(0, Math.round(numericAmount * 0.1586))

  const intervalMap = { Time: '1m', '1m': '1m', '5m': '5m', '30m': '30m', '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w' }
  const { ticker, klines, depth, trades, serverTime } = useBinanceDetail(symbol, intervalMap[activeTime] || '1m')
  const displayKlines = useMemo(() => scaleKlinesForProduct(klines, product), [klines, product])
  const liveKlines = useLiveTradeKlines(displayKlines, product)
  const display = useMemo(() => {
    const latest = liveKlines[liveKlines.length - 1]
    const first = liveKlines[0]
    const high = liveKlines.length ? Math.max(...liveKlines.map((item) => item.high)) : Number(product?.price || 0)
    const low = liveKlines.length ? Math.min(...liveKlines.map((item) => item.low)) : Number(product?.price || 0)
    const price = latest?.close || Number(product?.price || ticker?.lastPrice || 0)
    const diff = first?.close ? price - first.close : Number(product?.meta || 0)
    const percent = first?.close ? (diff / first.close) * 100 : Number(String(product?.change || '0').replace('%', ''))
    const positive = percent > 0
    return {
      name: product?.name || prettySymbol(symbol),
      price: formatPrice(price),
      high: formatPrice(high),
      low: formatPrice(low),
      amount: formatCompact(product?.volume || ticker?.quoteVolume || 0),
      meta: Number.isFinite(diff) ? diff.toFixed(Math.abs(diff) >= 10 ? 2 : 4) : '0.00',
      change: `${positive ? '+' : ''}${Number.isFinite(percent) ? percent.toFixed(2) : '0.00'}%`,
      positive,
      time: serverTime ? formatAppTime(serverTime) : '--:--:--',
    }
  }, [ticker, serverTime, symbol, product, liveKlines])

  const openSheet = (side) => {
    setTradeSheet(side)
    setOrderAmount('5000')
    setOrderDuration(900)
  }

  const submitOrder = async () => {
    if (!canSubmit) return
    await onPlaceOrder(product, tradeSheet, display.price, orderAmount, orderDuration)
    setTradeSheet(null)
  }

  return (
    <div className="app-page trade-detail-page">
      <TopBar title={`⇄ ${display.name}`} onBack={back} right={<button className="round-action" onClick={onOpenOrders}><FiFileText /></button>} />
      <section className="market-detail-card">
        <div className="price-block"><strong>{display.price}</strong><span>{display.meta}&nbsp;&nbsp; <b className={display.positive ? 'rise-text' : 'fall-text'}>{display.change}</b></span></div>
        <div className="hi-low"><small>24H High</small><b>{display.high}</b><small>24H Low</small><b>{display.low}</b></div>
        <div className="volume-block"><small>24H Volume(MX)</small><b>{display.amount}</b><small>24H Amount</small><b>{display.change}</b></div>
      </section>
      <div className="time-tabs">
        {['Time', '1m', '5m', '30m', '1h', '4h', '1d', '1w'].map((item) => <button className={activeTime === item ? 'active' : ''} onClick={() => setActiveTime(item)} key={item}>{item}</button>)}
      </div>
      <div className="chart-blank chart-live-area">
        <CandlestickChart klines={liveKlines} />
        <LoadingOverlay active={overlay} />
      </div>
      <div className="trade-actions">
        <button className="buy" onClick={() => openSheet('buy')}>Buy</button>
        <button className="sell" onClick={() => openSheet('sell')}>Sell</button>
      </div>

      {tradeSheet && (
        <>
          <div className="trade-modal-mask" onClick={() => setTradeSheet(null)} />
          <section className="trade-sheet">
            <header>
              <h3>{display.name} <span className={tradeSheet === 'buy' ? 'buy-tag' : 'sell-tag'}>{tradeSheet === 'buy' ? 'Buy' : 'Sell'}</span></h3>
              <button onClick={() => setTradeSheet(null)}>Cancel</button>
            </header>

            <label>Amount</label>
            <div className="trade-option-grid">
              {amountOptions.map((item) => (
                <button
                  key={item}
                  className={Number(orderAmount) === item ? 'selected' : ''}
                  onClick={() => setOrderAmount(String(item))}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="trade-input-row">
              <input value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} placeholder="Please enter another amount" />
              <span>$</span>
            </div>

            <div className="trade-balance-line"><p className="trade-balance">Balance: ${money(balance)}</p><button onClick={() => setOrderAmount(String(balance.toFixed(2)))}>Place all orders</button></div>
            {!canSubmit && numericAmount > 0 && <p className="trade-error">{M.insufficientBalance}</p>}

            <label>Time</label>
            <div className="trade-option-grid">
              {durationOptions.map((item) => (
                <button
                  key={item}
                  className={orderDuration === item ? 'selected' : ''}
                  onClick={() => setOrderDuration(item)}
                >
                  {item}S
                </button>
              ))}
            </div>

            <div className="trade-summary">
              <div><small>Current Price</small><b>{display.price}</b></div>
              <div><small>Amount</small><b>{money(orderAmount)}</b></div>
              <div><small>Estimate</small><b>{estimate}</b></div>
            </div>

            <button className="trade-ok" disabled={!canSubmit} onClick={submitOrder}>OK</button>
          </section>
        </>
      )}
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('login')
  const [history, setHistory] = useState([])
  const [overlay, setOverlay] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(marketProducts[0])
  const [session, setSession] = useState(null)
  const [records, setRecords] = useState({
  deposits: [],
  withdrawals: [],
  capital: [],
  trades: [],
})

  const refreshMe = async () => {
    try {
      const data = await apiRequest('/api/app/me/')
      if (data.authenticated) {
        setSession(data.user)
        return data.user
      }
      setSession(null)
      return null
    } catch (_) {
      setSession(null)
      return null
    }
  }

  const refreshRecords = async () => {
    try {
      const data = await apiRequest('/api/app/records/')
      setSession(data.user)
      setRecords({
  deposits: data.deposits || [],
  withdrawals: data.withdrawals || [],
  capital: data.capital || [],
  trades: data.trades || [],
})
    } catch (_) {}
  }

  useEffect(() => { refreshMe().then((user) => { if (user) setPage('home') }) }, [])

  const showLoading = () => {
    setOverlay(true)
    window.setTimeout(() => setOverlay(false), 800)
  }

  const go = async (next, product = null) => {
    if (next === 'tradeDetail' && product) setSelectedProduct(product)
    if (next === 'login') {
      try { await apiRequest('/api/app/logout/', { method: 'POST', body: JSON.stringify({}) }) } catch (_) {}
      setSession(null)
      setPage('login')
      setHistory([])
      return
    }
    if (next === 'customer') {
      window.open(TELEGRAM_URL, '_blank')
      return
    }
    if (['depositDetails', 'withdrawDetails', 'capital', 'orders', 'my'].includes(next)) refreshRecords()
    setHistory((prev) => [...prev, page])
    setPage(next)
    setOverlay(true)
    window.setTimeout(() => setOverlay(false), 450)
  }

  const back = () => {
    setHistory((prev) => {
      const copy = [...prev]
      const last = copy.pop() || 'home'
      setPage(last)
      return copy
    })
  }

  const login = async (username, password) => {
    setOverlay(true)
    try {
      const data = await apiRequest('/api/app/login/', { method: 'POST', body: JSON.stringify({ username, password }) })
      setSession(data.user)
      setPage('home')
      setHistory([])
      toast.success(M.loginSuccess, { autoClose: 1200, position: 'top-center' })
      refreshRecords()
    } catch (error) {
      toast.error(error.message, { position: 'top-center' })
    } finally {
      setOverlay(false)
    }
  }

  const register = async (payload) => {
    setOverlay(true)
    try {
      const data = await apiRequest('/api/app/register/', { method: 'POST', body: JSON.stringify(payload) })
      setSession(data.user)
      setPage('home')
      setHistory([])
      toast.success(M.registerSuccess, { autoClose: 1200, position: 'top-center' })
      refreshRecords()
    } catch (error) {
      toast.error(error.message, { position: 'top-center' })
    } finally {
      setOverlay(false)
    }
  }

  const submitDeposit = async (payload) => {
    setOverlay(true)
    try {
      const data = await apiRequest('/api/app/deposit-request/', { method: 'POST', body: JSON.stringify(payload) })
      toast.success(data.message || M.depositSent)
      await refreshRecords()
    } catch (error) { toast.error(error.message) }
    finally { setOverlay(false) }
  }

  const submitWithdrawal = async (payload) => {
    setOverlay(true)
    try {
      const data = await apiRequest('/api/app/withdrawal-request/', { method: 'POST', body: JSON.stringify(payload) })
      toast.success(data.message || M.withdrawalSent)
      await refreshRecords()
    } catch (error) { toast.error(error.message) }
    finally { setOverlay(false) }
  }

  const placeOrder = async (product, side, price, amount, duration) => {
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount', { position: 'top-center' })
      return
    }

    setOverlay(true)

    try {
      await apiRequest('/api/app/trade/order/', {
        method: 'POST',
        body: JSON.stringify({
          market_name: product?.name || 'XAU/USD',
          api_symbol: product?.apiSymbol || 'BTCUSDT',
          side,
          amount,
          duration_seconds: duration || 900,
          entry_price: price,
        }),
      })

      toast.success(M.orderPlaced, { autoClose: 1200, position: 'top-center' })
      await refreshRecords()
      setPage('orders')
    } catch (error) {
      toast.error(error.message || M.serverError, { position: 'top-center' })
    } finally {
      setOverlay(false)
    }
  }


  const expireOrder = async (id) => {
    try {
      const data = await apiRequest('/api/app/trade/expire/', {
        method: 'POST',
        body: JSON.stringify({ id }),
      })
      if (data?.order?.result === 'loss') toast.warning(M.orderAutoLost, { autoClose: 1600, position: 'top-center' })
      await refreshRecords()
    } catch (error) {
      toast.error(error.message || M.serverError, { position: 'top-center' })
    }
  }

  if (!session && page !== 'login') return <><LoginPage onLogin={login} onRegister={register} overlay={overlay} /><ToastContainer /></>
  if (page === 'login') return <><LoginPage onLogin={login} onRegister={register} overlay={overlay} /><ToastContainer /></>
  if (page === 'home') return <><HomePage go={go} /><ToastContainer /></>
  if (page === 'products') return <ProductsPage go={go} />
  if (page === 'my') return <><MyPage go={go} overlay={overlay} user={session} /><ToastContainer /></>
  if (page === 'deposit') return <><DepositPage back={back} overlay={overlay} showLoading={showLoading} user={session} onDeposit={submitDeposit} /><ToastContainer /></>
  if (page === 'withdraw') return <><WithdrawalPage back={back} overlay={overlay} user={session} onWithdraw={submitWithdrawal} /><ToastContainer /></>
  if (page === 'verify') return <VerifyPage back={back} overlay={overlay} showLoading={showLoading} />
  if (page === 'settings') return <SettingsPage back={back} />
  if (page === 'withdrawAccount') return <WithdrawAccountPage back={back} />
  if (page === 'capital') return <RecordPage title="Capital Record" type="capital" text="No capital record" back={back} records={records.capital} />
  if (page === 'withdrawDetails') return <RecordPage title="Withdrawal Details" type="withdraw" text="No withdrawal record" back={back} records={records.withdrawals} />
  if (page === 'depositDetails') return <RecordPage title="Deposit Details" type="deposit" text="No deposit record" back={back} records={records.deposits} />
  if (page === 'orders') return <><OrdersPage back={back} trades={records.trades} onExpireOrder={expireOrder} /><ToastContainer /></>
  if (page === 'savings') return <SavingsPage go={go} />
  if (page === 'tradeDetail') {
    return (
      <>
        <TradeDetailPage
          back={back}
          overlay={overlay}
          product={selectedProduct}
          onPlaceOrder={placeOrder}
          onOpenOrders={() => go('orders')}
          user={session}
        />
        <ToastContainer />
      </>
    )
  }
  if (page === 'about') return <AboutPage back={back} />
  if (page === 'admin') return <><AdminPage back={back} user={session} /><ToastContainer /></>
  return <HomePage go={go} />
}
