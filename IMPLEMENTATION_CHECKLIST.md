# Implementation Checklist & Testing Guide

## Pre-Implementation

- [ ] Review all documentation:
  - [ ] `API_OPTIMIZATION_SUMMARY.md` - Executive summary
  - [ ] `PERFORMANCE_OPTIMIZATION.md` - Complete guide
  - [ ] `REFACTORED_EXAMPLES.md` - Code examples
  - [ ] This file - Testing & implementation

- [ ] Backup current codebase
  ```bash
  git checkout -b optimize/api-requests
  git add -A && git commit -m "Backup before API optimization"
  ```

- [ ] Set up monitoring:
  - [ ] Access Vercel dashboard
  - [ ] Note current invocation count baseline
  - [ ] Set up daily metrics export
  - [ ] Create before/after comparison sheet

---

## Phase 1: Foundation Setup (1-2 days)

### Step 1: Deploy Core Files

- [ ] Copy `lib/api-client.ts` to your codebase
  ```bash
  cp lib/api-client.ts E:\GradeX\lib\
  ```

- [ ] Create hooks directory and files:
  ```bash
  mkdir -p E:\GradeX\hooks
  cp hooks/use-api.ts E:\GradeX\hooks/
  cp hooks/use-auth-user.ts E:\GradeX\hooks/
  cp hooks/use-user-tier.ts E:\GradeX\hooks/
  cp hooks/use-notifications.ts E:\GradeX\hooks/
  cp hooks/index.ts E:\GradeX\hooks/
  ```

- [ ] Deploy bootstrap endpoint:
  ```bash
  mkdir -p E:\GradeX\app\api\bootstrap
  cp app/api/bootstrap/route.ts E:\GradeX\app\api\bootstrap/
  ```

### Step 2: Test Foundation

- [ ] Run TypeScript compiler
  ```bash
  npx tsc --noEmit
  ```
  Expected: No errors

- [ ] Test bootstrap endpoint (unauthenticated)
  ```bash
  curl http://localhost:3000/api/bootstrap
  # Expected: 401 Unauthorized
  ```

- [ ] Test bootstrap endpoint (authenticated)
  ```
  1. Log in to app in browser
  2. Open browser DevTools → Network
  3. Load dashboard page
  4. Find /api/bootstrap request
  5. Verify response includes: user, tierLimits, tierUsage, notificationCount
  ```

- [ ] Verify cache headers
  ```bash
  curl -i http://localhost:3000/api/bootstrap | grep Cache-Control
  # Expected: private, max-age=300, stale-while-revalidate=600
  ```

### Step 3: Test Core Hooks

```typescript
// Test file: app/test-bootstrap.tsx
'use client'

import { useAuthUser } from '@/hooks'

export function TestBootstrap() {
  const { user, loading, error } = useAuthUser()

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {user && (
        <div>
          <p>User: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Banned: {user.isBanned}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] Add test component to dashboard
- [ ] Verify user data loads correctly
- [ ] Verify no TypeScript errors
- [ ] Remove test component after verification

---

## Phase 2: Component Migration (3-5 days)

### Priority 1: Core Components (High Impact)

#### 1. Update `components/app-shell.tsx`

```typescript
// BEFORE: 2 API calls
useEffect(() => {
  fetch('/api/auth/me').then(r => r.json()).then(setUser)
}, [])

useEffect(() => {
  fetch('/api/user/tier-limits').then(r => r.json()).then(setLimits)
}, [])

// AFTER: 0 direct API calls
const { user, loading: userLoading } = useAuthUser()
const { limits, loading: tierLoading } = useUserTier()
```

**Testing:**
- [ ] Component renders without errors
- [ ] User data displays correctly
- [ ] No console errors
- [ ] Network shows 0 direct API calls (only bootstrap)
- [ ] Verify cache is used (2nd load faster)

#### 2. Update `components/dashboard-layout.tsx`

Same pattern as app-shell:
- [ ] Remove `/api/auth/me` call
- [ ] Remove `/api/user/tier-limits` call
- [ ] Use `useAuthUser()` and `useUserTier()` hooks
- [ ] Test rendering and data display
- [ ] Verify shared cache with app-shell

#### 3. Update `components/ban-checker.tsx`

```typescript
// BEFORE: 2+ calls + 60sec polling
const { isBanned, banReason, loading } = useBanStatus()

