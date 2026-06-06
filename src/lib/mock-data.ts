export type VendorStatus = "active" | "pending" | "suspended";
export type RFQStatus = "draft" | "open" | "closed" | "awarded";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  gst: string;
  category: string;
  status: VendorStatus;
  rating: number;
  totalOrders: number;
  joinedAt: string;
}

export interface LineItem {
  id: string;
  product: string;
  description: string;
  quantity: number;
  unit: string;
}

export interface RFQ {
  id: string;
  code: string;
  title: string;
  description: string;
  items: LineItem[];
  deadline: string;
  status: RFQStatus;
  createdAt: string;
  vendorIds: string[];
  quotationCount: number;
  createdBy: string;
}

export interface Quotation {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  totalPrice: number;
  deliveryDays: number;
  notes: string;
  submittedAt: string;
  score: number;
  status: "submitted" | "shortlisted" | "rejected" | "awarded";
}

export interface Approval {
  id: string;
  rfqCode: string;
  rfqTitle: string;
  requestedBy: string;
  amount: number;
  vendor: string;
  submittedAt: string;
  status: ApprovalStatus;
  priority: "low" | "medium" | "high";
}

export interface Invoice {
  id: string;
  type: "PO" | "INVOICE";
  number: string;
  vendor: string;
  vendorEmail: string;
  amount: number;
  tax: number;
  total: number;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  items: { description: string; qty: number; rate: number }[];
}

export interface Activity {
  id: string;
  actor: string;
  action: string;
  target: string;
  type: "rfq" | "vendor" | "approval" | "invoice" | "quotation";
  timestamp: string;
}

export const vendors: Vendor[] = [
  { id: "v1", name: "Acme Industrial Supply Co.", email: "sales@acmeindustrial.com", phone: "+1 (415) 555-0102", gst: "27AABCU9603R1ZM", category: "Raw Materials", status: "active", rating: 4.8, totalOrders: 142, joinedAt: "2023-02-14" },
  { id: "v2", name: "Northwind Components Ltd.", email: "procurement@northwind.io", phone: "+1 (212) 555-0143", gst: "29AAFCN1234D1Z9", category: "Electronics", status: "active", rating: 4.6, totalOrders: 98, joinedAt: "2023-05-22" },
  { id: "v3", name: "Vertex Logistics Partners", email: "ops@vertexlogistics.com", phone: "+1 (312) 555-0188", gst: "07AAGCV5678E1ZK", category: "Logistics", status: "pending", rating: 4.2, totalOrders: 24, joinedAt: "2024-11-03" },
  { id: "v4", name: "Stellar Office Solutions", email: "hello@stellaroffice.com", phone: "+1 (646) 555-0177", gst: "33AAACS9012F1ZP", category: "Office Supplies", status: "active", rating: 4.5, totalOrders: 67, joinedAt: "2023-09-10" },
  { id: "v5", name: "Pioneer Steel Works", email: "contact@pioneersteel.co", phone: "+1 (713) 555-0166", gst: "24AAFCP3456G1ZA", category: "Raw Materials", status: "active", rating: 4.9, totalOrders: 215, joinedAt: "2022-08-30" },
  { id: "v6", name: "Crestwood Packaging Inc.", email: "sales@crestwoodpack.com", phone: "+1 (503) 555-0155", gst: "19AAECC7890H1ZB", category: "Packaging", status: "suspended", rating: 3.4, totalOrders: 12, joinedAt: "2024-01-18" },
  { id: "v7", name: "Quantum IT Services", email: "biz@quantumit.dev", phone: "+1 (408) 555-0144", gst: "29AABCQ1357I1ZC", category: "IT Services", status: "active", rating: 4.7, totalOrders: 56, joinedAt: "2023-11-25" },
  { id: "v8", name: "Helix Chemicals Group", email: "orders@helixchem.com", phone: "+1 (281) 555-0133", gst: "27AAACH2468J1ZD", category: "Chemicals", status: "active", rating: 4.3, totalOrders: 89, joinedAt: "2023-04-07" },
];

