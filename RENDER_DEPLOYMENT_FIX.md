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

### Issue #4: **TypeScript Module Resolution Error** (Latest Deploy)
**Error**: `packages/ui/src/ClaimantDistributionChart.tsx(4,37): error TS2307: Cannot find module '@medical-reporting/lib'`
**Root Cause**: TypeScript module resolution failed to resolve the local package symlink in the Render CI environment during `tsc --build`.
**Fix Applied**: ✅ Updated `packages/ui/tsconfig.json` with explicit path mapping:
```json
"paths": {
  "@medical-reporting/lib": ["../lib"]
}
```
This ensures TypeScript can find the library types regardless of symlink state in the CI environment.

## Next Steps

1. **Commit and Push Changes**:
   ```bash
   git add .
   git commit -m "Fix Render deployment: Add TS path mappings for UI package"
   git push origin main
   ```

2. **Render Will Auto-Deploy**: Since auto-deploy is enabled, Render will automatically trigger a new deployment.

3. **Monitor Deployment**: Watch the Render dashboard at https://dashboard.render.com/web/srv-d4547rur433s73e4kkmg

## Deployment Status

Service: **data-prototype-5**  
URL: https://data-prototype-5.onrender.com  
Region: Oregon  
Status: Will be live after successful deployment

---

**Last Updated**: 2025-12-10
**Status**: Ready to deploy after git push
