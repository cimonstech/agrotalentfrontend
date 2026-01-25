# Build Troubleshooting

## Normal Build Process

A Next.js build typically takes:
- **First build**: 2-5 minutes
- **Subsequent builds**: 30 seconds - 2 minutes

## What You Should See

```
> agrotalent-hub@1.0.0 prebuild
> node scripts/prevent-trace-error.js

> agrotalent-hub@1.0.0 build
> next build

  ▲ Next.js 14.2.35
  - Environments: .env.local

   Creating an optimized production build ...
   Compiled successfully
   Linting and checking validity of types ...
   ✓ Compiled successfully
   ✓ Linting and checking validity of types ...
   ✓ Creating an optimized production build ...
   ✓ Collecting page data
   ✓ Generating static pages (X/X)
   ✓ Finalizing page optimization
```

## If Build Hangs

### Option 1: Wait Longer
- First builds can take 3-5 minutes
- Check Task Manager to see if Node.js is using CPU

### Option 2: Clean Build
```powershell
cd C:\AgroTalentHub\frontend
npm run clean
npm run build
```

### Option 3: Force Clean Build
```powershell
cd C:\AgroTalentHub\frontend
npm run force-clean
npm run build
```

### Option 4: Check for Errors
If the build seems stuck, it might be waiting for input or there's a silent error. Try:
```powershell
cd C:\AgroTalentHub\frontend
npm run build 2>&1 | Tee-Object -FilePath build-output.log
```

Then check `build-output.log` for any errors.

## Common Issues

### Build Takes Too Long
- Check if antivirus is scanning `node_modules`
- Close other applications
- Check available disk space

### Type Errors
- All type errors should be fixed
- If you see new errors, share them and I'll fix them

### Memory Issues
- Close other applications
- Restart your computer if needed

## Quick Test

To quickly check if TypeScript compiles without building:
```powershell
cd C:\AgroTalentHub\frontend
npx tsc --noEmit
```

This will show type errors without doing a full build.

## Vercel Build Issues

### Static Generation Timeout with Event Handlers (RESOLVED - Jan 25, 2026)

**Error on Vercel:**
```
Error: Event handlers cannot be passed to Client Component props.
  {src: ..., alt: ..., className: ..., onError: function onError}
                                                 ^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.

⚠ Restarted static page generation for /about because it took more than 60 seconds
Error: Static page generation for /about is still timing out after 3 attempts.
```

**Problem:** 
- Next.js 14 cannot serialize event handlers during static site generation
- Images with inline `onError` handlers in Server Components caused build failures
- The build would timeout after 60 seconds and fail after 3 attempts

**Solution:**
Created a reusable `ImageWithFallback` client component:

```tsx
// src/components/ImageWithFallback.tsx
'use client'

import { useState, ImgHTMLAttributes } from 'react'

interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  fallbackSrc: string
  alt: string
}

export default function ImageWithFallback({ 
  src, 
  fallbackSrc, 
  alt, 
  ...props 
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)

  const handleError = () => {
    setImgSrc(fallbackSrc)
  }

  return (
    <img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
    />
  )
}
```

**Usage:**
Replace this:
```tsx
<img
  src="/image.jpg"
  alt="Description"
  onError={(e) => { e.target.src = "fallback.jpg" }}
/>
```

With this:
```tsx
<ImageWithFallback
  src="/image.jpg"
  fallbackSrc="fallback.jpg"
  alt="Description"
/>
```

**Files Fixed:**
- `src/app/about/page.tsx` - 3 images
- `src/app/services/page.tsx` - 4 images

**Prevention:**
- Never add event handlers directly to elements in Server Components
- Always use Client Components for interactive features
- Create reusable wrapper components for common patterns like image fallbacks

