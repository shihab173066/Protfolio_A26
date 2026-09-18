import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const UPLOAD_ENDPOINT = '/__upload-public'
export const UPLOAD_DIR = 'uploads'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
}

function slugify(name) {
  return path
    .basename(name, path.extname(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image'
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BYTES) {
        reject(new Error('File is larger than 5 MB.'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// Dev-only endpoint that writes uploaded images into `public/uploads/` so the
// admin panel can reference them by path instead of embedding base64 blobs.
export default function publicUploadPlugin() {
  return {
    name: 'public-upload',
    apply: 'serve',
    configureServer(server) {
      const publicDir = server.config.publicDir
      server.middlewares.use(UPLOAD_ENDPOINT, async (req, res) => {
        const send = (status, payload) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(payload))
        }

        if (req.method !== 'POST') return send(405, { error: 'Use POST.' })

        const type = (req.headers['content-type'] || '').split(';')[0].trim()
        const ext = ALLOWED[type]
        if (!ext) return send(415, { error: 'Unsupported image type.' })

        try {
          const body = await readBody(req)
          if (!body.length) return send(400, { error: 'Empty upload.' })

          const rawName = new URL(req.url, 'http://localhost').searchParams.get('name') || 'image'
          const fileName = `${slugify(rawName)}-${Date.now().toString(36)}${ext}`
          const targetDir = path.join(publicDir, UPLOAD_DIR)

          await mkdir(targetDir, { recursive: true })
          await writeFile(path.join(targetDir, fileName), body)

          send(200, { url: `./${UPLOAD_DIR}/${fileName}` })
        } catch (error) {
          send(400, { error: error.message || 'Upload failed.' })
        }
      })
    },
  }
}
