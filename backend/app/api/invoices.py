from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, asc

from app.database import get_db
from app.models import Invoice, RiskReport, Exception as ExceptionModel
from app.schemas import (
    InvoiceResponse,
    InvoiceListResponse,
    InvoiceUpdate,
    PaginatedResponse,
    PaginationParams,
    InvoiceFilters,
    BaseResponse,
)
from app.utils import now_utc

router = APIRouter()


@router.get("/invoices", response_model=BaseResponse[PaginatedResponse])
async def list_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    vendor: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: str = "uploaded_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
):
    """List invoices with pagination and filters"""
    query = db.query(Invoice).outerjoin(RiskReport, Invoice.id == RiskReport.invoice_id)
    
    if status:
        query = query.filter(Invoice.status == status)
    if risk_level:
        query = query.filter(RiskReport.risk_level == risk_level)
    if vendor:
        query = query.filter(Invoice.vendor_name.ilike(f"%{vendor}%"))
    if date_from:
        query = query.filter(Invoice.invoice_date >= date_from)
    if date_to:
        query = query.filter(Invoice.invoice_date <= date_to)
    if min_amount is not None:
        query = query.filter(Invoice.total_amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Invoice.total_amount <= max_amount)
    
    sort_column = getattr(Invoice, sort_by, Invoice.uploaded_at)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    total = query.count()
    invoices = query.offset((page - 1) * limit).limit(limit).all()
    
    results = []
    for inv in invoices:
        risk = db.query(RiskReport).filter(RiskReport.invoice_id == inv.id).first()
        exc_count = db.query(ExceptionModel).filter(ExceptionModel.invoice_id == inv.id).count()
        
        results.append(InvoiceListResponse(
            id=inv.id,
            invoice_number=inv.invoice_number,
            vendor_name=inv.vendor_name,
            invoice_date=inv.invoice_date,
            total_amount=float(inv.total_amount),
            currency=inv.currency,
            status=inv.status,
            risk_level=risk.risk_level if risk else None,
            risk_score=risk.risk_score if risk else None,
            uploaded_at=inv.uploaded_at,
            has_exceptions=exc_count > 0,
            exception_count=exc_count,
        ))
    
    return BaseResponse(
        success=True,
        data=PaginatedResponse(
            invoices=results,
            pagination={
                "total": total,
                "page": page,
                "limit": limit,
                "pages": (total + limit - 1) // limit,
                "has_next": page * limit < total,
                "has_prev": page > 1,
            },
        ),
        message="Invoices retrieved",
    )


@router.get("/invoices/{invoice_id}", response_model=BaseResponse[InvoiceResponse])
async def get_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Get detailed invoice information"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return BaseResponse(
        success=True,
        data=InvoiceResponse.from_orm(invoice),
        message="Invoice retrieved",
    )


@router.patch("/invoices/{invoice_id}", response_model=BaseResponse[dict])
async def update_invoice(
    invoice_id: str,
    update: InvoiceUpdate,
    db: Session = Depends(get_db),
):
    """Update invoice (manual corrections)"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    old_values = {
        "vendor_name": invoice.vendor_name,
        "total_amount": float(invoice.total_amount),
        "status": invoice.status,
    }
    
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)
    
    invoice.updated_at = now_utc()
    db.commit()
    db.refresh(invoice)
    
    new_values = {
        "vendor_name": invoice.vendor_name,
        "total_amount": float(invoice.total_amount),
        "status": invoice.status,
    }
    
    from app.services import log_action
    await log_action(
        db, invoice_id, "UPDATE", "USER", "demo-user",
        "Invoice manually updated",
        old_values=old_values,
        new_values=new_values,
    )
    
    return BaseResponse(
        success=True,
        data={"invoice_id": invoice_id, "updated_fields": list(update_data.keys()), "updated_at": invoice.updated_at},
        message="Invoice updated successfully",
    )