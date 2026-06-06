# Procurement Management System — FastAPI Backend

A production-ready REST API for managing the end-to-end procurement lifecycle, built with **FastAPI**, **SQLAlchemy 2.0 (async)**, and **PostgreSQL**.

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL running locally (or remote)

### 2. Setup

```bash
# Clone and enter the project
cd kv

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

### 3. Configure `.env`

Edit the `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/procurement_db
SECRET_KEY=generate-a-strong-random-key-here
```

### 4. Create the Database

```sql
-- In psql or pgAdmin:
CREATE DATABASE procurement_db;
```

### 5. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Open API Docs

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🏗 Project Architecture

```
app/
├── main.py              # FastAPI app entry point
├── config.py            # Settings from .env
├── database.py          # Async SQLAlchemy engine & session
│
├── models/              # SQLAlchemy ORM models
│   ├── user.py          # User + Role enum
│   ├── vendor.py        # Vendor + VendorStatus enum
│   ├── rfq.py           # RFQ + rfq_vendors association table
│   ├── quotation.py     # Quotation + QuotationStatus enum
│   ├── approval.py      # Approval + ApprovalStatus enum
│   ├── purchase_order.py # PurchaseOrder + POStatus enum
│   ├── invoice.py       # Invoice + InvoiceStatus enum
│   └── activity_log.py  # ActivityLog (audit trail)
│
├── schemas/             # Pydantic request/response schemas
│   ├── auth.py          # Login, Register, Token
│   ├── user.py
│   ├── vendor.py
│   ├── rfq.py
│   ├── quotation.py
│   ├── approval.py
│   ├── purchase_order.py
│   ├── invoice.py
│   └── activity_log.py
│
├── routers/             # API route handlers
│   ├── auth.py          # /api/v1/auth/*
│   ├── users.py         # /api/v1/users/*
│   ├── vendors.py       # /api/v1/vendors/*
│   ├── rfqs.py          # /api/v1/rfqs/*
│   ├── quotations.py    # /api/v1/quotations/*
│   ├── approvals.py     # /api/v1/approvals/*
│   ├── purchase_orders.py # /api/v1/purchase-orders/*
│   ├── invoices.py      # /api/v1/invoices/*
│   └── activity_logs.py # /api/v1/activity-logs/*
│
├── services/            # Business logic
│   ├── auth_service.py  # Password hashing + JWT
│   └── activity_service.py # Audit trail logging
│
└── dependencies/        # FastAPI DI
    ├── database.py      # get_db session
    └── auth.py          # get_current_user + RoleChecker
```

---

## 🔐 Authentication

### Register
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123", "name": "Admin", "role": "ADMIN"}'
```

### Login (get JWT token)
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -d "username=admin@example.com&password=admin123"
```

### Use Token
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <your-token>"
```

---

## 📋 API Endpoints Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login → JWT token | Public |
| GET | `/me` | Current user profile | JWT |

### Users (`/api/v1/users`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List users (paginated) | ADMIN |
| GET | `/{id}` | Get user | ADMIN |
| PUT | `/{id}` | Update user | ADMIN |
| DELETE | `/{id}` | Delete user | ADMIN |

### Vendors (`/api/v1/vendors`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create vendor | ADMIN, PROCUREMENT_OFFICER |
| GET | `/` | List vendors | All authenticated |
| GET | `/{id}` | Get vendor | All authenticated |
| PUT | `/{id}` | Update vendor | ADMIN, PROCUREMENT_OFFICER |
| DELETE | `/{id}` | Delete vendor | ADMIN |

### RFQs (`/api/v1/rfqs`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create RFQ | ADMIN, PROCUREMENT_OFFICER |
| GET | `/` | List RFQs | All authenticated |
| GET | `/{id}` | Get RFQ | All authenticated |
| PUT | `/{id}` | Update RFQ | ADMIN, PROCUREMENT_OFFICER |
| DELETE | `/{id}` | Delete RFQ | ADMIN |
| POST | `/{id}/vendors` | Assign vendors | ADMIN, PROCUREMENT_OFFICER |

### Quotations (`/api/v1/quotations`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Submit quotation | VENDOR, ADMIN |
| GET | `/` | List quotations | All authenticated |
| GET | `/{id}` | Get quotation | All authenticated |
| PUT | `/{id}` | Update quotation | VENDOR, ADMIN |
| PUT | `/{id}/accept` | Accept quotation | ADMIN, MANAGER |
| PUT | `/{id}/reject` | Reject quotation | ADMIN, MANAGER |

### Approvals (`/api/v1/approvals`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create approval request | ADMIN, PROCUREMENT_OFFICER |
| GET | `/` | List approvals | ADMIN, MANAGER |
| GET | `/{id}` | Get approval | ADMIN, MANAGER |
| PUT | `/{id}/approve` | Approve | ADMIN, MANAGER |
| PUT | `/{id}/reject` | Reject | ADMIN, MANAGER |

### Purchase Orders (`/api/v1/purchase-orders`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create PO | ADMIN, PROCUREMENT_OFFICER |
| GET | `/` | List POs | All authenticated |
| GET | `/{id}` | Get PO | All authenticated |
| PUT | `/{id}` | Update PO | ADMIN |

### Invoices (`/api/v1/invoices`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create invoice | ADMIN, PROCUREMENT_OFFICER |
| GET | `/` | List invoices | All authenticated |
| GET | `/{id}` | Get invoice | All authenticated |
| PUT | `/{id}` | Update invoice | ADMIN |

### Activity Logs (`/api/v1/activity-logs`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List logs (filtered) | ADMIN, MANAGER |
| GET | `/{id}` | Get specific log | ADMIN, MANAGER |

---

## 🎭 Roles & Permissions

| Role | Description |
|------|-------------|
| **ADMIN** | Full system access — all CRUD + user management |
| **MANAGER** | Approve/reject quotations and approvals, view logs |
| **PROCUREMENT_OFFICER** | Create/manage vendors, RFQs, POs, invoices |
| **VENDOR** | Submit and manage own quotations |

---

## 🗄 Database Schema

The database uses **PostgreSQL** with the following tables:

| Table | Description |
|-------|-------------|
| `users` | System users with roles |
| `vendors` | Registered vendors |
| `rfqs` | Requests for Quotation |
| `rfq_vendors` | Many-to-many: RFQ ↔ Vendor |
| `quotations` | Vendor quotation submissions |
| `approvals` | Multi-level approval workflow |
| `purchase_orders` | POs generated from accepted quotes |
| `invoices` | Invoices linked to POs |
| `activity_logs` | Full audit trail |

---

## 📦 Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL + asyncpg |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Validation | Pydantic v2 |
| Server | Uvicorn |
