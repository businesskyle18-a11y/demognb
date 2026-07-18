# GNB Dynamics — Unified Business Platform: MVP Build Spec
**Purpose of this document:** Build-ready prompt for Claude Code. Defines scope, data model, workflows, roles, and phased build order, based on GNB Dynamics' actual agreed SOPs (Sales, Accounting, Operations, Hiring, Inventory, Tool/Equipment, Purchasing — July 2026). Feed this file plus `CLAUDE.md` to Claude Code at the start of the project, then build one phase at a time.
---
## 1. Company Context
GNB Dynamics Corporation is a B2B large-format printing and fabrication company (billboards, tarpaulins, printing/advertising products, fabrication, service, inventory sales). Corporate/enterprise clients, project-based work.
**Current stack:** QuickBooks Online (quoting + accounting), Google Workspace (files, ad hoc automation).
**Decision: QBO is being cut completely.** This system is the full replacement — including accounting, quoting, invoicing, and reporting. There is no fallback system, so accounting cannot be a "later phase" — it ships in Phase 1 alongside everything else.
---
## 2. Problems This System Solves
1. Weak accounting / AR-AP / cash flow / P&L tracking and documentation
2. No structured lead generation/tracking
3. Quotation process not centralized across Sales
4. No user/employee management across Back Office and Operations
5. No system for memos, work instructions, SOPs, or role-to-person assignment
6. Payroll and BIR reporting use separate, inconsistent internal vs. external records
7. No real inventory/equipment management
8. Reporting inflexibility and limited inventory handling (was QBO's limitation — being fully replaced)
9. Too many disconnected software tools
10. Miscommunication between Sales and Operations at Job Order handoff
11. No visibility into live progress during delivery/installation dispatch
## 3. Solution Direction
One web application, one shared database, role-based access per department — centered on **Client → Job Order** as the spine that Sales, Accounting, Operations, Inventory, Purchasing, and HR all read and write to.
---
## 4. MVP Philosophy: Skeleton of the Entire Business
The MVP is every module from the SOPs, working end-to-end, at a **lean but real** depth — not one deep module with the rest missing. A module is "MVP-complete" when a staff member can do their actual daily SOP step in the app instead of on paper, Messenger, or Excel, and the next department sees the result without being told separately.
### Module-by-module MVP bar
| # | Module | MVP-complete (build now) | Deferred (Phase 2+) |
|---|--------|---------------------------|----------------------|
| 1 | **Sales** | Lead intake → Accreditation checklist → RFQ intake (file uploads) → Quotation builder with price-ceiling approval logic → Job Order creation | Lead-source analytics, auto-parsing inbound RFQ emails |
| 2 | **Operations** | Job Order queue → stage tracker (Printing → Production → QC → Delivery → Installation → Back Job), each with responsible person, notes, and required records (Material Request, QC checklist, POD, Installation Acceptance) | Machine/press-level scheduling, route optimization |
| 3 | **Field Tracking (Delivery/Installation)** | Field staff post status updates + photo + notes from their phone at each checkpoint (dispatched → en route → arrived → installing → completed); Sales/Ops see live status and photo feed per Job Order | GPS/continuous location tracking, geofencing, ETA prediction |
| 4 | **Accounting** *(replaces QBO)* | Cost sheet & budget approval per Job Order, disbursement voucher log, invoicing (with DR-based supporting docs) and AR tracking, AP tracking, operating expense recording (fixed + variable/petty cash), month-end close checklist (bank reconciliation, project financial reports), cash flow + budget-vs-actual + collection + AP reports | Automated bank feed reconciliation, multi-currency, complex tax engine |
| 5 | **Inventory** | Stock in/out log tied to request forms, reorder-point flagging, restock request → receive → update cycle | Barcode/RFID scanning, demand forecasting |
| 6 | **Tool/Equipment** | Tool tagging, release/return log with condition check, scheduled inspection log, repair request flow | Predictive maintenance scheduling |
| 7 | **Purchasing** | Request-to-Purchase intake → RFQ-to-supplier → PO creation/issuance → receiving log (updates Inventory) → funds request to Accounting; Subcontractor flow (3-quote sourcing → work order → monitoring → payment request) | Supplier scorecards, auto-PO generation |
| 8 | **HR / Admin** | Employee directory, position-to-SOP/work-instruction assignment, memo & document repository, manpower request → approval → job posting → applicant list → interview scheduling → selection → background check → offer → onboarding (tracked as statuses, not automated) | Full ATS with resume parsing, e-signature workflows |
| 9 | **Payroll & BIR** | HR payroll worksheet → Accounting review/disbursement → one-click export to an accountant-ready BIR template, single source of data (fixes problem #6 directly) | In-app payroll computation engine, government e-filing integration |
| 10 | **User & Access Management** | Roles: Sales, Operations, Field Staff, Accounting, HR, Purchasing, Warehouse/Inventory, Management (Admin); permission-gated screens/actions | SSO, field-level permission granularity |
**The backbone:** every module's records reference a **Client** and, where applicable, a **Job Order**. Every action is timestamped and attributed to a **User**. This is what fixes #9 (disconnected tools) and #10 (Sales↔Ops miscommunication) — one record, not five copies of it in five tools.
---
## 5. Roles (v1)
| Role | Primary modules |
|---|---|
| Sales Personnel | Sales |
| Production Personnel | Operations, Inventory (request only) |
| Printing Operator | Operations |
| QC Personnel | Operations |
| Delivery Personnel | Operations, Field Tracking |
| Installation Team | Operations, Field Tracking |
| Accounting Personnel | Accounting, Purchasing (payment step), Payroll disbursement |
| HR/Admin Personnel | HR, Payroll (worksheet) |
| Purchasing Personnel | Purchasing, Inventory (restock coordination) |
| Warehouse/Tool Custodian | Inventory, Tool/Equipment |
| Management/President | All modules — read + approve (budgets, quotations, manpower requests), user management |
Role-based permissions for MVP (not per-user granularity).
---
## 6. Core Data Model (MVP)

```
User
 - id, name, email, role, department, position, status (active/inactive)
Client
 - id, company_name, contact_person, contact_info, accreditation_docs[], accreditation_status
Lead
 - id, client_id (nullable until qualified), source (referral/online/direct), status, notes, owner_user_id
RFQ
 - id, client_id, received_date, specs_text, attached_files[], dimensions, quantity, ocular_required, status
Quotation
 - id, rfq_id, client_id, line_items[], subtotal, discount, total, requires_approval (derived from price ceiling),
   approved_by, approval_status, status (draft/sent/accepted/rejected), sent_date
JobOrder
 - id, quotation_id, client_id, job_number, project_details, notice_to_proceed_date, created_by,
   current_stage (created/printing/production/qc/delivery/installation/back_job/closed),
   stage_history[] (stage, user_id, timestamp, notes, attachments[])
MaterialRequest
 - id, job_order_id, requested_by, items[] (item, qty, available_stock, status), status
FieldUpdate
 - id, job_order_id, stage (dispatch/delivery/installation), user_id, status_label
   (dispatched/en_route/arrived/in_progress/completed/issue), photo_url, notes, timestamp
InventoryItem
 - id, sku, name, category, unit, qty_on_hand, reorder_point, location
InventoryTransaction
 - id, item_id, type (in/out), qty, related_request_id, user_id, timestamp
ToolEquipment
 - id, name, tag_id, status (available/released/maintenance), assigned_to, condition_notes, last_inspection_date
PurchaseRequestToPurchase
 - id, source_type (inventory/tool_equipment/job_order), source_id, requested_by, status
PurchaseOrder
 - id, supplier_name, request_to_purchase_id, items[], status, total_amount, issued_date
SubcontractorWorkOrder
 - id, job_order_id, scope_of_work, quotations_received[] (min 3), selected_subcontractor, cost, timeline,
   status, payment_request_status
CostSheet
 - id, job_order_id, estimated_materials, estimated_labor, estimated_subcon, budget_approved_by, approval_status
DisbursementVoucher
 - id, supplier_or_payee, amount, purpose, related_po_id, supporting_docs[], status, prepared_by, approved_by
Invoice
 - id, job_order_id, client_id, dr_reference, line_items[], total, status, submission_platform (internal/3rd-party name)
ARRecord / APRecord
 - id, client_or_supplier_id, job_order_id (nullable), amount, due_date, status (open/partial/paid), payment_history[]
OperatingExpense
 - id, type (fixed/variable), category, amount, date, liquidation_docs[], recorded_by
Employee
 - id, user_id, position, department, date_hired, employment_status, assigned_sops[]
ManpowerRequest
 - id, requesting_department, position, approved_by, status
JobPosting
 - id, manpower_request_id, description, banner_url, channels[], status
Applicant
 - id, job_posting_id, name, contact, resume_url, status (applied/shortlisted/interview/selected/background_check/offer/onboarded/rejected)
PayrollEntry
 - id, employee_id, period, base_pay, deductions[], net_pay, status, reviewed_by
MemoOrSOP
 - id, title, type (memo/work_instruction/process/procedure), department, assigned_positions[], file_url, effective_date
```

---
## 7. Phased Build Order
### **Phase 1 — Full Skeleton (MVP)**
Every module above at MVP-complete depth. Build order within Phase 1:
1. **Foundation:** User/Role/Auth, Client records — everything else depends on this.
2. **Sales → Job Order backbone:** Lead → Accreditation → RFQ → Quotation (with approval logic) → Job Order. This is the critical handoff path (fixes #3, #9, #10) — get it working end-to-end and tested before moving on.
3. **Operations stage tracking:** Job Order queue, all six stages, required records per stage (Material Request, QC checklist, POD, Installation Acceptance, Back Job).
4. **Field Tracking:** status + photo + notes updates from Delivery and Installation staff, visible live to Sales/Ops/Management on the Job Order (fixes #11).
5. **Accounting:** Cost sheet/budget approval (tied to Job Order from step 2), disbursement voucher, invoicing/AR, AP, operating expenses, month-end close checklist, the four core reports (cash flow, budget-vs-actual, collection, AP).
6. **Inventory & Tool/Equipment:** stock and tool logs, reorder/restock flow, tagging/release/return.
7. **Purchasing:** Request-to-Purchase → RFQ-to-supplier → PO → receiving (wired to Inventory) → funds request (wired to Accounting Disbursement); Subcontractor flow.
8. **HR/Admin:** Employee directory, SOP/memo repository with position assignment, hiring pipeline (manpower request → onboarding, tracked as statuses).
9. **Payroll & BIR export:** payroll worksheet, Accounting review/disbursement, BIR-ready export.
**Phase 1 acceptance test (the whole company loop):**
A Sales user takes a lead through to a submitted Job Order. An Operations user sees it appear, moves it through every stage to Delivery/Installation, posting live status + photo + notes at each step. Accounting sees the Job Order's cost sheet, raises an invoice against it, and tracks the resulting AR. A Warehouse user sees the Material Request generated by Operations and logs the stock release. All of this happens with **zero information exchanged outside the app.**
### **Phase 2 — Depth & Automation**
- Automated notifications (email, not just in-app)
- Dashboards/analytics beyond the four core reports
- In-app payroll computation
- Applicant tracking depth (resume parsing, e-signature)
- Supplier scorecards, demand forecasting for inventory
- GPS/continuous location tracking for field staff (if manual photo+status proves insufficient)
### **Phase 3 — Scale & Integration**
- Government e-filing integration
- Predictive maintenance for equipment
- Advanced BI/reporting
- Mobile app polish for field roles (native app vs. mobile web, based on Phase 1/2 usage)
---
## 8. Screens (Phase 1)
- **Dashboard** (role-aware): open leads, pending quotation approvals, active Job Orders by stage with live field status, low-stock alerts, AR/AP summary, cash flow snapshot
- **Leads & Clients**
- **RFQs** (with file viewer)
- **Quotations** (builder + approval queue)
- **Job Orders** (kanban by stage, detail with full stage history, attachments, and live field update feed with photos)
- **Inventory** (stock list, transaction log)
- **Tool/Equipment Register**
- **Purchasing** (Request-to-Purchase queue, PO list/detail, receiving log, subcontractor work orders)
- **Accounting** (cost sheets, disbursement vouchers, invoices/AR, AP, operating expenses, month-end checklist, the four reports)
- **HR** (employee directory, SOP/memo repository, hiring pipeline board)
- **Payroll** (worksheet, BIR export)
- **Admin** (user management, role assignment)
---
## 9. Non-Functional Requirements
- **Web app**, desktop-first for back office; mobile-responsive for Operations, Delivery, Installation, and Warehouse staff.
- **Field updates from mobile:** photo capture + status dropdown + notes, optimized for a phone camera and spotty connectivity (queue-and-retry on upload failure).
- **Audit trail:** every record change attributed to a user and timestamped.
- **File attachments:** centralized storage for RFQ specs/drawings, POD, acceptance forms, accreditation docs, disbursement supporting docs (replaces scattered Google Drive usage).
- **Notifications:** in-app for MVP (e.g., "Job Order #123 assigned to you," "New field update on Job Order #123").
- **Search/filter:** on Clients, Job Orders, Inventory, Invoices at minimum.
- **Data export:** CSV/PDF export on ledgers, reports, and the BIR payroll template.
---
## 10. Assumptions (flag if wrong)
- **Stack:** Next.js (frontend + API routes) + Postgres (via Supabase) for auth, roles, file/photo storage, and real-time Job Order/field-update sync. Chosen for build speed and to avoid per-department software licensing. Open to a different stack if your team has a preference.
- **Users:** under ~50 concurrent internal users for MVP sizing — flag if significantly larger.
- **Approval price ceiling logic:** configurable by Management (a settings value), not hardcoded, since it will change over time.
- **BIR export format:** MVP produces a structured export (CSV/PDF) matching what your external accountant currently receives — exact field mapping to be confirmed with the accountant before Phase 1 payroll build.
- **Field tracking:** photo + manual status + notes only for Phase 1, no GPS (per your confirmation) — GPS is a Phase 2 candidate if manual updates prove insufficient.
## 11. Explicitly Out of Scope for Phase 1
- In-app payroll computation engine (government-compliant net-pay computation)
- GPS/continuous location tracking
- Resume parsing / full ATS automation, e-signatures
- Barcode/RFID scanning
- Supplier performance scorecards, demand forecasting
- Government e-filing integration
- Advanced BI dashboards beyond the four core Accounting reports
---
## 12. Build Instructions for Claude Code
1. Create `CLAUDE.md` at project root capturing: tech stack, "QBO is fully replaced — no QBO integration anywhere," data model conventions from Section 6, and this file's location, so every session has this context automatically.
2. Scaffold the Next.js + Supabase project with the Section 6 schema as the initial migration.
3. Build Foundation (User/Role/Auth, Client) first.
4. Build the Sales → Job Order backbone (Phase 1, step 2) end-to-end and pass its own mini version of the acceptance test before moving to Operations.
5. Proceed through Phase 1 steps 3–9 in order — each step should be usable and tested before starting the next, since later steps (Accounting, Purchasing) reference records created by earlier ones (Job Order, Material Request).
6. Run the full Phase 1 acceptance test in Section 7 before calling Phase 1 done.
7. Commit to git at the end of each numbered step in Section 7, not just at the end of the phase — this keeps rollback granular.
8. Every form should map field-for-field to the paper forms named in the SOPs (Quotation Form, Job Order Form, Material Request Form, QC Inspection Checklist, Delivery Receipt/POD, Installation Acceptance Form, Back Job/Concern Report Form, Cost Sheet/Budget Approval Form, Disbursement Voucher, Invoice Template, HR Payroll Report Template, Manpower Request Form) so staff aren't relearning a new form structure.
9. Do not build anything listed in Section 11 unless explicitly requested — resist scope creep back into "one deep module, rest thin."
10. Do not add any QuickBooks Online integration, import, or export path — confirm with the user before adding any third-party accounting tool dependency.

---
## 13. Implementation Notes (this build)

This is a **demo MVP**, built to let stakeholders click through the Phase 1
acceptance-test loop end-to-end before investing in real infrastructure
(Supabase, file storage, real auth, deployment). Deltas from Section 10's
assumptions, and why:

- **SQLite instead of Postgres/Supabase.** No external project to provision in
  this environment. The schema (`prisma/schema.prisma`) mirrors Section 6
  directly; moving to Postgres later is a `datasource` swap plus a fresh
  `prisma migrate dev`, not a data-model rewrite.
- **No real authentication.** A role switcher (`src/components/RoleSwitcher.tsx`)
  picks the "acting user" from the seeded roster and stores it in a cookie.
  Every module still enforces its role gate (`canAccess` in
  `src/lib/constants.ts`) against whoever is acting, so the permission model
  is real even though login isn't.
- **File attachments are text references, not uploads.** RFQ specs, DR/POD
  references, accreditation docs, disbursement supporting docs, and field-update
  photos are stored as filenames/URLs (comma-separated lists or a plain URL
  field) rather than uploaded binaries. There's no object storage wired up yet.
- **Notifications are not built.** The spec calls for in-app notifications;
  this demo relies on `revalidatePath` keeping every screen live instead. The
  dashboard's "Live Field Update Feed" plus each Job Order's own feed cover the
  same "who needs to know" need for a demo.
- Everything else — the module list, the Client → Job Order backbone, the
  price-ceiling approval logic, the six-stage Job Order tracker, the four
  Accounting reports, the BIR CSV export — is built as specified above.
