# ABFI Agent Collaboration Context

> Shared context between Claude Code and Manus for coordinated development

## Current Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | Wouter |
| UI | shadcn/ui + Tailwind CSS |
| State/Data | TanStack Query via tRPC |
| Backend | Node.js + Express + tRPC |
| Database | MySQL + Drizzle ORM |
| Auth | Custom session-based (migrating from Supabase) |
| Maps | Google Maps JS API |

## Key File Locations

```
drizzle/schema.ts      # Database schema (Drizzle ORM)
server/db.ts           # Database functions (CRUD operations)
server/routers.ts      # Main tRPC router registry
server/futuresRouter.ts # Futures feature router
client/src/App.tsx     # Route definitions
client/src/pages/      # Page components
client/src/components/ # Shared UI components
client/src/lib/trpc.ts # tRPC client setup
```

## Implementation Patterns

### Adding a New Feature

1. **Schema** - Add tables to `drizzle/schema.ts`
2. **DB Functions** - Add CRUD to `server/db.ts`
3. **Router** - Create `server/[feature]Router.ts` and register in `routers.ts`
4. **Pages** - Create pages in `client/src/pages/`
5. **Routes** - Register in `client/src/App.tsx`

### tRPC Procedure Pattern

```typescript
// server/exampleRouter.ts
export const exampleRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getItemsByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await db.createItem({ ...input, userId: ctx.user.id });
    }),
});
```

### Drizzle Schema Pattern

```typescript
export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: int("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

---

## Active Tasks

| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| RSIE v2.1 Database Schema | Claude Code | Complete | 15 new tables added |
| RSIE tRPC Routers | Claude Code | Pending | Next priority |
| Explainer Graphics | Manus | In Progress | 7 sets of 6-panel graphics |
| Landing Page Mockups | Manus | Complete | 3 design alternatives |
| Data Source Research | Manus | Running | FIRMS, Tomorrow.io, Open-Meteo |

## Manus AI Coordination

### Project: ABFI Platform v2.1 Upgrade
**Project ID:** `TRVnNPfjGBpknA5nSGuo4C`

### Completed Tasks (with deliverables)
1. **SHA-256 Explainer** - 6 panels ready
2. **Weather Intelligence Explainer** - 6 panels ready
3. **Supply Shock Explainer** - 6 panels ready
4. **Landing Page Mockups** - 3 options (Corporate, Modern, Government)

### Running Tasks
- **RSIE Data Source Research** - API docs for FIRMS, Tomorrow.io, Open-Meteo
- **RSIE Data Architecture Explainer** - 6 panels (just created)
- **Futures Marketplace Explainer** - 6 panels (just created)

### Webhook
URL: `https://abfi.io/api/webhooks/manus`
Webhook ID: `DNwWhJF2F7SMJ6Ka3Zr2hJ`

## Pending Decisions

- Which landing page design option to use (A/B/C or hybrid)?
- DATABASE_URL configuration for migration push

## Handoff Notes

### From Claude Code (Latest Session - v2.1 Upgrade)
- Added 15 RSIE foundation tables to `drizzle/schema.ts`:
  - `dataSources`, `ingestionRuns` - Data provenance
  - `rsieScoringMethods` - Versioned scoring rubrics
  - `riskEvents` - Risk events with GeoJSON + bbox prefiltering
  - `supplierSites`, `supplierRiskExposure`, `contractRiskExposure` - Exposure tracking
  - `weatherGridDaily`, `forecastGridHourly` - Weather data
  - `userFeedback` - Survey responses
  - `abbaBaselineCells`, `biomassQualityProfiles` - ABBA/CSIRO data
  - `spatialLayers`, `intelligenceItems` - Spatial/news data
- Created Manus project and 7 tasks for graphics/research
- TypeScript compiles successfully
- Database migration requires DATABASE_URL (cloud DB credentials)

### For Next Agent
- Run `npm run db:push` when DATABASE_URL is configured
- Check Manus task outputs for completed graphics
- Download graphics from Manus CDN to `client/public/images/explainers/`
- Implement RSIE tRPC routers following patterns in `server/futuresRouter.ts`

---

## Quick Commands

```bash
# Dev server
npm run dev

# Run tests
npm test

# Type check
npx tsc --noEmit

# Build
npm run build

# Generate DB migration
npx drizzle-kit generate:mysql
```

---

*Last updated: 2025-12-16 by Claude Code*
