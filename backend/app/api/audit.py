from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import AuditTrail, Invoice
from app.schemas import BaseResponse
from pydantic import BaseModel

router = APIRouter()


class AuditEntry(BaseModel):
    id: str
    action: str
    action_category: str
    actor: Optional[str]
    details: Optional[str]
    metadata: Optional[dict]
    timestamp: str


@router.get("/audit/trail/{invoice_id}", response_model=BaseResponse[dict])
async def get_invoice_audit_trail(
    invoice_id: str,
    db: Session = Depends(get_db),
):
    """Get audit trail for specific invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    entries = db.query(AuditTrail).filter(
        AuditTrail.invoice_id == invoice_id
    ).order_by(AuditTrail.timestamp.asc()).all()
    
    return BaseResponse(
        success=True,
        data={
            "audit_trail": [
                AuditEntry(
                    id=e.id,
                    action=e.action,
                    action_category=e.action_category,
                    actor=e.actor,
                    details=e.details,
                    metadata=e.metadata,
                    timestamp=e.timestamp.isoformat() if e.timestamp else "",
                )
                for e in entries
            ]
        },
        message="Audit trail retrieved",
    )


@router.get("/audit/trail", response_model=BaseResponse[dict])
async def get_global_audit_trail(
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = None,
    actor: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get system-wide audit trail"""
    query = db.query(AuditTrail).order_by(desc(AuditTrail.timestamp))
    
    if action:
        query = query.filter(AuditTrail.action == action)
    if actor:
        query = query.filter(AuditTrail.actor == actor)
    
    entries = query.limit(limit).all()
    
    return BaseResponse(
        success=True,
        data={
            "audit_trail": [
                AuditEntry(
                    id=e.id,
                    action=e.action,
                    action_category=e.action_category,
                    actor=e.actor,
                    details=e.details,
                    metadata=e.metadata,
                    timestamp=e.timestamp.isoformat() if e.timestamp else "",
                )
                for e in entries
            ]
        },
        message="Global audit trail retrieved",
    )