export const rfqs: RFQ[] = [
  { id: "r1", code: "RFQ-2026-0142", title: "Q2 Steel Sheet Procurement", description: "Bulk procurement of cold-rolled steel sheets for manufacturing line expansion.", items: [{ id: "i1", product: "CR Steel Sheet 1.2mm", description: "Grade A, 1220x2440mm", quantity: 500, unit: "sheets" }, { id: "i2", product: "CR Steel Sheet 0.8mm", description: "Grade A, 1220x2440mm", quantity: 800, unit: "sheets" }], deadline: "2026-06-30", status: "open", createdAt: "2026-06-01", vendorIds: ["v1", "v5"], quotationCount: 4, createdBy: "Sarah Chen" },
  { id: "r2", code: "RFQ-2026-0141", title: "Network Switch Refresh - HQ", description: "Replacement of core network switches across HQ floors 3-7.", items: [{ id: "i3", product: "48-port Gigabit Switch", description: "Managed, PoE+", quantity: 12, unit: "units" }], deadline: "2026-06-25", status: "open", createdAt: "2026-05-28", vendorIds: ["v2", "v7"], quotationCount: 2, createdBy: "Marcus Webb" },
  { id: "r3", code: "RFQ-2026-0140", title: "Annual Office Stationery Contract", description: "Annual contract for stationery and office consumables.", items: [{ id: "i4", product: "Assorted stationery", description: "Bundle catalog", quantity: 1, unit: "contract" }], deadline: "2026-06-15", status: "awarded", createdAt: "2026-05-20", vendorIds: ["v4"], quotationCount: 3, createdBy: "Priya Patel" },
  { id: "r4", code: "RFQ-2026-0139", title: "Industrial Solvent Q3 Order", description: "Q3 supply of industrial grade solvents.", items: [{ id: "i5", product: "Industrial Solvent A", description: "55 gallon drums", quantity: 40, unit: "drums" }], deadline: "2026-07-10", status: "open", createdAt: "2026-06-02", vendorIds: ["v8"], quotationCount: 1, createdBy: "Sarah Chen" },
  { id: "r5", code: "RFQ-2026-0138", title: "Custom Packaging Materials", description: "Sustainable packaging for new product line.", items: [{ id: "i6", product: "Corrugated boxes", description: "Custom branded, 30x20x15cm", quantity: 5000, unit: "units" }], deadline: "2026-06-12", status: "closed", createdAt: "2026-05-15", vendorIds: ["v6"], quotationCount: 2, createdBy: "Daniel Ross" },
  { id: "r6", code: "RFQ-2026-0137", title: "Last-mile Logistics Partner", description: "Q3-Q4 last-mile delivery contract for west region.", items: [{ id: "i7", product: "Delivery contract", description: "10k shipments/quarter", quantity: 1, unit: "contract" }], deadline: "2026-06-20", status: "draft", createdAt: "2026-06-03", vendorIds: ["v3"], quotationCount: 0, createdBy: "Marcus Webb" },
];

export const quotations: Quotation[] = [
  { id: "q1", rfqId: "r1", vendorId: "v1", vendorName: "Acme Industrial Supply Co.", totalPrice: 184500, deliveryDays: 14, notes: "Includes premium freight insurance.", submittedAt: "2026-06-03", score: 88, status: "shortlisted" },
  { id: "q2", rfqId: "r1", vendorId: "v5", vendorName: "Pioneer Steel Works", totalPrice: 176200, deliveryDays: 18, notes: "Volume discount applied for repeat client.", submittedAt: "2026-06-04", score: 92, status: "shortlisted" },
  { id: "q3", rfqId: "r1", vendorId: "v8", vendorName: "Helix Chemicals Group", totalPrice: 198400, deliveryDays: 12, notes: "Express delivery available.", submittedAt: "2026-06-04", score: 79, status: "submitted" },
  { id: "q4", rfqId: "r1", vendorId: "v2", vendorName: "Northwind Components Ltd.", totalPrice: 189000, deliveryDays: 16, notes: "Standard terms.", submittedAt: "2026-06-05", score: 82, status: "submitted" },
  { id: "q5", rfqId: "r2", vendorId: "v2", vendorName: "Northwind Components Ltd.", totalPrice: 42800, deliveryDays: 10, notes: "3-year warranty included.", submittedAt: "2026-05-30", score: 90, status: "submitted" },
  { id: "q6", rfqId: "r2", vendorId: "v7", vendorName: "Quantum IT Services", totalPrice: 39600, deliveryDays: 14, notes: "Bundle with managed services.", submittedAt: "2026-05-31", score: 86, status: "submitted" },
];

export const approvals: Approval[] = [
  { id: "a1", rfqCode: "RFQ-2026-0142", rfqTitle: "Q2 Steel Sheet Procurement", requestedBy: "Sarah Chen", amount: 176200, vendor: "Pioneer Steel Works", submittedAt: "2026-06-05", status: "pending", priority: "high" },
  { id: "a2", rfqCode: "RFQ-2026-0141", rfqTitle: "Network Switch Refresh - HQ", requestedBy: "Marcus Webb", amount: 39600, vendor: "Quantum IT Services", submittedAt: "2026-06-02", status: "pending", priority: "medium" },
  { id: "a3", rfqCode: "RFQ-2026-0139", rfqTitle: "Industrial Solvent Q3 Order", requestedBy: "Sarah Chen", amount: 22400, vendor: "Helix Chemicals Group", submittedAt: "2026-06-04", status: "pending", priority: "low" },
  { id: "a4", rfqCode: "RFQ-2026-0140", rfqTitle: "Annual Office Stationery Contract", requestedBy: "Priya Patel", amount: 18900, vendor: "Stellar Office Solutions", submittedAt: "2026-05-30", status: "approved", priority: "low" },
  { id: "a5", rfqCode: "RFQ-2026-0138", rfqTitle: "Custom Packaging Materials", requestedBy: "Daniel Ross", amount: 31200, vendor: "Crestwood Packaging Inc.", submittedAt: "2026-05-28", status: "rejected", priority: "medium" },
];

