# LogisticsInventory — Issues & Improvements Audit

**Date:** 2026-03-12
**Audited by:** Claude Code (automated agents)

## 1. Runtime Bugs

### 1.1 Backend API Bugs
- `/api/Report/valuation` — categoryBreakdown and warehouseBreakdown return "Uncategorized"/"Unassigned" for all items despite items having real category/warehouse names. Missing joins in the reporting query. **Impact:** Reports page charts show meaningless data.
- `/api/Inventory/low-stock` — categoryName and warehouseName are null for all items. Missing `.Include()` for navigation properties. **Impact:** Low stock alerts lack context.
- `/api/Report/total-value` returns key `totalInventoryValue` but frontend api/reports.ts expects `totalValue`. Currently a latent bug since `getTotalValue()` is never called by any page.

### 1.2 Frontend Bugs (Fixed in this session)
- `useAnimatedCounter` infinite re-render loop on Analytics page — caused by setState in requestAnimationFrame cascading through Recharts' useSyncExternalStore. **Fix:** Rewrote hook to animate via DOM refs, bypassing React state during animation.
- `SkeletonTable` rendered bare `<tbody>` inside Card's `<div>` — invalid HTML. **Fix:** Wrapped in `<table>` element.
- Unmemoized computed values in Analytics.tsx (`turnoverRate`, `carryingCost`) caused unnecessary effect re-triggers. **Fix:** Wrapped in useMemo.

### 1.3 Frontend Bugs (Not yet fixed)
- Settings preferences saved to localStorage but never consumed by any page. Affected keys: `logistics-refresh-interval` (Dashboard hardcodes 30s), `logistics-page-size` (Inventory hardcodes 20, Dashboard/Analytics hardcode 100), `logistics-currency` (never used anywhere).
- No 404 catch-all route in App.tsx — navigating to unknown paths renders blank page.
- No React error boundaries — lazy-loaded page failures or runtime errors crash the entire app.
- Inventory detail drawer (Inventory.tsx:87) fetches ALL stock movements with `getStockMovements({})` then filters client-side by SKU. Should use `getItemMovementHistory(item.id)` which is already available in the API layer.
- Toast positioning inconsistent: Dashboard uses context-based toast (top-right), all CRUD pages use useToastSimple + ToastContainer (bottom-right).
- PurchaseOrderItem TypeScript type missing `itemSKU` and `lineTotal` fields that the API returns.
- `location` field typed as `string` but API returns null for all items — should be `string | null`.

## 2. Code Quality Issues

### 2.1 Deprecated APIs
- Header.tsx:15 uses `navigator.platform` (deprecated). Should use `navigator.userAgentData?.platform` with fallback.

### 2.2 Cross-module coupling
- Reports.tsx imports Dashboard.module.css for layout classes.
- PurchaseOrders.tsx imports Dashboard.module.css for pipeline styles.
- Should extract shared styles into a dedicated CSS module.

### 2.3 Hardcoded values
- Hardcoded hex colors in TSX files: Dashboard.tsx (lines 202, 211, 220, 229, 316-320), Reports.tsx (90), Analytics.tsx (332, 337, 354, 375, 428, 436), Settings.tsx (118-120). Should use CSS variables from theme.css.
- Dashboard.tsx hardcodes POLL_INTERVAL = 30_000 instead of reading settings.
- Analytics.tsx hardcodes getInventory(1, 100) — incomplete if >100 items exist.
- Settings about section (Settings.tsx:278) says "React 18" but project uses React 19.

### 2.4 Unused dependencies
- `@tanstack/react-table` in package.json but never imported by any file.

### 2.5 Duplicate systems
- Two separate toast implementations: useToast.tsx (context-based) and useToastSimple.ts (local hook). Should consolidate into one system.

### 2.6 API layer
- camelCase response interceptor is effectively a no-op since the API already returns camelCase (not PascalCase as documented). Harmless but misleading.

## 3. Missing Features

### 3.1 Critical (blocks core logistics workflows)

