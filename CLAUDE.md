# CLAUDE.md - Cards Financial Tracker PWA

## Project Overview

Cards is a mobile-first Progressive Web App for tracking daily financial transactions with PIN-based authentication and automatic daily archival at midnight PST.

## Key Features

- PIN-based authentication (no email/password required)
- Dual transaction tracking (Card and Cash)
- Dynamic row management (add/remove as needed)
- Auto-save functionality with debouncing
- Privacy mode for sensitive data
- Midnight PST automatic daily reset and archival
- Mobile-optimized PWA with offline capabilities

## Tech Stack

- **Framework:** Next.js 15 with TypeScript
- **Styling:** Tailwind CSS with custom CSS variables
- **UI Components:** Radix UI primitives with custom styling
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Authentication:** Custom PIN-based system (bypasses Supabase Auth)
- **PWA:** next-pwa for service worker and offline functionality
- **Icons:** Lucide React
- **Utilities:** lodash for debouncing, mathjs for calculations

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Variables

Required environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
CRON_SECRET=your-secure-cron-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Setup

Run the SQL script in `supabase-setup.sql` in your Supabase SQL Editor to create:
- `transactions` table for current day data
- `archived_transactions` table for historical data
- Row Level Security policies
- Helper functions for user context and daily archival

## Architecture Notes

### Authentication System
- Uses localStorage for PIN storage and session management
- 30-minute inactivity timeout
- No server-side authentication dependencies
- Each user gets a unique UUID generated client-side

### Data Flow
1. User authenticates with PIN
2. Client generates unique user ID
3. Transactions are stored with user_id in Supabase
4. RLS policies ensure data isolation between users
5. Midnight cron job archives data and resets for new day

### Mobile Optimization
- Touch targets minimum 44px for iOS compliance
- Responsive design with mobile-first approach
- PWA manifest for native app experience
- Safe area insets for notched devices

## API Endpoints

### `/api/reset-daily`
- **Method:** POST/GET
- **Purpose:** Archives current day transactions and resets for new day
- **Auth:** Bearer token via CRON_SECRET
- **Schedule:** Called at midnight PST via cron job

## File Structure

```
src/
├── app/
│   ├── api/reset-daily/route.ts    # Daily reset API
│   ├── globals.css                 # Global styles
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Main application
├── components/
│   ├── auth/pin-auth.tsx          # PIN authentication
│   ├── ui/                        # Reusable UI components
│   ├── dashboard.tsx              # Main dashboard
│   └── transaction-table.tsx      # Dynamic transaction table
└── lib/
    ├── auth.ts                    # PIN authentication logic
    ├── supabase.ts               # Browser Supabase client
    ├── supabase-server.ts        # Server Supabase client
    ├── types.ts                  # TypeScript interfaces
    └── utils.ts                  # Utility functions
```

## Security Considerations

- PIN codes stored locally only (localStorage)
- Row Level Security prevents cross-user data access
- HTTPS required for PWA and service worker
- Auto-logout on inactivity
- Privacy mode for sensitive data display

## Deployment

Optimized for Vercel deployment with:
- Automatic builds on git push
- Environment variable management
- Edge functions for API routes
- Static generation where possible

## Performance Features

- Debounced auto-save (500ms delay)
- Optimistic UI updates
- Efficient re-renders with React optimization
- Service worker caching for offline use
- Minimal bundle size with tree shaking

## Browser Support

- iOS Safari 14+ (full PWA support)
- Chrome/Edge 90+ (desktop and mobile)
- Firefox 88+ (limited PWA features)

## Business Logic

### Transaction Flow
1. User selects Card or Cash tab
2. Enters transaction data in dynamic table
3. Data auto-saves on input blur/change
4. Totals calculated automatically
5. Data persists until midnight PST reset

### Daily Reset Process
1. Cron job triggers at midnight PST
2. Current transactions moved to archive table
3. Main transactions table cleared
4. New business day begins with clean slate
5. Historical data preserved in archive

This project prioritizes mobile usability, offline capability, and simple authentication while maintaining data security and automatic daily workflows.