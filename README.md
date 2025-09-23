# Cards - Financial Transaction Tracker PWA

A mobile-first Progressive Web App for tracking daily financial transactions with PIN-based authentication and automatic daily archival.

## Features

- 📱 **Mobile-Optimized PWA** - Install on iOS/Android devices
- 🔐 **PIN Authentication** - Secure PIN with 30-min auto-logout
- 💳 **Dual Transaction Types** - Separate Card and Cash transaction tracking
- 🎯 **Multi-Tier Service Selection** - Smart toggle system (Full Set/Refill/Other → Natural/Elegant/Mega → Timeline)
- ➕ **Dynamic Rows** - Add/remove transaction rows as needed
- 🔒 **Lock/Unlock Turns** - Prevent accidental edits per transaction
- 🌙 **Midnight Auto-Reset** - Automatic daily archival at midnight PST
- 📱 **Touch-Optimized** - 44px touch targets with swipe navigation
- 💾 **Auto-Save** - Debounced saving as you type
- 🎨 **Animated UI** - Smooth transitions and button animations

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **UI Components:** Radix UI, Lucide React icons, Phosphor Icons
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** Custom PIN-based system (bypasses Supabase Auth)
- **PWA:** next-pwa for offline functionality
- **Utilities:** lodash for debouncing, mathjs for calculations

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Run the SQL script from `supabase-setup.sql` to create tables and policies

### 2. Environment Variables

Update `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# For daily reset API (set to a secure random string)
CRON_SECRET=your-secure-cron-secret-here

# Supabase service role key (get from Supabase Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Install and Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to access the app.

### 4. PWA Installation

- **iOS Safari:** Tap Share → Add to Home Screen
- **Android Chrome:** Tap menu → Add to Home Screen

## Daily Reset Setup

For automatic midnight PST reset, set up a cron job to call:

```
POST /api/reset-daily
Authorization: Bearer YOUR_CRON_SECRET
```

Popular cron services:
- Vercel Cron Functions
- GitHub Actions scheduled workflows
- External cron services (cron-job.org, etc.)

## File Structure

```
src/
├── app/
│   ├── api/reset-daily/     # Daily reset API endpoint
│   ├── globals.css          # Global styles and CSS variables
│   └── page.tsx            # Main app entry point
├── components/
│   ├── auth/
│   │   └── pin-auth.tsx    # PIN authentication component
│   ├── ui/                 # Reusable UI components
│   ├── dashboard.tsx       # Main dashboard layout
│   └── transaction-table.tsx # Dynamic transaction table
└── lib/
    ├── auth.ts            # PIN authentication logic
    ├── supabase.ts        # Supabase client (browser)
    ├── supabase-server.ts # Supabase client (server)
    ├── types.ts           # TypeScript interfaces
    └── utils.ts           # Utility functions
```

## Key Features Explained

### PIN Authentication
- Local storage-based PIN system
- No email/password required
- 30-minute session timeout
- Auto-logout on inactivity

### Transaction Management
- Dynamic row system (start with 1, add/remove as needed)
- Multi-tier service selection with colored bubble tags
- Real-time auto-save with debouncing (200ms)
- Separate tracking for Card vs Cash transactions
- Lock/unlock individual transactions to prevent accidental edits
- Numeric-only validation for amount and tips fields
- Service, Amount, Tips, and Note fields

### Daily Reset System
- Automatic archival at midnight PST
- Moves current transactions to archived_transactions_cards table
- Clears main transactions_cards table for new business day
- Preserves all historical data

### Mobile Optimization
- Touch-friendly 44px minimum touch targets
- Responsive design for all screen sizes
- PWA manifest for native app experience
- Safe area insets for notched devices

## Database Schema

### transactions_cards
- Current day's transactions
- Row Level Security enabled
- User isolation by user_id

### archived_transactions_cards
- Historical transaction data
- Same structure as transactions_cards + archived_at timestamp
- Read-only access for users

**Note:** All tables use the `_cards` suffix to identify them as belonging to this project specifically, preventing conflicts with other projects in the same Supabase instance.

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

### Vercel (Recommended)
Optimized for zero-configuration deployment:

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   CRON_SECRET=your-secure-cron-secret
   ```
3. **Deploy**: Automatic builds on push to main branch

### Features on Vercel:
- Serverless functions for API routes
- Global CDN with edge caching
- Automatic HTTPS and custom domains
- PWA support with service worker

## Security Notes

- PIN codes stored locally on device only
- Row Level Security prevents cross-user data access
- HTTPS required for PWA functionality
- Service worker caches for offline usage

## Browser Support

- **iOS Safari** 14+ (PWA support)
- **Chrome/Edge** 90+ (desktop and mobile)
- **Firefox** 88+ (limited PWA support)

## License

Private project - not for redistribution.