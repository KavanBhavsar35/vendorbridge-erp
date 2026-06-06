# VendorBridge Hub — Procurement ERP (Frontend)

VendorBridge is a modern, enterprise-grade Procurement ERP platform designed to unify vendor networks, Requests for Quotations (RFQs), quotation submissions, governance approvals, purchase orders, invoicing, and audit trail logs into a single high-performance workspace.

This repository contains the frontend application, built on top of **React**, **TanStack Start**, and **TailwindCSS**.

---

## 🚀 Tech Stack & Design System

The application leverages a premium, responsive design with smooth transitions and glassmorphism elements:

- **Framework & Routing**: [TanStack Start](https://tanstack.com/router/v1/docs/start/overview) (React 19 + TanStack Router with type-safe, file-based routing).
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) with custom HSL-based color tokens (sleek dark/light backgrounds, status-colored badges).
- **UI Components**: Radix UI primitives configured via Shadcn templates (Dialogs, Sheets, Tabs, Accordions, Dropdown Menus, sidebars, and forms).
- **Data Visualization**: [Recharts](https://recharts.org/) for rendering responsive area charts (spend trends) and pie charts (category breakdown).
- **Icons**: [Lucide React](https://lucide.dev/) for consistent, modern visual language.
- **Toasts**: [Sonner](https://seed.run/) for micro-interactions and success/error reporting.

---

## 🏗 Directory Structure

```
src/
├── components/          # Reusable components
│   ├── auth/            # Auth-specific layouts (e.g., AuthShell)
│   ├── dashboard/       # Dashboard shell, PageHeader, StatusBadges
│   └── ui/              # Radix UI and Shadcn primitives
├── hooks/               # Custom React hooks
├── lib/                 # Core utilities
│   ├── mock-data.ts     # In-memory database of mock entities and TypeScript models
│   └── utils.ts         # Tailwind class merger (clsx + tailwind-merge)
├── routes/              # TanStack Start file-based route handlers
│   ├── __root.tsx       # Root layout wrapper (injects QueryClient, HTML layout, fallback 404/Error screens)
│   ├── auth.login.tsx   # Login page
│   ├── auth.signup.tsx  # Account registration
│   ├── dashboard.tsx    # Dashboard layout manager (wraps child views with sidebar navigation)
│   ├── dashboard.index.tsx               # Dashboard Home / Overview
│   ├── dashboard.activity.tsx            # Procurement Audit Log timeline
│   ├── dashboard.approvals.tsx           # Approval workflow queue
│   ├── dashboard.invoices.tsx            # Purchase Orders & Invoices tracker
│   ├── dashboard.vendors.tsx             # Supplier directory & onboarding dialog
│   ├── dashboard.rfqs.index.tsx          # RFQ lists & status overview
│   ├── dashboard.rfqs.new.tsx            # RFQ creation form
│   ├── dashboard.quotations.compare.$rfqId.tsx # Multi-vendor quotation comparison & award
│   ├── dashboard.quotations.submit.$id.tsx     # Vendor bid submission interface
│   └── index.tsx        # App landing / marketing page
├── styles.css           # Global stylesheet and Tailwind directives
├── router.tsx           # TanStack router setup
├── server.ts            # SSR entry point
└── start.ts             # Client hydration entry point
```

---

## 🗺 Page Directory & Route Mapping

The frontend utilizes a clean file-based routing convention. Below is a detailed listing of all active views:

| Path                                   | File                                                                                                                                                                       | Target Role(s)      | Description                                                                   | Key Interactions                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/`                                    | [index.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/index.tsx)                                                             | Guest / Public      | Landing page presenting the core features of VendorBridge.                    | Links to Sign-in/Sign-up.                                            |
| `/auth/login`                          | [auth.login.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/auth.login.tsx)                                                   | Guest / Public      | Sign-in portal with credentials entry and role selection.                     | Log in as Sarah Chen (Procurement Lead); Google SSO simulation.      |
| `/auth/signup`                         | [auth.signup.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/auth.signup.tsx)                                                 | Guest / Public      | Registration form to create a new buyer, approver, or vendor profile.         | Account creation validation; Google SSO simulation.                  |
| `/dashboard`                           | [dashboard.index.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.index.tsx)                                         | All Roles           | Overview dashboard displaying analytics, trends, activity, and quick actions. | Navigation shortcuts; hover-enabled Recharts graphs.                 |
| `/dashboard/vendors`                   | [dashboard.vendors.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.vendors.tsx)                                     | Buyer / Admin       | Directory listing containing vendor profiles, star ratings, and status.       | Add vendor modal form; delete action; search & filters.              |
| `/dashboard/rfqs`                      | [dashboard.rfqs.index.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.rfqs.index.tsx)                               | All Roles           | Request for Quotations index tracking deadlines and status tags.              | Search and filter; link to quotation comparison pages.               |
| `/dashboard/rfqs/new`                  | [dashboard.rfqs.new.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.rfqs.new.tsx)                                   | Procurement / Admin | RFQ creator form specifying details, line items, and inviting vendors.        | Dynamic line item add/remove; attachment upload simulation.          |
| `/dashboard/quotations/compare/$rfqId` | [dashboard.quotations.compare.$rfqId.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.quotations.compare.$rfqId.tsx) | Buyer / Manager     | Multi-vendor quotation analysis view to compare pricing, speed, and scoring.  | Direct award buttons (triggers winner highlights and status change). |
| `/dashboard/quotations/submit/$id`     | [dashboard.quotations.submit.$id.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.quotations.submit.$id.tsx)         | Vendors             | Bid submission page showing buyer terms and a pricing inputs console.         | Form to submit price, delivery timeframes, and notes.                |
| `/dashboard/approvals`                 | [dashboard.approvals.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.approvals.tsx)                                 | Managers / Admins   | Dual-panel queue displaying purchase requests requiring governance approvals. | Queue item selection; Approve/Reject buttons; remarks Dialog.        |
| `/dashboard/invoices`                  | [dashboard.invoices.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.invoices.tsx)                                   | All Roles           | Ledger of Purchase Orders (POs) and Invoices.                                 | Slide-out invoice details drawer; PDF and email triggers.            |
| `/dashboard/activity`                  | [dashboard.activity.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/routes/dashboard.activity.tsx)                                   | Admin / Auditor     | Timeline showcasing system audit logs (user operations, approvals).           | Colored timeline badges illustrating action type context.            |

---

## 🔍 Detailed Page Breakdowns

### 1. Landing Page (`/`)

An aesthetic intro presenting the three value pillars: **Faster sourcing**, **Built-in governance**, and **Spend you can see**. It provides clean entry buttons to either log in to an existing account or register a new company profile.

### 2. Authentication Portal (`/auth/login` & `/auth/signup`)

- Inbound users can log in directly using the pre-seeded demo user:
  - **Email**: `sarah@vendorbridge.com`
  - **Password**: `demopass`
  - **Roles**: Toggle user perspective between _Buyer_, _Vendor_, _Approver_, and _Admin_.
- Submitting the forms generates context-aware toasts (e.g. `Welcome back, Sarah`) and forwards routing directly to the Dashboard.

### 3. Dashboard Shell & Layout (`/dashboard/*` layout)

The dashboard wraps every view inside a responsive layout configured in [DashboardLayout.tsx](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/components/dashboard/DashboardLayout.tsx):

- **Desktop Sidebar**: Contains branding, route links, automated badges (e.g. `3` pending approvals), and a mini budget widget reflecting Q2 spend metrics.
- **Mobile Drawer**: Slide-out panel triggerable from the header.
- **Top Header**: Hosts a system search bar, notifications bell (with an unread counter), and a profile dropdown allowing configuration of user settings and logging out.

### 4. Overview Hub (`/dashboard`)

Serves as the main workspace overview. Key sections include:

- **KPI Row**: Key indicators detailing pending approvals, active RFQs, recent POs, and total spend (with month-over-month indicators).
- **Spend Trend Area Chart**: Visualizes monthly expenditures using a custom area gradient matching the active theme color system.
- **Spend by Category Pie Chart**: Displays a breakdown of materials, logistics, electronics, and office spends with an interactive legend.
- **Recent Activity Feed**: Truncated timeline showing the latest six operations performed by workspace actors.

### 5. Vendor Directory (`/dashboard/vendors`)

- Presents a searchable data table listing company details, categorizations, ratings, and order volumes.
- Provides filtration options by Category type and Status tags (_Active_, _Pending_, _Suspended_).
- Features a **New Vendor Onboarding** form popup requiring Tax GST strings and basic contact info, automatically placing the new supplier in a `pending` verification state.

### 6. RFQ Management & Creation (`/dashboard/rfqs` & `/dashboard/rfqs/new`)

- **List Index**: Reviews active requirements, deadlines, assigned vendor metrics, and total bids.
- **Creation Workspace**:
  - Allows inputs for title details, scopes, and calendar deadlines.
  - Generates line items dynamically (inputs for products, sizes, quantities, and units) with inline remove buttons.
  - Simulates attaching documentation (PDF, sheets) with closeable badge list summaries.
  - Invites specific suppliers from the vendor list directly through interactive checkbox lists.

### 7. Quote Comparison Dashboard (`/dashboard/quotations/compare/$rfqId`)

Enables quick analysis of all bids matching a specific RFQ:

- Highlight blocks capture **Lowest Price**, **Fastest Delivery**, and **Top Score**.
- The comparison spreadsheet highlights the lowest bidder and fastest delivery with distinctive green/blue outline badges.
- Features a progress bar visualizing internal quotation scoring metrics.
- Includes an **Award** button that automatically flags the chosen supplier row and prompts status changes.

### 8. Bid Submission Panel (`/dashboard/quotations/submit/$id`)

The portal where vendors review the buyer's requirements (specifications, line items, and quantities) and submit their pricing:

- Displays summary statistics (buyer name, deadline, line item count).
- Includes inputs for total price (USD), delivery timeline (days), and custom terms or warranty remarks.

### 9. Approval Console (`/dashboard/approvals`)

- Implements a master-detail split layout for managers.
- Inbound queue shows prioritizing alerts (e.g., high priority for large-value items).
- Detailing screen highlights who requested the purchase, transaction size, and provides summary context (e.g. "lowest bid from supplier, scored 92/100").
- Approving or rejecting prompts a modal inputting auditing remarks.

### 10. Ledger Ledger (`/dashboard/invoices`)

- Divides documents into **Purchase Orders** and **Invoices**.
- Clicking "View" displays a responsive, preview stylesheet of the invoice sheet formatted with address fields, billing items tables, tax calculations, and totals.
- Action actions allow downloading simulated PDFs or emailing invoices to vendor contacts.

---

## 🗄 Frontend Mock Data Model

The frontend manages data in local state seeded by [mock-data.ts](file:///c:/Users/kavan/Downloads/vendorbridge-hub-main/vendorbridge-hub-main/src/lib/mock-data.ts). Key interfaces include:

```typescript
// Vendor structure
export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  gst: string;
  category: string;
  status: "active" | "pending" | "suspended";
  rating: number;
  totalOrders: number;
  joinedAt: string;
}

// RFQ structure
export interface RFQ {
  id: string;
  code: string;
  title: string;
  description: string;
  items: LineItem[];
  deadline: string;
  status: "draft" | "open" | "closed" | "awarded";
  createdAt: string;
  vendorIds: string[];
  quotationCount: number;
  createdBy: string;
}

// Quotation structure
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
```

---

## 🛠 Setup & Running Locally

Ensure you have [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies

```bash
# Using bun
bun install

# Or using npm
npm install
```

### 2. Start the Development Server

This runs Vite with hot-reloading enabled:

```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) (or the port specified in terminal) to view the application.

### 3. Build for Production

Compiles the static assets and builds the server components:

```bash
bun run build
```
