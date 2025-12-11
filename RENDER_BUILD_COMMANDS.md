# Recommended Render Build Commands

## Issue
Turbo monorepo builds are failing on Render due to workspace resolution issues.

## Solution: Sequential Build Without Turbo

Update your Render service with these commands:

### Build Command
```bash
npm install && cd apps/web && npx puppeteer browsers install chrome && cd ../.. && cd packages/lib && npm run build && cd ../ui && npm run build && cd ../../apps/web && npx prisma generate && npm run build
```

### Start Command
```bash
cd apps/web && npm start
```

## Explanation

This command:
1. `npm install` - Installs all dependencies (including workspace symlinks)
2. `cd apps/web && npx puppeteer browsers install chrome` - Explicitly installs Chrome for Puppeteer
3. `cd ../..` - Return to root directory
4. `cd packages/lib && npm run build` - Builds lib package first (creates dist/)
5. `cd ../ui && npm run build` - Builds UI package (can now find @medical-reporting/lib)
6. `cd ../../apps/web && npx prisma generate` - Generates Prisma client
7. `npm run build` - Builds Next.js app

## Alternative: Keep Turbo (Advanced)

If you want to keep using turbo, ensure these environment variables are set:

```bash
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
```

This forces npm to install devDependencies (including TypeScript types) which are needed for builds.

## ⚠️ ACTION REQUIRED: Update Render Build Command

The current turbo-based build is failing due to monorepo workspace resolution issues.

### **You MUST manually update the build command in Render Dashboard:**

1. Go to https://dashboard.render.com/web/srv-d4547rur433s73e4kkmg
2. Click "Settings"
3. Scroll to "Build & Deploy"
4. Replace the "Build Command" with:
   ```
   npm install && cd apps/web && npx puppeteer browsers install chrome && cd ../.. && cd packages/lib && npm run build && cd ../ui && npm run build && cd ../../apps/web && npx prisma generate && npm run build
   ```
5. Click "Save Changes"
6. Click "Manual Deploy" → "Deploy latest commit"

### Why This Is Necessary

Turbo parallel builds fail on Render because:
- The lib package builds successfully but turbo can't detect its outputs
- The UI package can't find @medical-reporting/lib during its parallel build
- Sequential builds ensure lib is fully built before UI starts

### Expected Result After Update

✅ lib package builds → creates dist/
✅ UI package builds → finds @medical-reporting/lib types
✅ web package builds → Next.js app compiles
✅ Chrome installed for Puppeteer PDF export
✅ Deployment succeeds

## Puppeteer Chrome Installation

The PDF export feature requires Chrome/Chromium to be installed. Chrome is explicitly installed during the build process using `npx puppeteer browsers install chrome`.

The Chrome browser is installed to the default Puppeteer cache directory (`~/.cache/puppeteer` or `/opt/render/.cache/puppeteer` on Render). The PDF exporter is configured to automatically detect and use the installed Chrome.

### Optional Environment Variables

If you encounter issues with Chrome detection, you can set the following environment variable in Render:

- `PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer` - Explicitly set the cache directory where Chrome is installed

The PDF exporter will automatically use this cache directory to locate the Chrome executable.

