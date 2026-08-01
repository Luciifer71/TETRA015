from typing import Optional, Tuple
from sqlalchemy.orm import Session
from Levenshtein import ratio as levenshtein_ratio

from app.models import Invoice, PurchaseLedger, VendorMaster
from app.utils import validate_amount


class MatchResult:
    def __init__(
        self,
        ledger_matched: bool = False,
        ledger_entry: Optional[PurchaseLedger] = None,
        vendor_matched: bool = False,
        vendor_entry: Optional[VendorMaster] = None,
        match_confidence: float = 0.0,
        amount_match: bool = False,
        gst_match: bool = False,
    ):
        self.ledger_matched = ledger_matched
        self.ledger_entry = ledger_entry
        self.vendor_matched = vendor_matched
        self.vendor_entry = vendor_entry
        self.match_confidence = match_confidence
        self.amount_match = amount_match
        self.gst_match = gst_match


def find_ledger_entry(db: Session, invoice: Invoice) -> Optional[PurchaseLedger]:
    """Find matching ledger entry by invoice number"""
    return db.query(PurchaseLedger).filter(
        PurchaseLedger.invoice_number == invoice.invoice_number
    ).first()


def find_ledger_by_vendor_amount(db: Session, invoice: Invoice) -> Optional[PurchaseLedger]:
    """Fuzzy match by vendor name and amount"""
    tolerance = 0.01
    candidates = db.query(PurchaseLedger).filter(
        PurchaseLedger.vendor_name.ilike(f"%{invoice.vendor_name}%")
    ).all()
    
    for candidate in candidates:
        if candidate.expected_amount:
            diff = abs(float(invoice.total_amount) - float(candidate.expected_amount))
            if diff <= float(candidate.expected_amount) * tolerance:
                return candidate
    return None


def find_vendor(db: Session, invoice: Invoice) -> Optional[VendorMaster]:
    """Find vendor by GST or name"""
    if invoice.vendor_gst:
        vendor = db.query(VendorMaster).filter(
            VendorMaster.gst_number == invoice.vendor_gst
        ).first()
        if vendor:
            return vendor
    
    return db.query(VendorMaster).filter(
        VendorMaster.vendor_name.ilike(f"%{invoice.vendor_name}%")
    ).first()


def fuzzy_match_vendor(name: str, candidates: list, threshold: float = 0.85) -> list:
    """Fuzzy match vendor name using Levenshtein distance"""
    results = []
    for candidate in candidates:
        similarity = levenshtein_ratio(name.lower(), candidate.vendor_name.lower())
        if similarity >= threshold:
            results.append((candidate, similarity))
    return sorted(results, key=lambda x: x[1], reverse=True)


def compare_amounts(amount1: float, amount2: float, tolerance: float = 0.01) -> bool:
    """Compare two amounts with tolerance"""
    if amount2 == 0:
        return False
    diff = abs(amount1 - amount2)
    return diff <= amount2 * tolerance


def match_invoice(db: Session, invoice: Invoice) -> MatchResult:
    """Main matching orchestration"""
    result = MatchResult()
    
    ledger = find_ledger_entry(db, invoice)
    if not ledger:
        ledger = find_ledger_by_vendor_amount(db, invoice)
    
    if ledger:
        result.ledger_matched = True
        result.ledger_entry = ledger
        result.amount_match = compare_amounts(
            float(invoice.total_amount),
            float(ledger.expected_amount)
        )
        result.gst_match = (
            invoice.vendor_gst and ledger.vendor_gst and
            invoice.vendor_gst == ledger.vendor_gst
        )
    
    vendor = find_vendor(db, invoice)
    if vendor:
        result.vendor_matched = True
        result.vendor_entry = vendor
    
    confidence_factors = [
        result.ledger_matched,
        result.vendor_matched,
        result.amount_match,
        result.gst_match,
    ]
    result.match_confidence = sum(confidence_factors) / len(confidence_factors) * 100
    
    return result