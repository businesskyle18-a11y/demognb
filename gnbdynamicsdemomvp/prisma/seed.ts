import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function json(v: unknown) {
  return JSON.stringify(v);
}

async function main() {
  console.log("Seeding GNB Dynamics demo data...");

  await prisma.$transaction([
    prisma.payrollEntry.deleteMany(),
    prisma.applicant.deleteMany(),
    prisma.jobPosting.deleteMany(),
    prisma.manpowerRequest.deleteMany(),
    prisma.memoOrSop.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.operatingExpense.deleteMany(),
    prisma.monthEndChecklistItem.deleteMany(),
    prisma.aRRecord.deleteMany(),
    prisma.aPRecord.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.disbursementVoucher.deleteMany(),
    prisma.costSheet.deleteMany(),
    prisma.subcontractorWorkOrder.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.requestToPurchase.deleteMany(),
    prisma.toolEquipment.deleteMany(),
    prisma.inventoryTransaction.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.fieldUpdate.deleteMany(),
    prisma.materialRequest.deleteMany(),
    prisma.stageEvent.deleteMany(),
    prisma.jobOrder.deleteMany(),
    prisma.quotation.deleteMany(),
    prisma.rfq.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.client.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ---------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------
  await prisma.setting.create({
    data: { key: "quotation_approval_ceiling", value: "150000" },
  });

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------
  const [
    president,
    salesRep,
    salesRep2,
    prodLead,
    printOp,
    qcInspector,
    driver,
    installer,
    accountant,
    hrOfficer,
    purchasingOfficer,
    warehouseCustodian,
  ] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Gerardo Bautista",
        email: "gerardo@gnbdynamics.com",
        role: "MANAGEMENT",
        department: "Management",
        position: "President",
      },
    }),
    prisma.user.create({
      data: {
        name: "Aira Santos",
        email: "aira.santos@gnbdynamics.com",
        role: "SALES",
        department: "Sales",
        position: "Account Executive",
      },
    }),
    prisma.user.create({
      data: {
        name: "Marco Villanueva",
        email: "marco.villanueva@gnbdynamics.com",
        role: "SALES",
        department: "Sales",
        position: "Account Executive",
      },
    }),
    prisma.user.create({
      data: {
        name: "Ramon Cruz",
        email: "ramon.cruz@gnbdynamics.com",
        role: "PRODUCTION",
        department: "Operations",
        position: "Production Lead",
      },
    }),
    prisma.user.create({
      data: {
        name: "Bea Fernandez",
        email: "bea.fernandez@gnbdynamics.com",
        role: "PRINTING_OPERATOR",
        department: "Operations",
        position: "Printing Operator",
      },
    }),
    prisma.user.create({
      data: {
        name: "Noel Reyes",
        email: "noel.reyes@gnbdynamics.com",
        role: "QC",
        department: "Operations",
        position: "QC Inspector",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jun Aquino",
        email: "jun.aquino@gnbdynamics.com",
        role: "DELIVERY",
        department: "Operations",
        position: "Delivery Driver",
      },
    }),
    prisma.user.create({
      data: {
        name: "Paolo Mendoza",
        email: "paolo.mendoza@gnbdynamics.com",
        role: "INSTALLATION",
        department: "Operations",
        position: "Installation Lead",
      },
    }),
    prisma.user.create({
      data: {
        name: "Liza Tan",
        email: "liza.tan@gnbdynamics.com",
        role: "ACCOUNTING",
        department: "Accounting",
        position: "Accounting Officer",
      },
    }),
    prisma.user.create({
      data: {
        name: "Grace Uy",
        email: "grace.uy@gnbdynamics.com",
        role: "HR_ADMIN",
        department: "HR",
        position: "HR/Admin Officer",
      },
    }),
    prisma.user.create({
      data: {
        name: "Edwin Garcia",
        email: "edwin.garcia@gnbdynamics.com",
        role: "PURCHASING",
        department: "Purchasing",
        position: "Purchasing Officer",
      },
    }),
    prisma.user.create({
      data: {
        name: "Tessie Ramos",
        email: "tessie.ramos@gnbdynamics.com",
        role: "WAREHOUSE",
        department: "Warehouse",
        position: "Warehouse/Tool Custodian",
      },
    }),
  ]);

  // ---------------------------------------------------------------------
  // Clients
  // ---------------------------------------------------------------------
  const clientAccredited = await prisma.client.create({
    data: {
      companyName: "Metro Realty Holdings Inc.",
      contactPerson: "Ferdinand Lopez",
      contactInfo: "ferdinand.lopez@metrorealty.ph / 0917-555-0142",
      accreditationDocs: json(["BIR 2303.pdf", "SEC Registration.pdf", "Mayor's Permit.pdf"]),
      accreditationStatus: "accredited",
    },
  });

  const clientAccredited2 = await prisma.client.create({
    data: {
      companyName: "Islandwide Retail Group",
      contactPerson: "Cristina Domingo",
      contactInfo: "cristina.domingo@islandwideretail.ph / 0918-555-0233",
      accreditationDocs: json(["BIR 2303.pdf", "DTI Certificate.pdf"]),
      accreditationStatus: "accredited",
    },
  });

  const clientPending = await prisma.client.create({
    data: {
      companyName: "Northgate Construction Corp.",
      contactPerson: "Ryan Villamor",
      contactInfo: "ryan.villamor@northgate.ph / 0919-555-0311",
      accreditationDocs: json(["SEC Registration.pdf"]),
      accreditationStatus: "pending",
    },
  });

  // ---------------------------------------------------------------------
  // Leads
  // ---------------------------------------------------------------------
  await prisma.lead.create({
    data: {
      companyName: "Northgate Construction Corp.",
      contactPerson: "Ryan Villamor",
      contactInfo: "ryan.villamor@northgate.ph / 0919-555-0311",
      source: "referral",
      status: "qualifying",
      notes: "Referred by Metro Realty. Interested in construction site billboards.",
      ownerId: salesRep2.id,
      clientId: clientPending.id,
    },
  });

  await prisma.lead.create({
    data: {
      companyName: "Islandwide Retail Group",
      contactPerson: "Cristina Domingo",
      contactInfo: "cristina.domingo@islandwideretail.ph / 0918-555-0233",
      source: "online",
      status: "converted",
      notes: "Inquired via website contact form for storefront tarpaulins.",
      ownerId: salesRep.id,
      clientId: clientAccredited2.id,
    },
  });

  await prisma.lead.create({
    data: {
      companyName: "Sunrise Foods Corp.",
      contactPerson: "Angela Reyes",
      contactInfo: "angela.reyes@sunrisefoods.ph / 0920-555-0417",
      source: "direct",
      status: "new",
      notes: "Walked in asking about billboard rates for a new product launch.",
      ownerId: salesRep.id,
    },
  });

  // ---------------------------------------------------------------------
  // RFQ -> Quotation -> Job Order #1 (the primary acceptance-test thread,
  // pushed all the way through to Delivery/Installation + Accounting + Inventory)
  // ---------------------------------------------------------------------
  const rfq1 = await prisma.rfq.create({
    data: {
      clientId: clientAccredited.id,
      specsText:
        "Two (2) 20ft x 10ft outdoor billboard tarpaulins, full color, for the Metro Realty EDSA site. Includes install.",
      attachedFiles: json(["metro-realty-billboard-specs.pdf", "site-photo-edsa.jpg"]),
      dimensions: "20ft x 10ft",
      quantity: 2,
      ocularRequired: true,
      status: "quoted",
    },
  });

  const quotation1LineItems = [
    { description: "20x10 Outdoor Billboard Tarpaulin, Full Color Print", qty: 2, unitPrice: 45000 },
    { description: "Steel Frame Fabrication & Mounting", qty: 2, unitPrice: 18000 },
    { description: "Installation Labor & Crane Rental", qty: 1, unitPrice: 22000 },
  ];
  const subtotal1 = quotation1LineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const quotation1 = await prisma.quotation.create({
    data: {
      rfqId: rfq1.id,
      clientId: clientAccredited.id,
      lineItems: json(quotation1LineItems),
      subtotal: subtotal1,
      discount: 5000,
      total: subtotal1 - 5000,
      requiresApproval: subtotal1 - 5000 > 150000,
      approvalStatus: subtotal1 - 5000 > 150000 ? "approved" : "n/a",
      approvedById: subtotal1 - 5000 > 150000 ? president.id : null,
      status: "accepted",
      sentDate: new Date("2026-07-05"),
    },
  });

  const jobOrder1 = await prisma.jobOrder.create({
    data: {
      quotationId: quotation1.id,
      clientId: clientAccredited.id,
      jobNumber: "JO-2026-0001",
      projectDetails: "Metro Realty EDSA site — 2x billboard tarpaulins with steel frame + install.",
      noticeToProceedDate: new Date("2026-07-06"),
      createdById: salesRep.id,
      currentStage: "installation",
    },
  });

  const stage1Seq: Array<{ stage: string; userId: string; notes: string; daysAgo: number }> = [
    { stage: "created", userId: salesRep.id, notes: "Job Order created from accepted quotation.", daysAgo: 12 },
    { stage: "printing", userId: printOp.id, notes: "Large-format print run started on both panels.", daysAgo: 10 },
    { stage: "production", userId: prodLead.id, notes: "Steel frame fabrication in progress.", daysAgo: 8 },
    { stage: "qc", userId: qcInspector.id, notes: "QC checklist passed — color accuracy and frame welds OK.", daysAgo: 5 },
    { stage: "delivery", userId: driver.id, notes: "Dispatched for delivery to EDSA site.", daysAgo: 3 },
    { stage: "installation", userId: installer.id, notes: "On-site installation started.", daysAgo: 1 },
  ];
  for (const s of stage1Seq) {
    await prisma.stageEvent.create({
      data: {
        jobOrderId: jobOrder1.id,
        stage: s.stage,
        userId: s.userId,
        notes: s.notes,
        timestamp: new Date(Date.now() - s.daysAgo * 86400000),
      },
    });
  }

  const materialRequest1 = await prisma.materialRequest.create({
    data: {
      jobOrderId: jobOrder1.id,
      requestedById: prodLead.id,
      items: json([
        { item: "Tarpaulin Vinyl 13oz (roll)", qty: 4, availableStock: 12, status: "released" },
        { item: "Steel Square Tube 2x2 (6m length)", qty: 10, availableStock: 30, status: "released" },
        { item: "Eyelets/Grommets (box of 100)", qty: 2, availableStock: 8, status: "released" },
      ]),
      status: "released",
    },
  });

  await prisma.fieldUpdate.createMany({
    data: [
      {
        jobOrderId: jobOrder1.id,
        stage: "delivery",
        userId: driver.id,
        statusLabel: "dispatched",
        photoUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600",
        notes: "Loaded both panels + frame hardware onto delivery truck.",
        timestamp: new Date(Date.now() - 3 * 86400000),
      },
      {
        jobOrderId: jobOrder1.id,
        stage: "delivery",
        userId: driver.id,
        statusLabel: "en_route",
        photoUrl: "",
        notes: "En route to EDSA site, ETA 45 mins.",
        timestamp: new Date(Date.now() - 3 * 86400000 + 3600000),
      },
      {
        jobOrderId: jobOrder1.id,
        stage: "delivery",
        userId: driver.id,
        statusLabel: "arrived",
        photoUrl: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600",
        notes: "Arrived on site, client rep signed the delivery receipt.",
        timestamp: new Date(Date.now() - 3 * 86400000 + 7200000),
      },
      {
        jobOrderId: jobOrder1.id,
        stage: "installation",
        userId: installer.id,
        statusLabel: "in_progress",
        photoUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600",
        notes: "Frame mounted, hoisting first panel into position.",
        timestamp: new Date(Date.now() - 1 * 86400000),
      },
    ],
  });

  const costSheet1 = await prisma.costSheet.create({
    data: {
      jobOrderId: jobOrder1.id,
      estimatedMaterials: 38000,
      estimatedLabor: 22000,
      estimatedSubcon: 0,
      budgetApprovedById: president.id,
      approvalStatus: "approved",
    },
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      jobOrderId: jobOrder1.id,
      clientId: clientAccredited.id,
      drReference: "DR-10245",
      lineItems: json(quotation1LineItems),
      total: quotation1.total,
      status: "sent",
      submissionPlatform: "internal",
    },
  });

  await prisma.aRRecord.create({
    data: {
      clientId: clientAccredited.id,
      jobOrderId: jobOrder1.id,
      invoiceId: invoice1.id,
      amount: quotation1.total,
      dueDate: new Date(Date.now() + 15 * 86400000),
      status: "open",
      paymentHistory: json([]),
    },
  });

  // ---------------------------------------------------------------------
  // Job Order #2 — earlier stage, for kanban variety
  // ---------------------------------------------------------------------
  const rfq2 = await prisma.rfq.create({
    data: {
      clientId: clientAccredited2.id,
      specsText: "Storefront tarpaulin signage for 8 Islandwide Retail branches, standard size 8ft x 4ft.",
      attachedFiles: json(["islandwide-storefront-specs.pdf"]),
      dimensions: "8ft x 4ft",
      quantity: 8,
      ocularRequired: false,
      status: "quoted",
    },
  });

  const quotation2LineItems = [{ description: "8x4 Storefront Tarpaulin, Full Color Print", qty: 8, unitPrice: 6500 }];
  const subtotal2 = quotation2LineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const quotation2 = await prisma.quotation.create({
    data: {
      rfqId: rfq2.id,
      clientId: clientAccredited2.id,
      lineItems: json(quotation2LineItems),
      subtotal: subtotal2,
      discount: 0,
      total: subtotal2,
      requiresApproval: subtotal2 > 150000,
      approvalStatus: subtotal2 > 150000 ? "pending" : "n/a",
      status: "accepted",
      sentDate: new Date("2026-07-12"),
    },
  });

  const jobOrder2 = await prisma.jobOrder.create({
    data: {
      quotationId: quotation2.id,
      clientId: clientAccredited2.id,
      jobNumber: "JO-2026-0002",
      projectDetails: "8 storefront tarpaulins for Islandwide Retail branch signage refresh.",
      noticeToProceedDate: new Date("2026-07-14"),
      createdById: salesRep.id,
      currentStage: "printing",
    },
  });

  await prisma.stageEvent.createMany({
    data: [
      {
        jobOrderId: jobOrder2.id,
        stage: "created",
        userId: salesRep.id,
        notes: "Job Order created from accepted quotation.",
        timestamp: new Date(Date.now() - 4 * 86400000),
      },
      {
        jobOrderId: jobOrder2.id,
        stage: "printing",
        userId: printOp.id,
        notes: "Printing 8 panels — batch run.",
        timestamp: new Date(Date.now() - 1 * 86400000),
      },
    ],
  });

  await prisma.costSheet.create({
    data: {
      jobOrderId: jobOrder2.id,
      estimatedMaterials: 28000,
      estimatedLabor: 8000,
      estimatedSubcon: 0,
      approvalStatus: "pending",
    },
  });

  // ---------------------------------------------------------------------
  // Job Order #3 — back job example
  // ---------------------------------------------------------------------
  const jobOrder3 = await prisma.jobOrder.create({
    data: {
      clientId: clientAccredited.id,
      jobNumber: "JO-2026-0003",
      projectDetails: "Replacement panel for wind-damaged billboard at Metro Realty Makati site.",
      noticeToProceedDate: new Date("2026-06-20"),
      createdById: salesRep2.id,
      currentStage: "back_job",
    },
  });
  await prisma.stageEvent.createMany({
    data: [
      { jobOrderId: jobOrder3.id, stage: "created", userId: salesRep2.id, notes: "Concern reported by client.", timestamp: new Date(Date.now() - 20 * 86400000) },
      { jobOrderId: jobOrder3.id, stage: "installation", userId: installer.id, notes: "Original install completed.", timestamp: new Date(Date.now() - 19 * 86400000) },
      { jobOrderId: jobOrder3.id, stage: "back_job", userId: installer.id, notes: "Panel torn by strong winds — back job raised for replacement.", timestamp: new Date(Date.now() - 2 * 86400000) },
    ],
  });

  // ---------------------------------------------------------------------
  // Inventory
  // ---------------------------------------------------------------------
  const invItems = await Promise.all([
    prisma.inventoryItem.create({
      data: { sku: "TARP-13OZ", name: "Tarpaulin Vinyl 13oz (roll)", category: "Print Media", unit: "roll", qtyOnHand: 8, reorderPoint: 10, location: "Warehouse A - Rack 1" },
    }),
    prisma.inventoryItem.create({
      data: { sku: "STL-2X2-6M", name: "Steel Square Tube 2x2 (6m length)", category: "Fabrication", unit: "piece", qtyOnHand: 20, reorderPoint: 15, location: "Warehouse A - Yard" },
    }),
    prisma.inventoryItem.create({
      data: { sku: "GROM-100", name: "Eyelets/Grommets (box of 100)", category: "Hardware", unit: "box", qtyOnHand: 6, reorderPoint: 5, location: "Warehouse A - Rack 3" },
    }),
    prisma.inventoryItem.create({
      data: { sku: "INK-CMYK-5L", name: "Solvent Ink CMYK Set (5L)", category: "Print Media", unit: "set", qtyOnHand: 3, reorderPoint: 4, location: "Warehouse B - Ink Room" },
    }),
    prisma.inventoryItem.create({
      data: { sku: "ROPE-10MM", name: "Nylon Rope 10mm (100m)", category: "Installation", unit: "roll", qtyOnHand: 14, reorderPoint: 6, location: "Warehouse A - Rack 5" },
    }),
  ]);

  await prisma.inventoryTransaction.createMany({
    data: [
      { itemId: invItems[0].id, type: "in", qty: 20, userId: warehouseCustodian.id, timestamp: new Date(Date.now() - 30 * 86400000) },
      { itemId: invItems[0].id, type: "out", qty: 4, relatedRequestId: materialRequest1.id, userId: warehouseCustodian.id, timestamp: new Date(Date.now() - 8 * 86400000) },
      { itemId: invItems[1].id, type: "in", qty: 30, userId: warehouseCustodian.id, timestamp: new Date(Date.now() - 30 * 86400000) },
      { itemId: invItems[1].id, type: "out", qty: 10, relatedRequestId: materialRequest1.id, userId: warehouseCustodian.id, timestamp: new Date(Date.now() - 8 * 86400000) },
      { itemId: invItems[2].id, type: "in", qty: 8, userId: warehouseCustodian.id, timestamp: new Date(Date.now() - 25 * 86400000) },
      { itemId: invItems[2].id, type: "out", qty: 2, relatedRequestId: materialRequest1.id, userId: warehouseCustodian.id, timestamp: new Date(Date.now() - 8 * 86400000) },
    ],
  });

  // ---------------------------------------------------------------------
  // Tool / Equipment
  // ---------------------------------------------------------------------
  await prisma.toolEquipment.createMany({
    data: [
      { name: "Cordless Impact Drill", tagId: "TL-0001", status: "released", assignedToId: installer.id, conditionNotes: "Good condition", lastInspectionDate: new Date(Date.now() - 20 * 86400000) },
      { name: "Aluminum Extension Ladder 20ft", tagId: "TL-0002", status: "released", assignedToId: installer.id, conditionNotes: "Minor scuffs, structurally sound", lastInspectionDate: new Date(Date.now() - 20 * 86400000) },
      { name: "Angle Grinder", tagId: "TL-0003", status: "available", conditionNotes: "Good condition", lastInspectionDate: new Date(Date.now() - 10 * 86400000) },
      { name: "Delivery Truck - Isuzu Elf (Plate ABC-1234)", tagId: "TL-0004", status: "released", assignedToId: driver.id, conditionNotes: "Due for oil change", lastInspectionDate: new Date(Date.now() - 45 * 86400000) },
      { name: "Welding Machine", tagId: "TL-0005", status: "maintenance", conditionNotes: "Faulty ground cable — sent for repair.", lastInspectionDate: new Date(Date.now() - 60 * 86400000) },
    ],
  });

  // ---------------------------------------------------------------------
  // Purchasing
  // ---------------------------------------------------------------------
  const rtp1 = await prisma.requestToPurchase.create({
    data: {
      sourceType: "inventory",
      sourceId: invItems[3].id,
      requestedById: warehouseCustodian.id,
      items: json([{ item: "Solvent Ink CMYK Set (5L)", qty: 6, notes: "Below reorder point" }]),
      status: "po_issued",
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      supplierName: "InkSupply PH Corp.",
      requestToPurchaseId: rtp1.id,
      items: json([{ item: "Solvent Ink CMYK Set (5L)", qty: 6, unitPrice: 4200 }]),
      status: "issued",
      totalAmount: 6 * 4200,
      issuedDate: new Date(Date.now() - 2 * 86400000),
    },
  });

  await prisma.requestToPurchase.create({
    data: {
      sourceType: "job_order",
      sourceId: jobOrder2.id,
      requestedById: prodLead.id,
      items: json([{ item: "Tarpaulin Vinyl 13oz (roll)", qty: 10, notes: "For JO-2026-0002 batch" }]),
      status: "pending",
    },
  });

  await prisma.subcontractorWorkOrder.create({
    data: {
      jobOrderId: jobOrder1.id,
      scopeOfWork: "Crane rental for billboard panel hoisting, 1-day job.",
      quotationsReceived: json([
        { supplier: "SkyLift Crane Rentals", amount: 18000 },
        { supplier: "MetroCrane Services", amount: 21000 },
        { supplier: "Apex Heavy Equipment", amount: 19500 },
      ]),
      selectedSubcontractor: "SkyLift Crane Rentals",
      cost: 18000,
      timeline: "1 day",
      status: "completed",
      paymentRequestStatus: "requested",
    },
  });

  // ---------------------------------------------------------------------
  // Accounting: disbursements, AP, opex, month-end checklist
  // ---------------------------------------------------------------------
  await prisma.disbursementVoucher.create({
    data: {
      supplierOrPayee: "InkSupply PH Corp.",
      amount: 6 * 4200,
      purpose: "Payment for solvent ink restock PO.",
      supportingDocs: json(["PO-InkSupply.pdf", "Delivery Receipt.pdf"]),
      status: "approved",
      preparedById: accountant.id,
      approvedById: president.id,
    },
  });

  await prisma.aPRecord.create({
    data: {
      supplierName: "SkyLift Crane Rentals",
      jobOrderId: jobOrder1.id,
      amount: 18000,
      dueDate: new Date(Date.now() + 10 * 86400000),
      status: "open",
      paymentHistory: json([]),
    },
  });

  await prisma.operatingExpense.createMany({
    data: [
      { type: "fixed", category: "Rent", amount: 85000, date: new Date("2026-07-01"), recordedById: accountant.id },
      { type: "fixed", category: "Utilities", amount: 32000, date: new Date("2026-07-05"), recordedById: accountant.id },
      { type: "variable", category: "Petty Cash - Site Fuel", amount: 4500, date: new Date("2026-07-15"), liquidationDocs: json(["fuel-receipt-07-15.jpg"]), recordedById: accountant.id },
    ],
  });

  await prisma.monthEndChecklistItem.createMany({
    data: [
      { period: "2026-07", task: "Bank reconciliation", done: false },
      { period: "2026-07", task: "Review AR aging report", done: false },
      { period: "2026-07", task: "Review AP aging report", done: false },
      { period: "2026-07", task: "Project financial report per active Job Order", done: false },
      { period: "2026-07", task: "Close petty cash liquidations", done: true, doneAt: new Date() },
    ],
  });

  // ---------------------------------------------------------------------
  // HR / Admin / Payroll
  // ---------------------------------------------------------------------
  const employeeUsers = [salesRep, salesRep2, prodLead, printOp, qcInspector, driver, installer, accountant, hrOfficer, purchasingOfficer, warehouseCustodian];
  const employees = [];
  for (const u of employeeUsers) {
    const emp = await prisma.employee.create({
      data: {
        userId: u.id,
        position: u.position,
        department: u.department,
        dateHired: new Date(Date.now() - 400 * 86400000),
        employmentStatus: "active",
        assignedSops: json(["Company Code of Conduct", `${u.department} SOP Manual`]),
      },
    });
    employees.push(emp);
  }

  await prisma.memoOrSop.createMany({
    data: [
      { title: "Sales: RFQ Intake & Quotation SOP", type: "procedure", department: "Sales", assignedPositions: json(["Account Executive"]), effectiveDate: new Date("2026-01-15") },
      { title: "Operations: Job Order Stage Handoff Work Instruction", type: "work_instruction", department: "Operations", assignedPositions: json(["Production Lead", "Printing Operator", "QC Inspector"]), effectiveDate: new Date("2026-02-01") },
      { title: "Accounting: Month-End Close Checklist", type: "procedure", department: "Accounting", assignedPositions: json(["Accounting Officer"]), effectiveDate: new Date("2026-01-10") },
      { title: "Memo: Updated Price Ceiling for Quotation Approval (₱150,000)", type: "memo", department: "Sales", assignedPositions: json(["Account Executive", "President"]), effectiveDate: new Date("2026-07-01") },
      { title: "Warehouse: Stock In/Out & Reorder-Point SOP", type: "procedure", department: "Warehouse", assignedPositions: json(["Warehouse/Tool Custodian"]), effectiveDate: new Date("2026-03-01") },
    ],
  });

  const manpowerReq = await prisma.manpowerRequest.create({
    data: {
      requestingDepartment: "Operations",
      position: "Printing Operator (2nd shift)",
      approvedById: president.id,
      status: "approved",
    },
  });

  const jobPosting = await prisma.jobPosting.create({
    data: {
      manpowerRequestId: manpowerReq.id,
      description: "Seeking an experienced large-format printing operator for the 2nd shift, EDSA production facility.",
      channels: json(["JobStreet", "Facebook Careers Page"]),
      status: "posted",
    },
  });

  await prisma.applicant.createMany({
    data: [
      { jobPostingId: jobPosting.id, name: "Ellen Mercado", contact: "ellen.mercado@gmail.com", status: "interview" },
      { jobPostingId: jobPosting.id, name: "Rico Salvador", contact: "rico.salvador@gmail.com", status: "shortlisted" },
      { jobPostingId: jobPosting.id, name: "Divina Ocampo", contact: "divina.ocampo@gmail.com", status: "applied" },
    ],
  });

  const opEmployee = employees[employees.findIndex((e) => e.userId === driver.id)];
  await prisma.payrollEntry.createMany({
    data: employees.slice(0, 6).map((e) => ({
      employeeId: e.id,
      period: "2026-07-01 to 2026-07-15",
      basePay: 14000,
      deductions: json([
        { label: "SSS", amount: 450 },
        { label: "PhilHealth", amount: 350 },
        { label: "Pag-IBIG", amount: 100 },
      ]),
      netPay: 14000 - 900,
      status: "reviewed",
      reviewedById: accountant.id,
    })),
  });
  void opEmployee;

  console.log("Seed complete.");
  console.log(`  Users: ${employeeUsers.length + 1}`);
  console.log(`  Clients: 3, Leads: 3, RFQs: 2, Quotations: 2, Job Orders: 3`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
