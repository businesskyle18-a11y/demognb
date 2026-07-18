# GNB Dynamics — Unified Business Platform (Demo MVP)

A single web app demonstrating the Phase 1 acceptance-test loop from `SPEC.md`:
a Sales lead flows through accreditation, RFQ, and quotation into a Job Order;
Operations carries it through every stage to Delivery/Installation with a live
field-update feed; Accounting raises a cost sheet, invoice, and AR against it;
and Warehouse fulfills the resulting Material Request — all in one shared
database, with zero information exchanged outside the app.

See `CLAUDE.md` for build conventions and `SPEC.md` for the full product spec.

## Getting started

```bash
npm install       # also runs `prisma generate`
npm run db:setup  # applies the Prisma migration + seeds demo data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the **Acting as**
selector in the top-right corner to switch between the 12 seeded users/roles
and see how navigation and page access change per role (Sales, Production,
Printing Operator, QC, Delivery, Installation, Accounting, HR/Admin,
Purchasing, Warehouse, Management).

To reset the demo data at any point:

```bash
npm run db:seed
```

## What's real vs. simplified

This is a demo, not a production deployment. See "Implementation Notes" (§13)
in `SPEC.md` for the specific deltas — in short: SQLite instead of hosted
Postgres, a cookie-based role switcher instead of real login, and file
attachments as text references instead of uploaded binaries. The module
scope, data model, workflows, and role permissions themselves are built as
specified.
