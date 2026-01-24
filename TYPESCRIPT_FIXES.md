# TypeScript Build Fixes

## Common Issues Fixed

### 1. Supabase Query Result Types
Supabase queries with nested relations don't always have proper TypeScript inference. We've added explicit type annotations where needed.

### 2. Fixed Files

- `src/app/api/matches/route.ts` - Added types for `ApplicationWithApplicant` and `JobType`
- `src/app/api/stats/route.ts` - Added `PlacementWithApp` type for nested application queries

## How to Test Build Locally

```bash
cd frontend
npm run build
```

## If You Still See Type Errors

1. **Check the error message** - It will tell you which file and line number
2. **Common patterns to fix:**
   - Add type assertion: `(data as YourType)`
   - Add type annotation: `type YourType = { ... }`
   - Use optional chaining: `data?.property`
   - Add null checks: `if (data) { ... }`

## Quick Fix Template

If you see an error like:
```
Property 'X' does not exist on type 'Y'
```

Add a type assertion:
```typescript
type YourType = {
  X: string
  // ... other properties
}
const data = (queryResult as YourType[])
```