export const invoices: Invoice[] = [
  { id: "inv1", type: "PO", number: "PO-2026-0291", vendor: "Pioneer Steel Works", vendorEmail: "contact@pioneersteel.co", amount: 176200, tax: 14096, total: 190296, issuedAt: "2026-06-05", dueAt: "2026-07-05", status: "sent", items: [{ description: "CR Steel Sheet 1.2mm — 500 sheets", qty: 500, rate: 220 }, { description: "CR Steel Sheet 0.8mm — 800 sheets", qty: 800, rate: 82.75 }] },
  { id: "inv2", type: "INVOICE", number: "INV-2026-1043", vendor: "Stellar Office Solutions", vendorEmail: "hello@stellaroffice.com", amount: 18900, tax: 1512, total: 20412, issuedAt: "2026-06-01", dueAt: "2026-06-30", status: "paid", items: [{ description: "Annual stationery contract", qty: 1, rate: 18900 }] },
  { id: "inv3", type: "PO", number: "PO-2026-0290", vendor: "Quantum IT Services", vendorEmail: "biz@quantumit.dev", amount: 39600, tax: 3168, total: 42768, issuedAt: "2026-06-03", dueAt: "2026-07-03", status: "sent", items: [{ description: "48-port Gigabit Switch", qty: 12, rate: 3300 }] },
  { id: "inv4", type: "INVOICE", number: "INV-2026-1042", vendor: "Acme Industrial Supply Co.", vendorEmail: "sales@acmeindustrial.com", amount: 24800, tax: 1984, total: 26784, issuedAt: "2026-05-18", dueAt: "2026-06-18", status: "overdue", items: [{ description: "Bulk fasteners assorted", qty: 1, rate: 24800 }] },
  { id: "inv5", type: "INVOICE", number: "INV-2026-1041", vendor: "Northwind Components Ltd.", vendorEmail: "procurement@northwind.io", amount: 12450, tax: 996, total: 13446, issuedAt: "2026-05-22", dueAt: "2026-06-22", status: "paid", items: [{ description: "Network cabling kit", qty: 1, rate: 12450 }] },
];

export const activities: Activity[] = [
  { id: "act1", actor: "Sarah Chen", action: "submitted for approval", target: "RFQ-2026-0142", type: "rfq", timestamp: "2026-06-05T14:22:00Z" },
  { id: "act2", actor: "Pioneer Steel Works", action: "submitted quotation for", target: "RFQ-2026-0142", type: "quotation", timestamp: "2026-06-04T11:08:00Z" },
  { id: "act3", actor: "Marcus Webb", action: "approved", target: "PO-2026-0290", type: "approval", timestamp: "2026-06-03T16:45:00Z" },
  { id: "act4", actor: "System", action: "generated invoice", target: "INV-2026-1043", type: "invoice", timestamp: "2026-06-01T09:00:00Z" },
  { id: "act5", actor: "Priya Patel", action: "added new vendor", target: "Vertex Logistics Partners", type: "vendor", timestamp: "2026-05-30T13:20:00Z" },
  { id: "act6", actor: "Daniel Ross", action: "rejected", target: "RFQ-2026-0138", type: "approval", timestamp: "2026-05-28T10:12:00Z" },
  { id: "act7", actor: "Northwind Components Ltd.", action: "submitted quotation for", target: "RFQ-2026-0141", type: "quotation", timestamp: "2026-05-30T15:34:00Z" },
  { id: "act8", actor: "Sarah Chen", action: "created", target: "RFQ-2026-0141", type: "rfq", timestamp: "2026-05-28T09:55:00Z" },
];

export const spendTrend = [
  { month: "Jan", spend: 142000 }, { month: "Feb", spend: 168000 }, { month: "Mar", spend: 154000 },
  { month: "Apr", spend: 198000 }, { month: "May", spend: 221000 }, { month: "Jun", spend: 247000 },
];

export const categorySpend = [
  { name: "Raw Materials", value: 412000 }, { name: "Electronics", value: 186000 },
  { name: "Logistics", value: 124000 }, { name: "Office", value: 68000 }, { name: "Other", value: 92000 },
];

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
