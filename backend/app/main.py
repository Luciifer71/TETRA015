from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api import upload, invoices, dashboard, search, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix=settings.api_prefix)
app.include_router(invoices.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(search.router, prefix=settings.api_prefix)
app.include_router(audit.router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name}


@app.get("/")
async def root():
    return {"message": "InvoiceGuard AI API", "docs": "/docs"}