// AFTER: 0 direct calls (from bootstrap)
useEffect(() => {
  if (isBanned) router.push('/banned')
}, [isBanned, router])
```

**Testing:**
- [ ] Component initializes correctly
- [ ] Still polls every 60 seconds (check Network)
- [ ] Can still ban/unban users as admin
- [ ] Banned users redirected to ban page

#### 4. Update `components/notifications-bell.tsx`

```typescript
// BEFORE: Initial load + 30sec polling + manual mutations
// AFTER: useNotifications() handles all
const {
  notifications,
  unreadCount,
  markAsRead,
  deleteNotification,
} = useNotifications()
```

**Testing:**
- [ ] Bell icon shows unread count
- [ ] Still polls every 30 seconds
- [ ] Mark as read works
- [ ] Delete notification works
- [ ] No race conditions with rapid updates

#### 5. Update `components/trial-expiration-checker.tsx`

```typescript
// BEFORE: 5min polling of /api/auth/me
const { trialDaysRemaining } = useTrialStatus()
// Uses bootstrap (no direct call)
```

**Testing:**
- [ ] Trial users see expiration notice
- [ ] Non-trial users see nothing
- [ ] No additional API calls

#### 6. Update `components/verify-email-banner.tsx`

```typescript
// BEFORE: Independent /api/auth/me call
const { isVerified } = useEmailVerified()
// Uses bootstrap (no direct call)
```

**Testing:**
- [ ] Unverified users see banner
- [ ] Verified users don't see banner
- [ ] Resend email works
- [ ] Banner disappears after verification

**Commit:** `git commit -m "refactor: migrate core components to use optimized hooks"`

### Priority 2: Dashboard & Pages (Medium Impact)

#### 7. Update `app/dashboard/page.tsx`

```typescript
// BEFORE: 4 sequential API calls
const { data: exams } = useApi('/api/exams')
const { data: stats } = useApi('/api/user/statistics')
const { user } = useAuthUser()
const { limits } = useUserTier()
// Now parallel instead of sequential
```

**Testing:**
- [ ] Dashboard loads faster (should be <1s with cache)
- [ ] All sections render correctly
- [ ] No missing data
- [ ] Check Network tab: 2-3 requests instead of 4-5

#### 8. Update Admin Pages

Update these admin pages to use centralized hooks:
- [ ] `app/admin/aulas/page.tsx` - Use single `useApi('/api/aulas')`
- [ ] `app/admin/banco-questoes/page.tsx` - Use `useApi('/api/banco/questoes')`
- [ ] `app/admin/cronogramas/page.tsx` - Use `useApi('/api/cronogramas')`

**Testing:**
- [ ] Admin pages load faster
- [ ] Data displays correctly
- [ ] Create/edit/delete still works
- [ ] No cache invalidation issues

**Commit:** `git commit -m "refactor: optimize dashboard and admin pages with hooks"`

### Priority 3: Feature Pages (Low Impact)

- [ ] `app/exams/page.tsx` - Use `useApi('/api/exams')`
- [ ] `app/aulas/page.tsx` - Use `useApi('/api/aulas')`
- [ ] `app/banco-questoes/page.tsx` - Use `useApi('/api/banco/questoes')`
- [ ] `app/cronogramas/page.tsx` - Use `useApi('/api/cronogramas')`

**Testing:**
- [ ] Pages load and render correctly
- [ ] Data displays properly
- [ ] No broken links or missing data

---

## Phase 3: Testing & Validation (2-3 days)

### Functional Testing

- [ ] **Authentication**
  - [ ] Login redirects to dashboard
  - [ ] Logout clears auth data
  - [ ] Protected routes work
  - [ ] Ban checking works

- [ ] **User Data**
  - [ ] User profile displays correctly
  - [ ] Tier limits show accurate counts
  - [ ] Notifications update in real-time
  - [ ] Trial status shows correctly

- [ ] **CRUD Operations**
  - [ ] Create exam works
  - [ ] Edit exam works
  - [ ] Delete exam works
  - [ ] Cache invalidates after mutations

- [ ] **Polling**
  - [ ] Notifications poll every 30 seconds
  - [ ] Ban status polls every 60 seconds
  - [ ] Check Network tab confirms intervals

### Performance Testing

#### Network Metrics

- [ ] Open DevTools → Network
- [ ] Log out
- [ ] Navigate through app
- [ ] Measure request count

**Expected Results:**
- First page load: 3-5 requests
- Subsequent pages: 1-2 requests (from cache)
- Total per session (30 min): 15-20 requests (down from 50-80)

#### Lighthouse Score

```bash
# Run in staging environment
npx lighthouse https://your-app.com --view
```

- [ ] Performance score increases
- [ ] First Contentful Paint (FCP) improves
- [ ] Largest Contentful Paint (LCP) improves

#### Load Test

```bash
# Using Apache Bench (adjust user count as needed)
ab -n 1000 -c 10 https://your-app.com/api/bootstrap
# Measure: requests/sec, avg response time
```

**Expected:**
- Higher requests/second
- Lower latency (cache hits < 10ms)

### Browser Testing

Test in all major browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

Verify on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Phase 4: Monitoring & Metrics (Ongoing)

### Daily Metrics Collection

Create a spreadsheet to track:

| Date | API Calls/Session | Vercel Invocations/Day | Cache Hit % | Errors | Notes |
|------|---|---|---|---|---|
| Day 1 (Before) | 50 | 50M | 0% | - | Baseline |
| Day 2 (After) | 15 | 12M | 75% | - | Post-deploy |
| Day 3 | 15 | 11.5M | 78% | - | Stabilizing |

### Vercel Dashboard Metrics

1. **Functions**
   - [ ] Daily invocation count
   - [ ] Peak invocations
   - [ ] Error rate
   - [ ] Average duration

2. **Traffic**
   - [ ] Request count
   - [ ] Bandwidth
   - [ ] Cache hit ratio

**Target Metrics:**
- Invocations: 70% reduction
- Bandwidth: 80% reduction
- Cache hit ratio: 60-80%
- Error rate: <0.1%
- Performance: Same or faster

### User Feedback

- [ ] Monitor support tickets for performance complaints
- [ ] Track crash reports in error monitoring (Sentry, etc.)
- [ ] Collect user feedback on page speed

---

## Phase 5: Optimization & Tuning (1 week)

### Cache Duration Tuning

Based on real traffic, adjust durations:

```typescript
// lib/api-client.ts
export const CACHE_DURATIONS = {
  USER: 5 * 60 * 1000,           // Adjust if stale data issues
  TIER_LIMITS: 5 * 60 * 1000,    // Increase if overest., decrease if underutilized
  NOTIFICATIONS: 30 * 1000,      // Can increase to 60sec if polling too much
  // ... etc
}
```

- [ ] Analyze cache hit rate
- [ ] Identify underutilized caches (low hit rate → increase TTL)
- [ ] Identify stale data issues (high hit rate but user complaints → decrease TTL)
- [ ] Make adjustments
- [ ] Re-measure metrics

### Polling Interval Optimization

Current intervals are reasonable, but can fine-tune:

```typescript
// If notifications are always stale:
useNotifications({ refetchInterval: 15000 }) // More frequent

