const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'http://106.54.202.181:8085'

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'content-encoding'
])

const buildTargetUrl = (req) => {
  const pathParam = req?.query?.path
  const path = Array.isArray(pathParam)
    ? pathParam.join('/')
    : String(pathParam || '').replace(/^\/+/, '')

  const query = Object.entries(req.query || {})
    .filter(([key]) => key !== 'path')
    .flatMap(([key, value]) => (Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]))
    .map(([key, value]) => `${encodeURIComponent(String(key))}=${encodeURIComponent(String(value ?? ''))}`)
    .join('&')

  return `${BACKEND_ORIGIN}/${path}${query ? `?${query}` : ''}`
}

const buildForwardHeaders = (req) => {
  const headers = {}
  Object.entries(req.headers || {}).forEach(([key, value]) => {
    const lower = String(key).toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lower)) return
    if (value === undefined) return
    headers[key] = value
  })
  headers['X-Forwarded-Proto'] = 'https'
  return headers
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  const url = buildTargetUrl(req)
  const method = String(req.method || 'GET').toUpperCase()
  const headers = buildForwardHeaders(req)

  let body
  if (method !== 'GET' && method !== 'HEAD') {
    body = req.body
    const contentType = String(headers['Content-Type'] || headers['content-type'] || '').toLowerCase()
    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        body = new URLSearchParams(
          Object.entries(body).map(([key, value]) => [key, value == null ? '' : String(value)])
        ).toString()
      } else if (contentType.includes('application/json')) {
        body = JSON.stringify(body)
      } else {
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json'
        }
        body = JSON.stringify(body)
      }
    }
  }

  let upstream
  try {
    upstream = await fetch(url, { method, headers, body })
  } catch (error) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ code: 502, message: 'proxy upstream request failed', error: String(error?.message || error) }))
    return
  }

  res.statusCode = upstream.status

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lower)) return
    if (lower === 'content-encoding') return
    res.setHeader(key, value)
  })

  const payload = Buffer.from(await upstream.arrayBuffer())
  res.end(payload)
}
