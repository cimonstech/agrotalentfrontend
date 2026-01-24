# Frontend-Backend Integration Guide

## Setup Complete! ✅

The frontend is now configured to use the separate backend server.

## Configuration

### 1. Environment Variables

Add to `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase (keep existing)
NEXT_PUBLIC_SUPABASE_URL=https://aftdnvdkeplbbroeufdt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_az9ShzA0Bk_GEv_KB-Kjlg_8WWjQ3ul
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_E8mxeajE_HvzMLhtM5hbK3ZckXLL5ArpZ
```

### 2. API Client

Created `frontend/src/lib/api-client.ts` - A centralized API client that:
- Automatically adds auth tokens to requests
- Handles all API endpoints
- Works with the backend server

### 3. Next.js Rewrites (Optional)

The `next.config.js` has been updated to proxy `/api/*` requests to the backend.
This means you can still use `/api/*` in your frontend code, and it will automatically
forward to `http://localhost:3001/api/*`.

**OR** you can use the API client which directly calls the backend.

## Usage Examples

### Using the API Client

```typescript
import { apiClient } from '@/lib/api-client';

// Sign up
const result = await apiClient.signup({
  email: 'user@example.com',
  password: 'password123',
  role: 'graduate',
  institution_name: 'University of Ghana',
  // ... other fields
});

// Get profile
const { profile } = await apiClient.getProfile();

// Upload document
const file = event.target.files[0];
const result = await apiClient.uploadDocument(file, 'certificate');

// Get jobs
const { jobs } = await apiClient.getJobs({ location: 'Greater Accra' });
```

### Direct Fetch (with proxy)

```typescript
// This will be proxied to http://localhost:3001/api/jobs
const response = await fetch('/api/jobs');
const data = await response.json();
```

## Migration Steps

### Option 1: Use API Client (Recommended)

1. Import the API client in your components:
```typescript
import { apiClient } from '@/lib/api-client';
```

2. Replace existing fetch calls:
```typescript
// Before
const res = await fetch('/api/profile');
const data = await res.json();

// After
const data = await apiClient.getProfile();
```

### Option 2: Keep Existing Code (with proxy)

Your existing code will work as-is because of the Next.js rewrite.
The `/api/*` calls will automatically proxy to the backend.

## Running Both Servers

### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

## Testing

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Test API:**
   ```bash
   curl http://localhost:3001/api/stats
   ```

3. **Frontend:**
   - Visit http://localhost:3000
   - All API calls should work through the proxy or API client

## File Uploads with R2

File uploads now use Cloudflare R2 instead of Supabase Storage.

See `backend/CLOUDFLARE_R2_SETUP.md` for R2 configuration.

The upload endpoint is:
```
POST /api/profile/upload-document
Content-Type: multipart/form-data
Body: file (File), type (string)
```

## Next Steps

1. ✅ Backend routes converted
2. ✅ Frontend API client created
3. ✅ Next.js proxy configured
4. ✅ R2 integration ready
5. ⏳ Update frontend components to use API client (optional)
6. ⏳ Test all endpoints
7. ⏳ Deploy backend to production
8. ⏳ Deploy frontend to production

## Notes

- **Authentication**: The API client automatically gets the auth token from Supabase
- **CORS**: Backend is configured to accept requests from `http://localhost:3000`
- **File Uploads**: Uses multer middleware and Cloudflare R2
- **Error Handling**: API client throws errors that can be caught with try/catch
