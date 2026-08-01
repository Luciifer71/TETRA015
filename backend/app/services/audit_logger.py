from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.models import AuditTrail
from app.utils import generate_id, now_utc


async def log_action(
    db: Session,
    invoice_id: Optional[str],
    action: str,
    action_category: str,
    actor: str,
    details: str,
    metadata: Optional[Dict[str, Any]] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
) -> AuditTrail:
    """Log an action to audit trail"""
    entry = AuditTrail(
        id=generate_id(),
        invoice_id=invoice_id,
        action=action,
        action_category=action_category,
        actor=actor,
        details=details,
        metadata=metadata,
        old_values=old_values,
        new_values=new_values,
        timestamp=now_utc(),
    )
    db.add(entry)
    db.flush()
    return entry


async def log_upload(db: Session, invoice_id: str, filename: str, file_size: int):
    await log_action(
        db=db,
        invoice_id=invoice_id,
        action="UPLOAD",
        action_category="SYSTEM",
        actor="system",
        details=f"Invoice file uploaded: {filename}",
        metadata={"filename": filename, "size": file_size},
    )


async def log_extraction(db: Session, invoice_id: str, confidence: float, processing_time_ms: int):
    await log_action(
        db=db,
        invoice_id=invoice_id,
        action="EXTRACT",
        action_category="AI",
        actor="gemini-vision-api",
        details="AI extraction completed",
        metadata={"confidence": confidence, "processing_time_ms": processing_time_ms},
    )


async def log_matching(db: Session, invoice_id: str, result):
    await log_action(
        db=db,
        invoice_id=invoice_id,
        action="MATCH",
        action_category="SYSTEM",
        actor="matching-engine",
        details=f"Ledger matched: {result.ledger_matched}, Vendor matched: {result.vendor_matched}",
        metadata={
            "ledger_matched": result.ledger_matched,
            "vendor_matched": result.vendor_matched,
            "match_confidence": result.match_confidence,
        },
    )


async def log_risk_scoring(db: Session, invoice_id: str, risk_score: int, risk_level: str):
    await log_action(
        db=db,
        invoice_id=invoice_id,
        action="RISK_SCORE",
        action_category="SYSTEM",
        actor="risk-engine",
        details=f"Risk score calculated: {risk_score} ({risk_level})",
        metadata={"risk_score": risk_score, "risk_level": risk_level},
    )


async def log_review(db: Session, invoice_id: str, reviewer: str, action: str, notes: str = ""):
    await log_action(
        db=db,
        invoice_id=invoice_id,
        action=action.upper(),
        action_category="USER",
        actor=reviewer,
        details=f"Manual {action.lower()}: {notes}",
        metadata={"reviewer": reviewer, "notes": notes},
    )


async def get_audit_trail(db: Session, invoice_id: str) -> List[AuditTrail]:
    """Get audit trail for invoice"""
    return db.query(AuditTrail).filter(
        AuditTrail.invoice_id == invoice_id
    ).order_by(AuditTrail.timestamp.asc()).all()


async def get_global_audit_trail(
    db: Session,
    limit: int = 100,
    action: Optional[str] = None,
    actor: Optional[str] = None,
) -> List[AuditTrail]:
    """Get system-wide audit trail"""
    query = db.query(AuditTrail).order_by(AuditTrail.timestamp.desc())
    
    if action:
        query = query.filter(AuditTrail.action == action)
    if actor:
        query = query.filter(AuditTrail.actor == actor)
    
    return query.limit(limit).all()