from typing import List, Optional
from datetime import timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Invoice
from app.utils import now_utc


class DuplicateResult:
    def __init__(
        self,
        is_duplicate: bool = False,
        duplicate_of: Optional[str] = None,
        similarity_score: float = 0.0,
        match_type: str = "none",
    ):
        self.is_duplicate = is_duplicate
        self.duplicate_of = duplicate_of
        self.similarity_score = similarity_score
        self.match_type = match_type


def check_exact_duplicate(db: Session, invoice: Invoice) -> Optional[Invoice]:
    """Check for exact invoice number match"""
    return db.query(Invoice).filter(
        Invoice.invoice_number == invoice.invoice_number,
        Invoice.id != invoice.id,
    ).first()


def check_amount_duplicate(db: Session, invoice: Invoice, days: int = 30) -> List[Invoice]:
    """Check for similar amount from same vendor within time window"""
    cutoff = now_utc() - timedelta(days=days)
    return db.query(Invoice).filter(
        Invoice.vendor_name == invoice.vendor_name,
        Invoice.total_amount == invoice.total_amount,
        Invoice.invoice_date >= cutoff.date(),
        Invoice.id != invoice.id,
    ).all()


def calculate_similarity(inv1: Invoice, inv2: Invoice) -> float:
    """Calculate similarity score between two invoices"""
    score = 0.0
    factors = 0
    
    if inv1.invoice_number == inv2.invoice_number:
        score += 40
    factors += 40
    
    if inv1.vendor_name.lower() == inv2.vendor_name.lower():
        score += 30
    factors += 30
    
    if inv1.total_amount == inv2.total_amount:
        score += 20
    factors += 20
    
    if inv1.invoice_date == inv2.invoice_date:
        score += 10
    factors += 10
    
    return score if factors > 0 else 0.0


def check_duplicate(db: Session, invoice: Invoice) -> DuplicateResult:
    """Main duplicate detection"""
    exact = check_exact_duplicate(db, invoice)
    if exact:
        return DuplicateResult(
            is_duplicate=True,
            duplicate_of=exact.id,
            similarity_score=100.0,
            match_type="exact_invoice_number",
        )
    
    amount_matches = check_amount_duplicate(db, invoice)
    if amount_matches:
        best_match = max(amount_matches, key=lambda x: calculate_similarity(invoice, x))
        sim = calculate_similarity(invoice, best_match)
        if sim >= 70:
            return DuplicateResult(
                is_duplicate=True,
                duplicate_of=best_match.id,
                similarity_score=sim,
                match_type="similar_amount_vendor_date",
            )
    
    return DuplicateResult()