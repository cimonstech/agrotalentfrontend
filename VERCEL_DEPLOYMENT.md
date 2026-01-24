# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your frontend code should be in a GitHub repo
3. **Backend URL**: Your backend should be deployed somewhere (e.g., Railway, Render, DigitalOcean, etc.)

## Step 1: Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository (`cimonstech/agrotalentfrontend`)
4. Vercel will auto-detect Next.js

## Step 2: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://aftdnvdkeplbbroeufdt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdGRudmRrZXBsYmJyb2V1ZmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDg4MjEsImV4cCI6MjA4NDcyNDgyMX0.UUuLP1MfIDvsIkC1Xq9HxDjxS6GFHJtjDNK88vWpbgA
```

### Backend API URL:

**Option A: If your backend is deployed elsewhere (recommended)**
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

**Option B: If you want to use Vercel Serverless Functions (not recommended for Express backend)**
- Leave `NEXT_PUBLIC_API_URL` empty or unset
- The Next.js API routes will be used instead

### Production Site URL:

```
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
```

**Note**: After first deployment, Vercel will give you a URL. Update this variable with your actual production domain if you have a custom domain.

### Optional (for server-side operations):

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdGRudmRrZXBsYmJyb2V1ZmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE0ODgyMSwiZXhwIjoyMDg0NzI0ODIxfQ.xer3p5JWkhz1R74TUgqoqTzcTySPnd105fxp839PNTs
```

**⚠️ Security Note**: The service role key should only be used in server-side code. Vercel will handle this correctly.

## Step 3: Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend` (if your repo has both frontend and backend)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`

## Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete
3. Your app will be live at `https://your-app.vercel.app`

## Step 5: Update Supabase Redirect URLs

After deployment, update Supabase authentication settings:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/verify-email`
   - `https://your-app.vercel.app/reset-password`
   - `https://your-app.vercel.app/dashboard/**`
4. Update **Site URL** to: `https://your-app.vercel.app`

## Step 6: Custom Domain (Optional)

1. In Vercel project settings → **Domains**
2. Add your custom domain (e.g., `agrotalenthub.com`)
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` to your custom domain
5. Update Supabase redirect URLs with your custom domain

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build script

### API Calls Fail (401/403)

- Verify `NEXT_PUBLIC_API_URL` points to your backend
- Check backend CORS settings allow your Vercel domain
- Ensure backend is running and accessible

### Authentication Issues

- Verify Supabase redirect URLs include your Vercel domain
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Clear browser cache and cookies

### Images Not Loading

- Check `next.config.js` has correct image domains
- Verify image paths are correct (public folder or external URLs)

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend API URL (where your Express server is hosted) |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | Your Vercel app URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Optional | Only for server-side operations |

## Next Steps

1. **Deploy Backend**: Deploy your Express backend to a service like:
   - Railway
   - Render
   - DigitalOcean App Platform
   - AWS/Google Cloud/Azure
   
2. **Update Backend CORS**: Allow your Vercel domain in backend CORS settings

3. **Test Everything**: 
   - Sign up flow
   - Sign in flow
   - Password reset
   - Email verification
   - Dashboard access

4. **Monitor**: Use Vercel Analytics to monitor performance
