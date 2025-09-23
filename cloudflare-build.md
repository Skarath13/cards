# Cloudflare Pages Deployment Guide

## Build Configuration for Cloudflare Pages

### Framework Settings:
- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/`
- **Node.js version**: 20.x

### Environment Variables:
Add these in Cloudflare Pages dashboard under Settings > Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-secure-cron-secret
NODE_VERSION=20
```

### Deployment Steps:
1. Connect your GitHub repository to Cloudflare Pages
2. Set build configuration as specified above
3. Add environment variables
4. Deploy

### Important Notes:
- API routes will run as Cloudflare Functions automatically
- PWA functionality preserved with service worker
- Edge runtime for optimal performance
- Daily reset API route available at `/api/reset-daily`

### Build Command Issues:
If build fails with Turbopack, update build script to:
- `"build": "next build"` (remove --turbopack flag)
- Cloudflare Pages supports Next.js 15 with standard build

### Functions Configuration:
- API routes automatically deploy as Cloudflare Functions
- Edge runtime provides fast global execution
- Compatible with Supabase and database operations