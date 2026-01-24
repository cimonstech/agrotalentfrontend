// Script to check and kill process on port 3000 if needed
const { execSync } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

try {
  if (isWindows) {
    // Windows: Find process using port 3000
    try {
      const stdout = execSync('netstat -ano | findstr :3000', { encoding: 'utf8', stdio: 'pipe' });
      if (stdout) {
        const lines = stdout.trim().split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 0) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid) && pid !== '0') {
              pids.add(pid);
            }
          }
        });
        
        if (pids.size > 0) {
          console.log(`Found ${pids.size} process(es) on port 3000, killing...`);
          pids.forEach(pid => {
            try {
              execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            } catch (err) {
              // Process might have already ended
            }
          });
          // Wait a bit for ports to be released
          require('child_process').execSync('timeout /t 1 /nobreak >nul 2>&1 || sleep 1', { stdio: 'ignore' });
        }
      }
    } catch (err) {
      // No process on port 3000, which is fine
    }
  } else {
    // Unix/Linux/Mac
    try {
      const stdout = execSync('lsof -ti:3000', { encoding: 'utf8', stdio: 'pipe' });
      if (stdout) {
        const pids = stdout.trim().split('\n').filter(p => p);
        if (pids.length > 0) {
          console.log(`Found ${pids.length} process(es) on port 3000, killing...`);
          pids.forEach(pid => {
            try {
              execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            } catch (err) {
              // Process might have already ended
            }
          });
          // Wait a bit for ports to be released
          require('child_process').execSync('sleep 1', { stdio: 'ignore' });
        }
      }
    } catch (err) {
      // No process on port 3000, which is fine
    }
  }
} catch (err) {
  // Ignore errors - script should not fail the build
}
