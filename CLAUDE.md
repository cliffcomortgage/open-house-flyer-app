# Open House Flyer App

Full-stack Next.js app for Cliffco Mortgage Bank loan officers to generate co-branded open house flyers with partner realtors.

## What it does
- LOs log in and create printable/shareable flyers for open house events
- Flyers pull live MLS listings (SimplyRETS) and rate scenarios (Optimal Blue)
- Four flyer templates, each co-branded with the realtor's headshot, logo, and colors
- PDFs generated server-side; shareable public link via unique token
- Admin panel for managing LO accounts and company settings

## Tech stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Auth**: NextAuth v5 (JWT strategy, credentials provider)
- **Database**: Neon (serverless PostgreSQL) via Prisma
- **Storage**: Local filesystem in dev (`public/uploads/`); swap `STORAGE_PROVIDER` for S3/R2 in prod
- **Styling**: Tailwind v4 (CSS-first config), shadcn/ui components
- **PDF**: Puppeteer

## Running locally
```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

Requires a `.env.local` file — see `.env.local.example` for all required variables.

Default admin login after seed: `admin@cliffcomortgage.com` / `ChangeMe123!`

## Key files
- `src/proxy.ts` — NextAuth middleware (route protection)
- `src/lib/auth.ts` — NextAuth config
- `src/app/admin/` — Admin panel (company settings, LO management)
- `src/app/dashboard/` — LO portal (flyers, realtors, profile)
- `src/components/flyer-templates/` — Four flyer template components
- `prisma/schema.prisma` — Database schema

## Brand
- **Primary**: `#6633cc` (purple)
- **Dark**: `#0d0d0d` (near-black)
- **Sky**: `#bde8f1` (light blue accent)
- **Font**: Open Sans (via `next/font/google`)
- Logo files: `public/logo-black.png` (on light), `public/logo-white.png` (on dark)

## Related repos
- **cliffcomortgage/cliffco-site** — Main Cliffco website, microsites, brand assets, email campaigns
  - Brand guidelines: `cliffco-site/brand/`
  - Email templates: `cliffco-site/email-campaigns/`
