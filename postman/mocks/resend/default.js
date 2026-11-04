const http = require('node:http')
const messages = []
http.createServer(async (req, res) => {
  res.setHeader('content-type', 'application/json')
  if (req.url === '/_qa/messages' && req.method === 'GET') return res.end(JSON.stringify(messages))
  if (req.url !== '/emails' || req.method !== 'POST') { res.writeHead(501); return res.end('{}') }
  let body = req.body
  if (body === undefined) { const chunks = []; for await (const chunk of req) chunks.push(chunk); body = Buffer.concat(chunks).toString() }
  const message = typeof body === 'string' ? JSON.parse(body) : body
  const recipients = Array.isArray(message?.to) ? message.to : String(message?.to || '').split(',')
  if (!recipients.length || !recipients.every((address) => address.trim().endsWith('@example.invalid'))) {
    res.writeHead(422); return res.end(JSON.stringify({ statusCode: 422, name: 'validation_error', message: 'Only synthetic QA addresses are allowed' }))
  }
  const id = `qa-${messages.length + 1}`
  messages.push({ id, ...message })
  res.end(JSON.stringify({ id }))
}).listen(process.env.PORT)
