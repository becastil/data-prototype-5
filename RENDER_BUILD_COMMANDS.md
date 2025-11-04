# Recommended Render Build Commands

## Issue
Turbo monorepo builds are failing on Render due to workspace resolution issues.

## Solution: Sequential Build Without Turbo

Update your Render service with these commands:

### Build Command
```bash
npm install && cd packages/lib && npm run build && cd ../ui && npm run build && cd ../../apps/web && npx prisma generate && npm run build
```

### Start Command
```bash
cd apps/web && npm start
```

## Explanation

This command:
1. `npm install` - Installs all dependencies (including workspace symlinks)
2. `cd packages/lib && npm run build` - Builds lib package first (creates dist/)
3. `cd ../ui && npm run build` - Builds UI package (can now find @medical-reporting/lib)
4. `cd ../../apps/web && npx prisma generate` - Generates Prisma client
5. `npm run build` - Builds Next.js app

## Alternative: Keep Turbo (Advanced)

If you want to keep using turbo, ensure these environment variables are set:

```bash
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
```

This forces npm to install devDependencies (including TypeScript types) which are needed for builds.

## Quick Fix via Render Dashboard

1. Go to https://dashboard.render.com/web/srv-d4547rur433s73e4kkmg
2. Click "Settings"
3. Scroll to "Build & Deploy"
4. Update "Build Command" to the sequential command above
5. Click "Save Changes"
6. Click "Manual Deploy" → "Deploy latest commit"

