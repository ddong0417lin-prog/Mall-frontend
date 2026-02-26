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
  'host'
])

const buildTargetUrl = (req) => {
  // req.url includes `/api/...` + querystring.
  const raw = String(req.url || '')
  const forward = raw.startsWith('/api') ? raw.slice('/api'.length) : raw
  return `${BACKEND_ORIGIN}${forward || '/'}`
}

const buildForwardHeaders = (req) => {
  const headers = {}
  Object.entries(req.headers || {}).forEach(([key, value]) => {
    const lower = String(key).toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lower)) return
    if (value === undefined) return
    headers[key] = value
  })
  // Ensure backend sees original client info when it logs/filters.
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
    // If body is an object (typical for JSON), ensure we send JSON.
    if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json'
      }
      body = Buffer.from(JSON.stringify(body))
    }
  }

  const upstream = await fetch(url, {
    method,
    headers,
    body
  })

  res.statusCode = upstream.status

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (HOP_BY_HOP_HEADERS.has(lower)) return
    // Avoid sending compressed bytes to client with incorrect encoding in some runtimes.
    if (lower === 'content-encoding') return
    res.setHeader(key, value)
  })

  const buf = Buffer.from(await upstream.arrayBuffer())
  res.end(buf)
}