| Feature | Description | Impact |
|-|-|-|
| Purchase Order creation UI | API supports createPurchaseOrder but no UI exists. Users can only advance status, not create POs. | Cannot complete end-to-end ordering workflow |
| Stock movement creation form | No UI to manually record stock IN/OUT/ADJUSTMENT | Cannot do inventory adjustments |
| Stock transfer between warehouses | No inter-warehouse transfer functionality | Cannot rebalance inventory |
| Reorder alert actions | Dashboard shows low stock but users can't act on it (e.g., auto-create PO) | Alerts are informational only |

### 3.2 High Priority (significant UX improvement)

| Feature | Description |
|-|-|
| Table sorting | No click-to-sort headers on any table |
| Search on CRUD pages | Only Inventory has search. Categories, Warehouses, Suppliers, PurchaseOrders, StockMovements lack it |
| Pagination on non-Inventory pages | Categories, Warehouses, Suppliers, StockMovements fetch full lists |
| Settings consumption | Wire refresh interval, page size, currency to consuming pages |
| Error boundary + 404 page | App crashes on errors, shows blank on unknown routes |

### 3.3 Medium Priority (polish and completeness)

| Feature | Description |
|-|-|
| Mobile-responsive tables | Sidebar collapses on mobile but tables don't reflow |
| Bulk actions | No multi-select or batch operations |
| PDF export | Only CSV export exists |
| Supplier performance metrics | No on-time delivery %, defect rates |
| PO detail view | Cannot view line items of individual purchase orders |
| Warehouse utilization endpoint | API exists at /api/Warehouse/{id}/utilization but frontend only uses list endpoint |

### 3.4 Low Priority (nice to have)

| Feature | Description |
|-|-|
| Keyboard shortcuts help dialog | ? key to show shortcuts |
| WebSocket real-time updates | Replace polling with push |
| Audit log page | Who changed what, when |
| Dashboard widget customization | Drag/resize widgets |
| Tenant switcher dropdown | Currently shows ID only |
| Scheduled/automated reports | No recurring report generation |

## 4. Architecture Concerns

### 4.1 Security (P0)
- **No authentication or authorization.** Any HTTP client can CRUD all data by setting X-Tenant-Id header. No JWT, no Identity, no user model.
- Tenant ID via unencrypted header is trivially spoofable.
- CORS allows all methods/headers from localhost origins.
- Rate limiting is global, not per-user.

### 4.2 Backend (P1)
- Generic repository calls SaveChangesAsync on every individual method — no Unit of Work pattern for batching.
- No caching layer (Redis) — every report query re-aggregates from DB.
- PurchaseOrder status is a hardcoded string, should be enum.
- FluentValidation validators exist but aren't consistently applied.

### 4.3 Frontend (P1)
- No caching/revalidation strategy (every page re-fetches on mount). TanStack Query or SWR recommended.
- Pure local state (useState) — no shared state management.
- No optimistic updates for mutations.
- Analytics.tsx is 500+ lines — needs decomposition.

### 4.4 Data Model (P2)
- Missing: lot/batch tracking, serial numbers, expiry dates, units of measure, warehouse zones/bins, currency field, movement reason codes.
- InventoryItem.location field exists but is always null — appears unused.

### 4.5 Testing (P2)
- API: 68 xUnit tests (good coverage).
- Frontend: 12 Vitest tests (Button + camelCase utility only). Pages, hooks, forms, API integration all untested.
- No E2E tests despite Playwright being configured.
- No load/performance tests.

### 4.6 Deployment (P3)
- Azure free tier (F1) will struggle under load — expect slow cold starts.
- React frontend not yet deployed (Vercel target, not configured).
- No database migration strategy documented.
- Docker Compose not tested end-to-end.

## 5. Summary

| Category | Count |
|-|-|
| Runtime bugs (backend) | 3 |
| Runtime bugs (frontend, fixed) | 3 |
| Runtime bugs (frontend, open) | 7 |
| Code quality issues | 10 |
| Missing features (critical) | 4 |
| Missing features (high) | 5 |
| Missing features (medium) | 6 |
| Missing features (low) | 6 |
| Architecture concerns | 12 |
| **Total items** | **56** |
