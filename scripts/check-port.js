// Warn if port 3000 looks busy. Do NOT kill processes here: killing another `next dev`
// (e.g. when a second terminal runs `npm run dev`) leaves the browser with stale chunk
// URLs and causes ChunkLoadError / 404s on /_next/static/chunks/*.
const { execSync } = require('child_process')
const os = require('os')

const isWindows = os.platform() === 'win32'

try {
  if (isWindows) {
    try {
      const stdout = execSync('netstat -ano | findstr :3000', {
        encoding: 'utf8',
        stdio: 'pipe',
      })
      if (stdout && stdout.trim()) {
        console.warn(
          '\n[check-port] Port 3000 appears to be in use. If `next dev` fails, stop the other process or run: npm run dev:force\n'
        )
      }
    } catch {
      // No listener on 3000
    }
  } else {
    try {
      const stdout = execSync('lsof -ti:3000', { encoding: 'utf8', stdio: 'pipe' })
      if (stdout && stdout.trim()) {
        console.warn(
          '\n[check-port] Port 3000 appears to be in use. If `next dev` fails, stop the other process or run: npm run dev:force\n'
        )
      }
    } catch {
      // No listener on 3000
    }
  }
} catch {
  // ignore
}
