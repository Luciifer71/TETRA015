from typing import List, Dict, Any, Optional
from datetime import timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Invoice, RiskReport, Exception, VendorMaster
from app.services.gst_validator import validate_gst_format
from app.services.duplicate_detector import check_duplicate, DuplicateResult
from app.services.matching_engine import MatchResult
from app.utils import now_utc, generate_id


class RuleResult:
    def __init__(
        self,
        rule: str,
        triggered: bool,
        weight: int,
        severity: str,
        description: str = "",
    ):
        self.rule = rule
        self.triggered = triggered
        self.weight = weight
        self.severity = severity
        self.description = description


RISK_RULES = {
    "duplicate_invoice": {
        "weight": 30,
        "severity": "CRITICAL",
        "description": "Exact duplicate invoice number found",
    },
    "duplicate_amount": {
        "weight": 25,
        "severity": "HIGH",
        "description": "Similar amount from same vendor within 30 days",
    },
    "missing_ledger": {
        "weight": 20,
        "severity": "HIGH",
        "description": "No matching purchase order found in ledger",
    },
    "gst_mismatch": {
        "weight": 15,
        "severity": "MEDIUM",
        "description": "GST number does not match ledger/vendor record",
    },
    "invalid_gst": {
        "weight": 15,
        "severity": "MEDIUM",
        "description": "Invalid GST number format",
    },
    "vendor_not_found": {
        "weight": 20,
        "severity": "HIGH",
        "description": "Vendor not found in master database",
    },
    "amount_mismatch": {
        "weight": 15,
        "severity": "MEDIUM",
        "description": "Invoice amount differs from ledger beyond tolerance",
    },
    "date_mismatch": {
        "weight": 10,
        "severity": "LOW",
        "description": "Invoice date anomaly (before PO or >90 days old)",
    },
    "suspicious_vendor": {
        "weight": 25,
        "severity": "CRITICAL",
        "description": "Vendor flagged as suspicious in master",
    },
    "high_value": {
        "weight": 10,
        "severity": "MEDIUM",
        "description": "Invoice amount exceeds ₹1,00,000",
    },
    "repeated_transactions": {
        "weight": 15,
        "severity": "MEDIUM",
        "description": ">3 invoices from same vendor in 7 days",
    },
    "low_confidence": {
        "weight": 20,
        "severity": "HIGH",
        "description": "AI extraction confidence below 70%",
    },
}


