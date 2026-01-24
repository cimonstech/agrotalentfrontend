# Fixing ChunkLoadError

## Quick Fix

1. **Stop the dev server** (Ctrl+C in the terminal running `npm run dev`)

2. **Clean the build cache:**
   ```bash
   cd frontend
   npm run clean
   ```

3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

## If Error Persists

### Option 1: Force Clean
```bash
npm run force-clean
npm run dev
```

### Option 2: Manual Clean
```powershell
# Stop the dev server first!
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
npm run dev
```

### Option 3: Full Reset
```bash
# Stop the dev server first!
npm run force-clean
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

## Common Causes

1. **Build cache corruption** - Fixed by cleaning `.next` folder
2. **File locks on Windows** - Stop the dev server before cleaning
3. **Port conflicts** - Make sure port 3000 is free
4. **Network timeout** - Check your internet connection

## Prevention

- Always stop the dev server before cleaning
- Use `npm run dev:clean` for a clean start
- If you see file lock errors, use `npm run force-clean`
