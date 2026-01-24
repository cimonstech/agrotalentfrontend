// Force clean script for Windows - handles file locks better
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const nextDir = path.join(__dirname, '..', '.next');
const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache');

function removeDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return true;
  }
  
  try {
    // Try using rmSync first (Node 14.14.0+)
    if (fs.rmSync) {
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      return true;
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
        return true;
      } catch (err) {
        return false;
      }
    }
  } catch (err) {
    // If rmSync fails, try using Windows rmdir command
    if (process.platform === 'win32') {
      try {
        execSync(`rmdir /s /q "${dirPath}"`, { stdio: 'ignore' });
        return true;
      } catch (winErr) {
        console.warn(`Could not remove ${dirPath}:`, err.message);
        return false;
      }
    }
    return false;
  }
}

console.log('Force cleaning build files...');
console.log('Note: Make sure the dev server is stopped (Ctrl+C)');

// Try multiple times with delays
let attempts = 0;
const maxAttempts = 5;

function tryClean() {
  attempts++;
  console.log(`Attempt ${attempts}/${maxAttempts}...`);
  
  const nextRemoved = removeDir(nextDir);
  const cacheRemoved = removeDir(cacheDir);
  
  if (nextRemoved && cacheRemoved) {
    console.log('✓ Build files cleaned successfully!');
    return true;
  } else if (attempts < maxAttempts) {
    console.log('Some files are locked. Waiting 1 second before retry...');
    setTimeout(tryClean, 1000);
  } else {
    console.log('⚠ Could not fully clean. Some files may be locked.');
    console.log('Please:');
    console.log('1. Stop the dev server (Ctrl+C)');
    console.log('2. Close any file explorers with .next folder open');
    console.log('3. Run: npm run clean');
    return false;
  }
}

tryClean();
