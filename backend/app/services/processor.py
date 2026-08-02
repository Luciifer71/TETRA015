from typing import Tuple
from sqlalchemy.orm import Session
from fastapi import UploadFile
from pathlib import Path
import shutil
import uuid

from app.services.ai_extractor import extract_invoice_data, ExtractionResult
from app.services.validation_service import validation_service, ValidationResult
from app.services.risk_engine import risk_engine, RiskResult
from app.services.audit_report import audit_report_generator, AuditReport
from app.services.duplicate_detector import InvoiceFingerprintEngine
from app.models import Upload
from app.utils import now_utc
from app.config import settings
from datetime import datetime, timezone


UPLOAD_DIR = Path(settings.UPLOAD_DIR) if hasattr(settings, 'UPLOAD_DIR') else Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


async def process_upload(
    db: Session,
    upload: Upload,
    file: UploadFile,
    mime_type: str
) -> Tuple[str, str]:
    file_id = upload.id
    ext = Path(file.filename or "").suffix or ".pdf"
    stored_filename = f"{file_id}{ext}"
    file_path = UPLOAD_DIR / stored_filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    validated_mime_type = mime_type
    if ext.lower() == ".pdf":
        validated_mime_type = "application/pdf"
    elif ext.lower() in [".jpg", ".jpeg"]:
        validated_mime_type = "image/jpeg"
    elif ext.lower() == ".png":
        validated_mime_type = "image/png"

    return str(file_path), validated_mime_type


async def process_invoice_pipeline(
    db: Session,
    upload: Upload,
    file_path: str,
    mime_type: str
) -> dict:
    try:
        extraction_result: ExtractionResult = await extract_invoice_data(file_path, mime_type)
        invoice_data = extraction_result.data

        existing_invoices = []
        all_uploads = db.query(Upload).filter(Upload.id != upload.id).all()
        for u in all_uploads:
            if u.extracted_data:
                existing_invoices.append(u.extracted_data)

        validation_result: ValidationResult = await validation_service.validate_invoice(
            invoice_data, existing_invoices
        )

        ocr_confidence = extraction_result.ocr_result.avg_confidence if extraction_result.ocr_result else 0
        risk_result: RiskResult = risk_engine.calculate_risk(
            invoice_data, validation_result, ocr_confidence
        )

        audit_report: AuditReport = audit_report_generator.generate(
            invoice_id=upload.id,
            invoice_data=invoice_data,
            extraction_result=extraction_result,
            validation_result=validation_result,
            risk_result=risk_result
        )

        upload.extracted_data = invoice_data
        upload.confidence_scores = extraction_result.confidence_scores
        upload.ocr_confidence = ocr_confidence
        upload.risk_score = risk_result.risk_score
        upload.risk_level = risk_result.risk_level
        upload.validation_errors = validation_result.errors if validation_result.errors else None
        upload.processed_at = datetime.now(timezone.utc)
        upload.audit_report = audit_report.to_json()

        db.commit()

        return {
            "extraction": extraction_result.data,
            "confidence": extraction_result.confidence_scores,
            "ocr_confidence": ocr_confidence,
            "validation": {
                "is_valid": validation_result.is_valid,
                "errors": validation_result.errors,
                "warnings": validation_result.warnings,
                "vendor_info": validation_result.vendor_info,
                "duplicate_check": validation_result.duplicate_check,
                "po_match": validation_result.po_match,
                "vendor_history": validation_result.vendor_history,
            },
            "risk": {
                "risk_score": risk_result.risk_score,
                "risk_level": risk_result.risk_level,
                "risk_factors": risk_result.risk_factors,
                "recommendations": risk_result.recommendations,
            },
            "audit_report": audit_report.to_json(),
        }

    except Exception as e:
        upload.upload_status = "FAILED"
        upload.error_message = str(e)
        db.commit()
        raise


async def get_existing_invoice_data(db: Session) -> list:
    uploads = db.query(Upload).filter(Upload.extracted_data.isnot(None)).all()
    return [u.extracted_data for u in uploads if u.extracted_data]
