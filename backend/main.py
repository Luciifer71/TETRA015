#!/usr/bin/env python3
"""FastAPI application entry point for invoice upload and processing."""

import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.upload import router as upload_router
from app.config import settings
from app.database import init_db
import app.models  # noqa: F401

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Invoice Audit Platform",
    description="AI-powered invoice extraction, validation, and risk assessment",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware FIRST (before all other middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=3600,  # Cache preflight for 1 hour
)

# Create uploads directory if it doesn't exist
uploads_dir = Path(settings.UPLOAD_DIR)
uploads_dir.mkdir(exist_ok=True)
logger.info(f"Uploads directory: {uploads_dir.absolute()}")

init_db()
logger.info("Local upload database initialized")

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Invoice Audit Platform",
        "version": "1.0.0"
    }

app.include_router(upload_router, prefix="/api", tags=["Invoice Upload"])

# Root endpoint
@app.get("/", tags=["Info"])
async def root():
    """API root information"""
    return {
        "name": "Invoice Audit Platform API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/health"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if logger.level == logging.DEBUG else None
        }
    )

if __name__ == "__main__":
    import uvicorn
    
    # Get host and port from environment or use defaults
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info(f"Starting FastAPI server on {host}:{port}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
