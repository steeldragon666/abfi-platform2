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
| Futures migration | Claude Code | Complete | All 6 phases done |
| Mock data fallback | Claude Code | Complete | ID-specific for buyer/supplier detail |

## Pending Decisions

<!-- Add architectural decisions that need input -->

## Handoff Notes

### From Claude Code (Latest Session)
- Completed futures mock data fallback for `FuturesDetailBuyer.tsx` and `FuturesDetailSupplier.tsx`
- Fixed SelectItem empty value error in `FuturesMarketplace.tsx`
- Updated Google Maps API key in `.env` (restricted to abfi.io)
- All 179 tests passing
- Build successful (280.89 kB main bundle)

### For Next Agent
- Supplier detail page (`/supplier/futures/:id`) requires auth to view
- Map page may not work on localhost (API key restricted to abfi.io)
- Consider adding localhost to Google Maps API key restrictions for dev

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
