# Environment Setup Instructions

## Step 1: Create .env.local File

Create a file named `.env.local` in the `frontend/` directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://aftdnvdkeplbbroeufdt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_az9ShzA0Bk_GEv_KB-Kjlg_8WWjQ3ul
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Site URL (for email redirects)
# Use localhost for development, change to your domain for production
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Resend API (for email notifications)
RESEND_API_KEY=re_E8mxeajE_HvzMLhtM5hbK3ZckXLL5ArpZ

# Paystack (for payments - add when ready)
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## Step 2: Get Supabase Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key - this is secret!)
5. Replace `your_service_role_key_here` in `.env.local`

⚠️ **IMPORTANT**: Never commit the service role key to Git. It's already in `.gitignore`.

## Step 3: Verify Supabase Email Settings

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/verify-email`
   - `http://localhost:3000/reset-password`
   - `http://localhost:3000/**` (wildcard for all routes)

**Note:** For production, change to `https://agrotalentshub.com`

## Step 4: Set Up Resend Domain (Optional but Recommended)

1. Go to Resend Dashboard: https://resend.com/domains
2. Add your domain: `agrotalentshub.com`
3. Add DNS records as instructed
4. Verify domain
5. Update sender email in code if needed (currently: `notifications@agrotalentshub.com`)

## Step 5: Run Database Migrations

1. Go to Supabase Dashboard → **SQL Editor**
2. **First Migration:** Open `backend/migrations/001_initial_schema.sql`
   - Copy and paste the entire SQL file
   - Click **Run** to execute
3. **Second Migration:** Open `backend/migrations/002_contact_submissions.sql`
   - Copy and paste the entire SQL file
   - Click **Run** to execute
4. Verify all tables are created (should see 11 tables total)

## Step 6: Create Your Admin Account

### Option 1: Via Supabase Dashboard (Recommended)
1. Sign up normally at `http://localhost:3000/signup` (choose any role)
2. Go to Supabase Dashboard → **Table Editor** → **profiles**
3. Find your user and change `role` to `admin`
4. Sign in and access `/dashboard/admin`

### Option 2: Via SQL
```sql
-- After signing up, run this in Supabase SQL Editor
UPDATE profiles 
SET role = 'admin', is_verified = true 
WHERE email = 'your-email@example.com';
```

### Option 3: Create Admin via Super Admin (After Option 1 or 2)
1. Sign in as admin
2. Go to `/dashboard/admin/users`
3. Click "Create User"
4. Set role to "Admin"
5. Check "Verified"
6. Create user

## Step 7: Test the Setup

```bash
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

### Test Flow:
1. Sign up as admin (use Option 1 or 2 above)
2. Sign in → Should redirect to `/dashboard/admin`
3. Create a test farm user via "Create User"
4. Create a test graduate user
5. Test job posting and applications

## Current Configuration

✅ **Supabase URL**: `https://aftdnvdkeplbbroeufdt.supabase.co`
✅ **Domain**: `agrotalentshub.com`
✅ **Resend API Key**: Configured
⏳ **Service Role Key**: Needs to be added from Supabase Dashboard

## Troubleshooting

### Email Not Sending
- Check Resend API key is correct
- Verify domain is set up in Resend
- Check Resend dashboard for email logs

### Authentication Errors
- Verify Supabase URL and keys are correct
- Check Supabase dashboard for error logs
- Ensure email redirect URLs are configured

### Database Errors
- Run the migration SQL in Supabase SQL Editor
- Check table permissions in Supabase
- Verify RLS policies are enabled
