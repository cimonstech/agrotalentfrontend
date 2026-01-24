# Windows Troubleshooting Guide

## Common Errors

### Error: kill EPERM
**Cause:** Windows file permission issues when Next.js tries to kill worker processes.

**Solution:**
1. Stop the dev server (Ctrl+C in terminal)
2. Run: `npm run force-clean`
3. Restart: `npm run dev`

### Error: Unexpected end of JSON input
**Cause:** Corrupted manifest file in `.next` directory, usually from interrupted builds.

**Solution:**
1. Stop the dev server
2. Delete `.next` folder manually:
   - Close any file explorers with `.next` open
   - Delete `frontend/.next` folder
3. Run: `npm run dev`

### Error: ENOTEMPTY or EPERM when cleaning
**Cause:** Files are locked by running processes.

**Solution:**
1. **Stop all Node processes:**
   ```powershell
   # In PowerShell
   Get-Process node | Stop-Process -Force
   ```

2. **Close file explorers** with `.next` folder open

3. **Run force clean:**
   ```bash
   npm run force-clean
   ```

4. **If still locked, manually delete:**
   - Close VS Code/Cursor if `.next` is open
   - Delete `frontend/.next` folder in File Explorer
   - Restart terminal

## Quick Fix Commands

### Clean and Restart
```bash
# Stop server first (Ctrl+C), then:
npm run force-clean
npm run dev
```

### Nuclear Option (if nothing works)
```powershell
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Delete .next manually in File Explorer
# Then restart:
npm run dev
```

## Prevention

1. **Always stop dev server properly** (Ctrl+C) before cleaning
2. **Don't open `.next` folder** in file explorer while dev server is running
3. **Use `npm run dev:force`** if you get frequent errors (cleans before starting)

## Configuration

The `next.config.js` has been optimized for Windows:
- Reduced worker processes
- Better file watching
- Disabled problematic features

If issues persist, try:
```bash
npm run force-clean
npm run dev
```
