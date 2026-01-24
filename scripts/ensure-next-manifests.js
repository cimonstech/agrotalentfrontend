// Ensures required Next.js manifest files exist (Windows dev sometimes hits ENOENT)
const fs = require('fs')
const path = require('path')

const nextDir = path.join(__dirname, '..', '.next')
const serverDir = path.join(nextDir, 'server')
const middlewareManifestPath = path.join(serverDir, 'middleware-manifest.json')

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function ensureJsonFile(filePath, content) {
  if (fs.existsSync(filePath)) return
  try {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8')
  } catch (e) {
    // Best-effort: don't crash predev if file is locked
  }
}

try {
  ensureDir(serverDir)
  // Minimal shape Next expects when no middleware/edge functions exist
  ensureJsonFile(middlewareManifestPath, {
    version: 2,
    middleware: {},
    functions: {},
    sortedMiddleware: []
  })
} catch (e) {
  // ignore
}