def evaluate_rules(
    db: Session,
    invoice: Invoice,
    match_result: MatchResult,
    extraction_confidence: Dict[str, float],
) -> List[RuleResult]:
    """Evaluate all risk rules"""
    results = []
    
    # duplicate_invoice
    dup_result = check_duplicate(db, invoice)
    results.append(RuleResult(
        rule="duplicate_invoice",
        triggered=dup_result.is_duplicate,
        weight=RISK_RULES["duplicate_invoice"]["weight"],
        severity=RISK_RULES["duplicate_invoice"]["severity"],
        description=RISK_RULES["duplicate_invoice"]["description"] if dup_result.is_duplicate else "",
    ))
    
    # duplicate_amount
    results.append(RuleResult(
        rule="duplicate_amount",
        triggered=dup_result.match_type == "similar_amount_vendor_date",
        weight=RISK_RULES["duplicate_amount"]["weight"],
        severity=RISK_RULES["duplicate_amount"]["severity"],
        description=RISK_RULES["duplicate_amount"]["description"] if dup_result.match_type == "similar_amount_vendor_date" else "",
    ))
    
    # missing_ledger
    results.append(RuleResult(
        rule="missing_ledger",
        triggered=not match_result.ledger_matched,
        weight=RISK_RULES["missing_ledger"]["weight"],
        severity=RISK_RULES["missing_ledger"]["severity"],
        description=RISK_RULES["missing_ledger"]["description"] if not match_result.ledger_matched else "",
    ))
    
    # gst_mismatch
    gst_mismatch = (
        match_result.ledger_matched and
        invoice.vendor_gst and
        match_result.ledger_entry and
        match_result.ledger_entry.vendor_gst and
        invoice.vendor_gst != match_result.ledger_entry.vendor_gst
    )
    results.append(RuleResult(
        rule="gst_mismatch",
        triggered=gst_mismatch,
        weight=RISK_RULES["gst_mismatch"]["weight"],
        severity=RISK_RULES["gst_mismatch"]["severity"],
        description=RISK_RULES["gst_mismatch"]["description"] if gst_mismatch else "",
    ))
    
    # invalid_gst
    invalid_gst = invoice.vendor_gst and not validate_gst_format(invoice.vendor_gst)
    results.append(RuleResult(
        rule="invalid_gst",
        triggered=invalid_gst,
        weight=RISK_RULES["invalid_gst"]["weight"],
        severity=RISK_RULES["invalid_gst"]["severity"],
        description=RISK_RULES["invalid_gst"]["description"] if invalid_gst else "",
    ))
    
    # vendor_not_found
    results.append(RuleResult(
        rule="vendor_not_found",
        triggered=not match_result.vendor_matched,
        weight=RISK_RULES["vendor_not_found"]["weight"],
        severity=RISK_RULES["vendor_not_found"]["severity"],
        description=RISK_RULES["vendor_not_found"]["description"] if not match_result.vendor_matched else "",
    ))
    
    # amount_mismatch
    amount_mismatch = match_result.ledger_matched and not match_result.amount_match
    results.append(RuleResult(
        rule="amount_mismatch",
        triggered=amount_mismatch,
        weight=RISK_RULES["amount_mismatch"]["weight"],
        severity=RISK_RULES["amount_mismatch"]["severity"],
        description=RISK_RULES["amount_mismatch"]["description"] if amount_mismatch else "",
    ))
    
    # date_mismatch
    date_mismatch = False
    if match_result.ledger_matched and match_result.ledger_entry:
        if invoice.invoice_date < match_result.ledger_entry.po_date:
            date_mismatch = True
    results.append(RuleResult(
        rule="date_mismatch",
        triggered=date_mismatch,
        weight=RISK_RULES["date_mismatch"]["weight"],
        severity=RISK_RULES["date_mismatch"]["severity"],
        description=RISK_RULES["date_mismatch"]["description"] if date_mismatch else "",
    ))
    
    # suspicious_vendor
    suspicious = match_result.vendor_matched and match_result.vendor_entry and match_result.vendor_entry.is_suspicious
    results.append(RuleResult(
        rule="suspicious_vendor",
        triggered=suspicious,
        weight=RISK_RULES["suspicious_vendor"]["weight"],
        severity=RISK_RULES["suspicious_vendor"]["severity"],
        description=RISK_RULES["suspicious_vendor"]["description"] if suspicious else "",
    ))
    
    # high_value
    high_value = float(invoice.total_amount) > 100000
    results.append(RuleResult(
        rule="high_value",
        triggered=high_value,
        weight=RISK_RULES["high_value"]["weight"],
        severity=RISK_RULES["high_value"]["severity"],
        description=RISK_RULES["high_value"]["description"] if high_value else "",
    ))
    
    # repeated_transactions
    cutoff = now_utc() - timedelta(days=7)
    recent_count = db.query(Invoice).filter(
        Invoice.vendor_name == invoice.vendor_name,
        Invoice.uploaded_at >= cutoff,
        Invoice.id != invoice.id,
    ).count()
    repeated = recent_count >= 3
    results.append(RuleResult(
        rule="repeated_transactions",
        triggered=repeated,
        weight=RISK_RULES["repeated_transactions"]["weight"],
        severity=RISK_RULES["repeated_transactions"]["severity"],
        description=RISK_RULES["repeated_transactions"]["description"] if repeated else "",
    ))
    
    # low_confidence
    overall_confidence = extraction_confidence.get("overall", 1.0)
    low_conf = overall_confidence < 0.7
    results.append(RuleResult(
        rule="low_confidence",
        triggered=low_conf,
        weight=RISK_RULES["low_confidence"]["weight"],
        severity=RISK_RULES["low_confidence"]["severity"],
        description=RISK_RULES["low_confidence"]["description"] if low_conf else "",
    ))
    
    return results


