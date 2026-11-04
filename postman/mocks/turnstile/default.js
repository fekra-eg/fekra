const http = require('node:http')
http.createServer(async (req, res) => {
  res.setHeader('content-type', 'application/json')
  if (req.url !== '/turnstile/v0/siteverify') { res.writeHead(501); return res.end('{}') }
  let body = req.body
  if (body === undefined) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = Buffer.concat(chunks).toString() }
  const values = typeof body === 'string' ? Object.fromEntries(new URLSearchParams(body)) : body
  let token
  try { token = JSON.parse(Buffer.from(values.response, 'base64url').toString()) } catch {}
  const valid = Boolean(token?.action && token?.nonce)
  res.end(JSON.stringify({ success: valid, action: token?.action, cdata: token?.nonce, hostname: 'localhost', 'error-codes': valid ? [] : ['invalid-input-response'] }))
}).listen(process.env.PORT)
