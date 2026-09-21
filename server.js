// Local development server. Zero dependencies -- the game is static files, and
// production never runs this: the WesleyArcadeSite CI copies public/ and
// levels/ into the arcade's dist and Firebase Hosting serves them at
// wesleyarcade.com/singularity/.
//
//   npm start        -> http://localhost:3210
//
// Serves public/ at the root and levels/ at /levels, mirroring the deployed
// layout exactly so a path that works here works there.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
// 3210 rather than 3000: sibling projects in this workspace also default to
// 3000, and a server bound to ::1 wins 'localhost' over one bound to *, so a
// clash silently serves someone else's page to the screenshot tooling.
const port = Number(process.env.PORT) || 3210

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
}

function resolve (urlPath) {
  // Decode, drop the query, and normalise away any ../ before it can escape.
  const clean = path.normalize(decodeURIComponent(urlPath.split('?')[0]))
  const rel = clean.replace(/^(\.\.[/\\])+/, '').replace(/^\/+/, '')
  const base = rel.startsWith('levels/') ? root : path.join(root, 'public')
  const target = path.join(base, rel === '' ? 'index.html' : rel)

  // Never serve anything outside the two directories we mean to expose.
  const allowed = [path.join(root, 'public'), path.join(root, 'levels')]
  if (!allowed.some(dir => target === dir || target.startsWith(dir + path.sep))) return null
  return target
}

http.createServer((req, res) => {
  const file = resolve(req.url || '/')
  if (!file) {
    res.writeHead(403).end('Forbidden')
    return
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
      return
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store'
    }).end(data)
  })
}).listen(port, () => {
  console.log(`Singularity dev server: http://localhost:${port}`)
})