def calculate_risk_score(rule_results: List[RuleResult]) -> int:
    """Calculate weighted risk score (0-100)"""
    total_weight = sum(r.weight for r in rule_results)
    triggered_weight = sum(r.weight for r in rule_results if r.triggered)
    
    if total_weight == 0:
        return 0
    
    score = (triggered_weight / total_weight) * 100
    return min(max(int(score), 0), 100)


def categorize_risk(score: int) -> str:
    """Categorize risk level"""
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MEDIUM"
    elif score <= 85:
        return "HIGH"
    return "CRITICAL"


def generate_explanation(rule_results: List[RuleResult]) -> str:
    """Generate natural language explanation"""
    triggered = [r for r in rule_results if r.triggered]
    
    if not triggered:
        return "No risk factors detected. Invoice appears valid."
    
    critical = [r for r in triggered if r.severity == "CRITICAL"]
    high = [r for r in triggered if r.severity == "HIGH"]
    medium = [r for r in triggered if r.severity == "MEDIUM"]
    low = [r for r in triggered if r.severity == "LOW"]
    
    parts = []
    if critical:
        parts.append(f"Critical issues: {', '.join(r.description for r in critical)}")
    if high:
        parts.append(f"High risk: {', '.join(r.description for r in high)}")
    if medium:
        parts.append(f"Medium risk: {', '.join(r.description for r in medium)}")
    if low:
        parts.append(f"Low risk: {', '.join(r.description for r in low)}")
    
    return ". ".join(parts) + "."


def generate_recommendations(rule_results: List[RuleResult]) -> str:
    """Generate action recommendations"""
    triggered = [r for r in rule_results if r.triggered]
    
    if not triggered:
        return "Standard approval process recommended."
    
    recs = []
    if any(r.rule == "duplicate_invoice" for r in triggered):
        recs.append("Verify against original invoice - potential duplicate payment.")
    if any(r.rule == "missing_ledger" for r in triggered):
        recs.append("Request purchase order from procurement before approval.")
    if any(r.rule in ["gst_mismatch", "invalid_gst"] for r in triggered):
        recs.append("Validate GST compliance with vendor.")
    if any(r.rule == "vendor_not_found" for r in triggered):
        recs.append("Add vendor to master database or verify legitimacy.")
    if any(r.rule == "suspicious_vendor" for r in triggered):
        recs.append("Escalate to compliance team - suspicious vendor flagged.")
    if any(r.rule == "high_value" for r in triggered):
        recs.append("Requires additional approval per high-value policy.")
    if any(r.rule == "low_confidence" for r in triggered):
        recs.append("Manual review of extracted data recommended.")
    
    if not recs:
        recs.append("Review flagged items before approval.")
    
    return " ".join(recs)


def create_risk_report(
    db: Session,
    invoice: Invoice,
    match_result: MatchResult,
    extraction_confidence: Dict[str, float],
) -> RiskReport:
    """Create and save risk report"""
    rule_results = evaluate_rules(db, invoice, match_result, extraction_confidence)
    risk_score = calculate_risk_score(rule_results)
    risk_level = categorize_risk(risk_score)
    explanation = generate_explanation(rule_results)
    recommendations = generate_recommendations(rule_results)
    
    risk_factors = [
        {
            "rule": r.rule,
            "triggered": r.triggered,
            "weight": r.weight,
            "severity": r.severity,
            "description": r.description,
        }
        for r in rule_results
    ]
    
    rule_results_json = [
        {
            "rule": r.rule,
            "passed": not r.triggered,
            "weight": r.weight,
            "severity": r.severity,
        }
        for r in rule_results
    ]
    
    requires_review = risk_level in ["HIGH", "CRITICAL"]
    
    report = RiskReport(
        id=generate_id(),
        invoice_id=invoice.id,
        risk_score=risk_score,
        risk_level=risk_level,
        risk_factors=risk_factors,
        rule_results=rule_results_json,
        confidence_score=extraction_confidence.get("overall"),
        explanation=explanation,
        recommendations=recommendations,
        requires_review=requires_review,
    )
    
    db.add(report)
    return report