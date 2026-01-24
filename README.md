# AgroTalent Hub

A centralized digital system for recruiting, training, and managing qualified agricultural professionals and students, while supporting farms with verified manpower and structured onboarding.

## Project Structure

```
AgroTalentHub/
├── frontend/                # Next.js frontend application
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   └── ...config files
├── backend/                 # Backend API and services
│   ├── api/                 # API routes
│   ├── migrations/          # Database migrations
│   └── services/            # Business logic
└── README.md               # This file
```

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide React

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes (or separate Express server)

## Getting Started

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Add your Supabase credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Setup

Backend setup instructions will be added in Phase 2.

## Development Phases

### Phase 1: Public Website ✅ (Current)
- Home page
- How It Works
- Services
- For Farms
- For Graduates & Students
- About Us
- Contact
- Legal pages (Privacy Policy, Terms)

### Phase 2: Application (Next)
- Authentication (Sign Up, Sign In, Password Reset)
- Role-based dashboards (Graduate, Farm, Student)
- Profile management
- Document uploads
- Placement tracking
- Backend API implementation

### Phase 3: Admin Dashboard (Future)
- User management
- Verification workflows
- Training session management
- Payment tracking
- Analytics

## License

© 2024 AgroTalent Hub. All rights reserved.
