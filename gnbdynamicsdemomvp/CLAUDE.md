@AGENTS.md

# GNB Dynamics — Unified Business Platform

This repo is the MVP build of GNB Dynamics' unified business platform: one web app,
one shared database, role-based access per department, centered on a
**Client → Job Order** backbone that Sales, Accounting, Operations, Inventory,
Purchasing, and HR all read and write to. See `SPEC.md` at the project root for the
full build spec (company context, module-by-module MVP bar, data model, phased
build order, screens, non-functional requirements). Read it before making
structural changes.

## QBO is fully replaced

QuickBooks Online has been cut completely. This system **is** the accounting
system — quoting, invoicing, AR/AP, expenses, and reporting all live here.
**Do not add any QuickBooks Online integration, import, or export path.** Do not
add any other third-party accounting tool dependency without explicit user
confirmation first.

## Tech stack

- **Next.js 16 (App Router) + TypeScript + Tailwind v4**, deployed as a single app
  (no separate frontend/backend).
- **Prisma 6 + SQLite** (`prisma/dev.db`) for the demo. This stands in for the
  Postgres/Supabase target described in the spec's assumptions (Section 10) —
  swapping the datasource to Postgres later is a `prisma/schema.prisma`
  `datasource` change plus a fresh migration, not a rewrite.
- **No real authentication.** The "acting user" is picked from a role switcher in
  the top bar and stored in a cookie (`src/lib/auth.ts`). This is a deliberate
  demo simplification — replace with real Supabase/Auth.js auth before this goes
  anywhere near production data.
- Server Actions (`"use server"` files named `actions.ts` per route) handle all
  mutations; there is no separate REST/GraphQL API layer except
  `src/app/payroll/export/route.ts` (CSV download).

### Next.js 16 specifics (this is not the Next.js you remember)

- `params` and `searchParams` in Server Components and Route Handlers are
  **Promises** — always `await` them.
- `cookies()` / `headers()` from `next/headers` are **async**.
- Middleware is renamed **`proxy.ts`** (not used in this project yet).
- Full details: `node_modules/next/dist/docs/01-app/`.

## Data model conventions (Section 6 of the spec)

- Every record that matters to more than one department hangs off `Client` and,
  where applicable, `JobOrder` — that is the whole point of the backbone (fixes
  "disconnected tools" and "Sales↔Ops miscommunication" per the spec's problem
  list).
- SQLite has no native array/JSON column type in this Prisma setup, so list-ish
  fields (`lineItems`, `attachedFiles`, `paymentHistory`, `deductions`, etc.) are
  stored as `String` columns holding `JSON.stringify(...)`. Always
  `JSON.parse(...)` on read; never assume a native array.
- Every write from a form goes through a Server Action in that route's
  `actions.ts`, gets the acting user via `getActingUser()`, and calls
  `revalidatePath(...)` on every path that displays the changed data (including
  `/` for dashboard counts and cross-module snapshots).
- Enum-like status/stage fields are plain `String`, not Prisma enums (except
  `User.role`), so new statuses can be added without a migration.

## Role-based access

Roles and per-module access are defined in `src/lib/constants.ts`
(`ROLES`, `MODULE_ACCESS`, `canAccess`). `MANAGEMENT` always has full access.
Every page checks `canAccess(user.role, "<module-key>")` at the top and renders
`<Restricted />` instead of the page body if the acting role isn't permitted —
this is enforced per-page, not via middleware, since there's no real auth
session to gate on yet.

## Seed data

`prisma/seed.ts` populates one full pass of the Phase 1 acceptance-test loop
(Section 7): a Sales lead through to a submitted Job Order that Operations
carries through every stage to Delivery/Installation with live field updates,
Accounting invoicing it and tracking the resulting AR, and a Warehouse
Material Request being logged. Re-run with `npm run db:seed` (destructive —
wipes and reseeds). `npm run db:setup` runs migrations then seeds, for a fresh
clone.

## Running locally

```bash
npm install          # also runs `prisma generate` via postinstall
npm run db:setup      # applies migrations + seeds demo data
npm run dev
```

## Scope discipline

Section 11 of the spec lists what's explicitly **out of scope** for Phase 1
(in-app payroll computation engine, GPS tracking, resume parsing/e-signatures,
barcode/RFID, supplier scorecards/demand forecasting, gov't e-filing,
BI dashboards beyond the four Accounting reports). Don't build these unless the
user explicitly asks — the MVP's whole premise is a lean skeleton across every
module rather than one deep module with the rest missing (Section 4).
