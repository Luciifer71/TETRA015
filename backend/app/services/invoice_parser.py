from sqlalchemy.orm import Session

from app.models import Invoice, Upload, Exception as ExceptionModel
from app.services.ai_extractor import extract_invoice_data, ExtractionResult
from app.services.matching_engine import match_invoice, MatchResult
from app.services.risk_engine import create_risk_report
from app.services.audit_logger import (
    log_upload,
    log_extraction,
    log_matching,
    log_risk_scoring,
)
from app.utils import now_utc, generate_id


async def parse_invoice(db: Session, invoice: Invoice) -> Invoice:
    """Orchestrate full invoice processing pipeline"""
    try:
        # Stage 1: AI Extraction
        invoice.status = "PROCESSING"
        invoice.processed_at = now_utc()
        db.commit()
        
        extraction_result = await extract_invoice_data(invoice.file_path, invoice.file_type)
        
        # Update invoice with extracted data
        data = extraction_result.data
        invoice.invoice_number = data.get("invoice_number", invoice.invoice_number)
        invoice.vendor_name = data.get("vendor_name", invoice.vendor_name)
        invoice.vendor_gst = data.get("vendor_gst", invoice.vendor_gst)
        
        if data.get("invoice_date"):
            invoice.invoice_date = data["invoice_date"]
        if data.get("due_date"):
            invoice.due_date = data["due_date"]
        if data.get("subtotal"):
            invoice.subtotal = data["subtotal"]
        if data.get("tax_amount") is not None:
            invoice.tax_amount = data["tax_amount"]
        if data.get("total_amount"):
            invoice.total_amount = data["total_amount"]
        if data.get("currency"):
            invoice.currency = data["currency"]
        if data.get("line_items"):
            invoice.line_items = data["line_items"]
        
        invoice.extracted_data = extraction_result.data
        invoice.confidence_scores = extraction_result.confidence_scores
        
        await log_extraction(
            db, invoice.id,
            extraction_result.confidence_scores.get("overall", 0),
            extraction_result.processing_time_ms
        )
        
        # Stage 2: Matching
        match_result = match_invoice(db, invoice)
        
        if match_result.ledger_matched and match_result.ledger_entry:
            invoice.ledger_match_id = match_result.ledger_entry.id
            match_result.ledger_entry.status = "MATCHED"
            match_result.ledger_entry.matched_invoice_id = invoice.id
        
        if match_result.vendor_matched and match_result.vendor_entry:
            invoice.vendor_match_id = match_result.vendor_entry.id
        
        await log_matching(db, invoice.id, match_result)
        
        # Stage 3: Risk Assessment
        risk_report = create_risk_report(
            db, invoice, match_result, extraction_result.confidence_scores
        )
        
        await log_risk_scoring(db, invoice.id, risk_report.risk_score, risk_report.risk_level)
        
        # Stage 4: Create exceptions for triggered rules
        for factor in risk_report.risk_factors:
            if factor["triggered"]:
                exc = ExceptionModel(
                    id=generate_id(),
                    invoice_id=invoice.id,
                    exception_type=factor["rule"].upper(),
                    exception_category=_get_exception_category(factor["rule"]),
                    description=factor["description"],
                    severity=factor["severity"],
                    auto_detected=True,
                )
                db.add(exc)
        
        # Stage 5: Finalize
        invoice.status = "PROCESSED"
        if risk_report.requires_review:
            invoice.status = "FLAGGED"
        
        invoice.processed_at = now_utc()
        db.commit()
        db.refresh(invoice)
        
        return invoice
        
    except Exception as e:
        invoice.status = "FAILED"
        db.commit()
        raise


def _get_exception_category(rule: str) -> str:
    mapping = {
        "duplicate_invoice": "DUPLICATE",
        "duplicate_amount": "DUPLICATE",
        "missing_ledger": "MATCHING",
        "gst_mismatch": "COMPLIANCE",
        "invalid_gst": "COMPLIANCE",
        "vendor_not_found": "MATCHING",
        "amount_mismatch": "MATCHING",
        "date_mismatch": "VALIDATION",
        "suspicious_vendor": "COMPLIANCE",
        "high_value": "VALIDATION",
        "repeated_transactions": "VALIDATION",
        "low_confidence": "VALIDATION",
    }
    return mapping.get(rule, "VALIDATION")


async def process_upload(db: Session, upload: Upload, file_path: str, mime_type: str) -> Invoice:
    """Create invoice record and trigger processing"""
    invoice = Invoice(
        id=generate_id(),
        invoice_number="PENDING",
        vendor_name="PENDING",
        vendor_gst=None,
        invoice_date=now_utc().date(),
        subtotal=0,
        tax_amount=0,
        total_amount=0,
        currency="INR",
        file_path=file_path,
        file_type=mime_type,
        status="PENDING",
    )
    db.add(invoice)
    db.flush()
    
    upload.invoice_id = invoice.id
    upload.upload_status = "PROCESSING"
    db.commit()
    
    await log_upload(db, invoice.id, upload.original_filename, upload.file_size)
    
    return await parse_invoice(db, invoice)