"""
FastAPI application entry point.

Procurement Management System — main.py
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import engine, Base

# Import all models so they register with Base.metadata
import app.models  # noqa: F401

# Import routers
from app.routers import (
    auth,
    users,
    vendors,
    rfqs,
    quotations,
    approvals,
    purchase_orders,
    invoices,
    activity_logs,
    dashboard,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Creates all database tables on startup (dev mode).
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "A comprehensive procurement management system API.\n\n"
        "## Features\n"
        "- **JWT Authentication** with role-based access control\n"
        "- **Vendor Management** — CRUD operations for vendors\n"
        "- **RFQ Management** — Create and manage Requests for Quotation\n"
        "- **Quotation Handling** — Submit, accept, reject quotations\n"
        "- **Approval Workflow** — Multi-level approval system\n"
        "- **Purchase Orders** — Generate POs from accepted quotations\n"
        "- **Invoice Management** — Create and track invoices\n"
        "- **Activity Logging** — Full audit trail of all actions\n\n"
        "## Roles\n"
        "- `ADMIN` — Full system access\n"
        "- `MANAGER` — Approval and oversight permissions\n"
        "- `PROCUREMENT_OFFICER` — Create and manage procurement entities\n"
        "- `VENDOR` — Submit quotations\n"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(vendors.router)
app.include_router(rfqs.router)
app.include_router(quotations.router)
app.include_router(approvals.router)
app.include_router(purchase_orders.router)
app.include_router(invoices.router)
app.include_router(activity_logs.router)
app.include_router(dashboard.router)


@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
    }