// If polling causing too many invocations:
useNotifications({ refetchInterval: 60000 }) // Less frequent
```

- [ ] Monitor notification staleness
- [ ] Check if polling needs adjustment
- [ ] Update if necessary

### WebSocket Migration (Future)

For real-time support chat, consider WebSocket:

```typescript
// Future: Replace 5-second polling with WebSocket
const { socket } = useWebSocket('wss://api.example.com/tickets')

socket.on('ticket:update', (ticket) => {
  setTickets(prev => [...prev, ticket])
})
```

This could save ~17M daily invocations from support-chat polling alone.

---

## Rollback Plan (If Issues)

### If High Error Rate

```bash
git revert <commit-hash>
git push
# Redeploy old code
npm run build && npm run start
```

### If Users Report Missing Data

1. Check bootstrap endpoint response
2. Verify all fields are included
3. Increase cache durations temporarily
4. Check for concurrent mutation issues

### If Cache Coherency Issues

```typescript
// Clear cache as emergency measure
import { clearCache } from '@/lib/api-client'
clearCache() // Users will need to refresh page

// Or reset specific endpoint
invalidateCache('/api/bootstrap')
```

---

## Success Criteria

**Green light to mark implementation complete when:**

- [ ] All tests pass (unit, integration, E2E)
- [ ] Vercel invocations reduced by 40%+ (Target: 70%)
- [ ] Error rate remains <0.1%
- [ ] No user-facing bugs reported
- [ ] Performance metrics improved (Page load time ↓)
- [ ] Documentation complete and reviewed
- [ ] Team trained on new patterns
- [ ] Monitoring in place for ongoing optimization

---

## Post-Implementation

### Documentation Updates

- [ ] Update internal wiki with new patterns
- [ ] Create developer onboarding guide
- [ ] Document cache invalidation patterns
- [ ] Add best practices guide

### Team Training

- [ ] Conduct code review sessions
- [ ] Show examples of new hook usage
- [ ] Explain caching strategy
- [ ] Train on monitoring metrics

### Long-term Monitoring

- [ ] Set up alerting for invocation spikes
- [ ] Monthly metrics review
- [ ] Quarterly optimization review
- [ ] Adjust based on user growth

---

## Troubleshooting

### Problem: Bootstrap endpoint returns 401

**Solution:**
- Check authentication middleware
- Verify JWT token is valid
- Check if user is banned
- Look at server logs

### Problem: Stale data displayed

**Solution:**
- Decrease cache TTL
- Use `refetch()` after mutations
- Call `invalidateCache()` explicitly

### Problem: Cache not working

**Solution:**
- Check `getCacheStats()` in console
- Verify `skipCache` not accidentally enabled
- Check browser DevTools for cache headers
- Clear localStorage: `localStorage.clear()`

### Problem: Performance not improved

**Solution:**
- Verify bootstrap endpoint is being called
- Check cache hit ratio: `getCacheStats()`
- Look at Network tab for duplicate requests
- Ensure all old API calls are removed

---

## Timeline Summary

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 1-2 days | Deploy foundation, test core |
| Phase 2 | 3-5 days | Migrate 15+ components |
| Phase 3 | 2-3 days | Test & validation |
| Phase 4 | 1 week | Monitor & collect metrics |
| Phase 5 | 1+ week | Tune & optimize |
| **Total** | **2-3 weeks** | **Production deployment** |

---

## Questions & Support

For questions during implementation:
1. Check detailed guides: `PERFORMANCE_OPTIMIZATION.md`
2. Review code examples: `REFACTORED_EXAMPLES.md`
3. Check inline code comments in hook files
4. Review test cases above

---

**Checklist created:** February 3, 2026
**Last updated:** February 3, 2026
**Status:** Ready for implementation
