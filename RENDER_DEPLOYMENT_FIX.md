# Render Deployment Troubleshooting & Fixes

## Issues Found

### Issue #1: **Turbo Not Found** (CRITICAL - Latest Deploy)
**Error**: `sh: 1: turbo: not found`

**Root Cause**: Turbo was in `devDependencies` but Render production builds don't install devDependencies.

**Fix Applied**: ✅ Moved `turbo` from `devDependencies` to `dependencies` in root `package.json`

```json
"dependencies": {
  "turbo": "^2.0.0"
}
```

### Issue #2: **Prisma Schema Validation** (Previous Deploys)
**Error**: `Error validating field 'client' in model 'HighClaimant': The relation field 'client' on model 'HighClaimant' is missing an opposite relation field on the model 'Client'.`

**Root Cause**: Git repository was out of sync with local schema.

**Fix**: The local schema already has the correct relation (`highClaimants HighClaimant[]` in Client model). This will be fixed when you push the latest schema.

### Issue #3: **Missing Unique Constraint**
**Fix Applied**: ✅ Added unique constraint to `UserAdjustment` model for upsert operations:

```prisma
@@unique([clientId, planYearId, itemNumber, monthDate])
```

This prevents duplicate adjustments for the same month.

## Next Steps

1. **Commit and Push Changes**:
   ```bash
   git add .
   git commit -m "Fix Render deployment: Move turbo to dependencies and add UserAdjustment unique constraint"
   git push origin main
   ```

2. **Render Will Auto-Deploy**: Since auto-deploy is enabled, Render will automatically trigger a new deployment.

3. **Monitor Deployment**: Watch the Render dashboard at https://dashboard.render.com/web/srv-d4547rur433s73e4kkmg

4. **Verify Build Success**: The build should now complete successfully with:
   - ✅ `npm install` installs turbo
   - ✅ `npm run db:generate` generates Prisma client
   - ✅ `npm run build` runs turbo build successfully

## Expected Build Output

```
npm install && npm run db:generate && npm run build
  ↓
✓ turbo installed
  ↓
✓ Prisma client generated
  ↓
✓ turbo run build
  ├─ @medical-reporting/lib build ✓
  ├─ @medical-reporting/ui build ✓
  └─ @medical-reporting/web build ✓
  ↓
Build succeeded ✓
```

## Alternative: Simplified Build Command

If issues persist, you can update the Render build command to avoid using turbo:

**Simplified Build Command**:
```bash
npm install && cd packages/lib && npm run build && cd ../ui && npm run build && cd ../../apps/web && npx prisma generate && npm run build
```

This builds packages sequentially without requiring turbo.

## Database Connection

Ensure the following environment variables are set in Render:

- `DATABASE_URL` - Postgres connection string (append `?sslmode=require`)
- `NODE_ENV=production`
- `BASE_URL` - Your Render service URL (https://data-prototype-5.onrender.com)

## Deployment Status

Service: **data-prototype-5**  
URL: https://data-prototype-5.onrender.com  
Region: Oregon  
Status: Will be live after successful deployment

---

**Last Updated**: 2025-11-04  
**Status**: Ready to deploy after git push

