# Medical Reporting Platform

Enterprise-grade, HIPAA-conscious web application for Self-Funded Medical & Pharmacy Reporting with C&E (Claims & Expenses) analytics.

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database (Render.com or local)
- Git

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your DATABASE_URL

# 3. Generate Prisma Client
npm run db:generate

# 4. Push database schema
npm run db:push

# 5. Seed golden dataset
npm run db:seed

# 6. Start development server
npm run dev
```

Application will be available at http://localhost:3000

## Project Structure

```
.
├── apps/
│   └── web/                    # Next.js 14 application
│       ├── src/
│       │   ├── app/            # App Router pages & API routes
│       │   └── lib/            # Prisma client
│       └── prisma/
│           ├── schema.prisma   # Database schema
│           └── seed.ts         # Seed data script
├── packages/
│   ├── lib/                    # Shared business logic (formulas)
│   └── ui/                     # Shared React components
└── package.json                # Monorepo root
```

## Environment Variables

Required in `apps/web/.env`:

```bash
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
NODE_ENV=development
PORT=3000
```

## Database

The platform uses PostgreSQL with Prisma ORM. The schema includes:

- **Core Tables**: Client, Plan, PlanYear, MonthSnapshot, MonthlyPlanStat
- **Data Tables**: HighClaimant, CAndESummaryRow
- **Config Tables**: Input, PremiumEquivalent, AdminFeeComponent, StopLossFeeByTier
- **Audit**: User, AuditLog, ObservationNote

All tables use UUID primary keys and have `clientId` for multi-tenancy.

## Features

✅ Executive Summary - Fuel gauge with budget thresholds, Plan YTD analysis  
✅ Monthly Detail - A-N column formulas with PEPM charts (rolling 24 months)  
✅ High-Cost Claimants - ISL-based filtering with Employer vs Stop Loss visualization  
✅ Formula Engines - Monthly columns, PEPM, Executive YTD, High Claimants  
✅ Dark-Mode UI - Uber-inspired design with emerald-500 accent

## API Routes

- `GET /api/health` - Health check
- `GET /api/exec-summary` - Executive summary YTD metrics
- `GET /api/monthly/all-plans` - Monthly data with A-N columns + PEPM
- `GET /api/monthly/:planId` - Plan-specific monthly data with A-N columns + PEPM
- `GET /api/hcc` - High-cost claimants with ISL filtering
- `POST /api/hcc` - Update claimant status
- `GET /api/inputs` - Configuration inputs
- `PUT /api/inputs` - Update configuration

## Development

```bash
npm run dev        # Start dev server
npm run build      # Build all packages
npm run lint       # Run linter
npm run clean      # Clean build artifacts

# Database commands
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema changes
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio
```

## Deployment

### Render.com

1. Create PostgreSQL database on Render
2. Create Web Service with:
   - Build Command: `npm install && npm run db:generate && npm run build`
   - Start Command: `cd apps/web && npm start`
   - Root Directory: (leave empty)
3. Set `DATABASE_URL` environment variable (use Internal Database URL + `?sslmode=require`)
4. Set `NODE_ENV=production`

**Note**: The service must be configured in the Render dashboard to use these build/start commands. The monorepo structure requires installing at the root level first.

## License

Proprietary - All Rights Reserved
