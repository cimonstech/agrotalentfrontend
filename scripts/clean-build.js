// Cross-platform script to clean Next.js build files
const fs = require('fs');
const path = require('path');

const nextDir = path.join(__dirname, '..', '.next');
const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache');

function removeDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  
  try {
    // Use rmSync with recursive option (Node 14.14.0+)
    // This handles Windows file locks better
    if (fs.rmSync) {
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } else {
      // Fallback for older Node versions
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          removeDir(curPath);
        } else {
          try {
            fs.unlinkSync(curPath);
          } catch (err) {
            // Ignore permission errors
          }
        }
      });
      try {
        fs.rmdirSync(dirPath);
      } catch (err) {
        // Ignore if directory not empty
      }
    }
  } catch (err) {
    console.warn(`Could not fully remove ${dirPath}:`, err.message);
    // Try again after a short delay (Windows file locks)
    setTimeout(() => {
      try {
        if (fs.rmSync) {
          fs.rmSync(dirPath, { recursive: true, force: true });
        }
      } catch (retryErr) {
        console.warn(`Retry failed for ${dirPath}:`, retryErr.message);
      }
    }, 500);
  }
}

console.log('Cleaning build files...');
removeDir(nextDir);
removeDir(cacheDir);
console.log('Build files cleaned!');
