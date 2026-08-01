from typing import Optional, List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc

from app.database import get_db
from app.models import Invoice, RiskReport, VendorMaster
from app.schemas import BaseResponse, InvoiceListResponse

router = APIRouter()


class SearchFilters(BaseModel):
    risk_level: Optional[List[str]] = None
    status: Optional[List[str]] = None
    date_range: Optional[dict] = None
    amount_range: Optional[dict] = None
    vendors: Optional[List[str]] = None


class SortParams(BaseModel):
    field: str = "uploaded_at"
    order: str = "desc"


class SearchRequest(BaseModel):
    query: Optional[str] = None
    filters: Optional[SearchFilters] = None
    sort: Optional[SortParams] = None
    page: int = Field(1, ge=1)
    limit: int = Field(25, ge=1, le=100)


class SearchResponse(BaseModel):
    results: List[InvoiceListResponse]
    pagination: dict


@router.post("/search", response_model=BaseResponse[SearchResponse])
async def search_invoices(
    request: SearchRequest,
    db: Session = Depends(get_db),
):
    """Advanced search with filters"""
    query = db.query(Invoice).outerjoin(RiskReport, Invoice.id == RiskReport.invoice_id)
    
    if request.query:
        search_term = f"%{request.query}%"
        query = query.filter(
            or_(
                Invoice.invoice_number.ilike(search_term),
                Invoice.vendor_name.ilike(search_term),
                Invoice.vendor_gst.ilike(search_term),
            )
        )
    
    if request.filters:
        f = request.filters
        if f.risk_level:
            query = query.filter(RiskReport.risk_level.in_(f.risk_level))
        if f.status:
            query = query.filter(Invoice.status.in_(f.status))
        if f.date_range:
            if f.date_range.get("from"):
                query = query.filter(Invoice.invoice_date >= f.date_range["from"])
            if f.date_range.get("to"):
                query = query.filter(Invoice.invoice_date <= f.date_range["to"])
        if f.amount_range:
            if f.amount_range.get("min") is not None:
                query = query.filter(Invoice.total_amount >= f.amount_range["min"])
            if f.amount_range.get("max") is not None:
                query = query.filter(Invoice.total_amount <= f.amount_range["max"])
        if f.vendors:
            query = query.filter(Invoice.vendor_name.in_(f.vendors))
    
    sort_field = getattr(Invoice, request.sort.field, Invoice.uploaded_at) if request.sort else Invoice.uploaded_at
    if request.sort and request.sort.order == "desc":
        query = query.order_by(desc(sort_field))
    else:
        query = query.order_by(sort_field)
    
    total = query.count()
    invoices = query.offset((request.page - 1) * request.limit).limit(request.limit).all()
    
    results = []
    for inv in invoices:
        risk = db.query(RiskReport).filter(RiskReport.invoice_id == inv.id).first()
        from app.models import Exception as ExceptionModel
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
        data=SearchResponse(
            results=results,
            pagination={
                "total": total,
                "page": request.page,
                "limit": request.limit,
                "pages": (total + request.limit - 1) // request.limit,
            },
        ),
        message="Search completed",
    )