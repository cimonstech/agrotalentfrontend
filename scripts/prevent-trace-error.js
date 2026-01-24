// Script to prevent trace file permission errors on Windows
const fs = require('fs');
const path = require('path');

const tracePath = path.join(__dirname, '..', '.next', 'trace');

try {
  // Try to delete the trace file if it exists
  if (fs.existsSync(tracePath)) {
    fs.unlinkSync(tracePath);
    console.log('Cleaned trace file');
  }
} catch (error) {
  // Ignore errors - file might be locked
  if (error.code !== 'ENOENT' && error.code !== 'EPERM') {
    console.warn('Could not clean trace file:', error.message);
  }
}
