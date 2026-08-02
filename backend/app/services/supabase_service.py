"""Supabase integration service for saving processed invoices."""

from datetime import datetime
import logging
from typing import Any, Dict, Optional

from app.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def _value(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


async def save_invoice_to_supabase(
    invoice_data: Dict[str, Any],
    extraction_result: Dict[str, Any],
    validation_result: Dict[str, Any],
    risk_result: Dict[str, Any],
    upload_id: str,
    user_email: str = "system",
) -> Optional[str]:
    """Save a processed invoice and related artifacts to Supabase."""
    try:
        supabase = get_supabase()
        confidence_scores = _value(extraction_result, "confidence_scores", {}) or {}
        ocr_confidence = _value(extraction_result, "ocr_confidence")

        invoice_record = {
            "invoice_number": invoice_data.get("invoice_number"),
            "vendor_name": invoice_data.get("vendor_name"),
            "vendor_gst": invoice_data.get("vendor_gst"),
            "invoice_date": str(invoice_data.get("invoice_date")) if invoice_data.get("invoice_date") else None,
            "due_date": str(invoice_data.get("due_date")) if invoice_data.get("due_date") else None,
            "subtotal": float(invoice_data.get("subtotal", 0)) if invoice_data.get("subtotal") else None,
            "tax_amount": float(invoice_data.get("tax_amount", 0)) if invoice_data.get("tax_amount") else None,
            "total_amount": float(invoice_data.get("total_amount", 0) or 0),
            "currency": invoice_data.get("currency", "INR"),
            "line_items": invoice_data.get("line_items"),
            "extracted_data": invoice_data,
            "confidence_scores": confidence_scores,
            "status": "PROCESSED",
            "is_duplicate": validation_result.get("duplicate_check", {}).get("is_duplicate", False),
            "uploaded_by": user_email,
            "processed_at": datetime.utcnow().isoformat(),
            "source_upload_id": upload_id,
        }

        invoice_response = supabase.table("invoices").insert(invoice_record).execute()
        if not invoice_response.data:
            logger.error(f"Failed to insert invoice for upload {upload_id}: {invoice_response}")
            return None

        invoice_id = invoice_response.data[0]["id"]
        logger.info(f"Invoice saved to Supabase: {invoice_id}")

        risk_record = {
            "invoice_id": invoice_id,
            "risk_score": float(_value(risk_result, "risk_score", 0) or 0),
            "risk_level": _value(risk_result, "risk_level"),
            "risk_factors": _value(risk_result, "risk_factors", []),
            "recommendations": _value(risk_result, "recommendations", []),
        }
        supabase.table("risk_reports").insert(risk_record).execute()

        audit_record = {
            "invoice_id": invoice_id,
            "action": "INVOICE_PROCESSED",
            "details": {
                "extraction_confidence": confidence_scores.get("overall"),
                "ocr_confidence": ocr_confidence,
                "risk_score": _value(risk_result, "risk_score", 0),
                "validation_errors": validation_result.get("errors", []),
            },
            "performed_by": user_email,
        }
        supabase.table("audit_trail").insert(audit_record).execute()

        for error in validation_result.get("errors", []):
            exception_record = {
                "invoice_id": invoice_id,
                "exception_type": error.get("code", "UNKNOWN"),
                "description": error.get("message"),
                "severity": error.get("severity", "MEDIUM"),
            }
            try:
                supabase.table("exceptions").insert(exception_record).execute()
            except Exception as exc:
                logger.warning(f"Failed to save exception for invoice {invoice_id}: {exc}")

        return invoice_id
    except Exception as exc:
        logger.error(f"Error saving upload {upload_id} to Supabase: {exc}")
        return None


async def get_invoice_from_supabase(invoice_id: str) -> Optional[Dict[str, Any]]:
    """Get invoice details from Supabase."""
    try:
        supabase = get_supabase()
        response = supabase.table("invoices").select("*").eq("id", invoice_id).single().execute()
        return response.data
    except Exception as exc:
        logger.error(f"Error fetching invoice {invoice_id}: {exc}")
        return None


async def get_vendor_stats_from_supabase(vendor_name: str) -> Optional[Dict[str, Any]]:
    """Get aggregated vendor statistics from Supabase."""
    try:
        supabase = get_supabase()
        response = supabase.table("invoices").select("*").eq("vendor_name", vendor_name).execute()
        invoices = response.data or []

        if not invoices:
            return None

        total_amount = sum(float(invoice.get("total_amount", 0) or 0) for invoice in invoices)
        processed = len([invoice for invoice in invoices if invoice.get("status") == "PROCESSED"])
        flagged = len([invoice for invoice in invoices if invoice.get("status") == "FLAGGED"])

        return {
            "vendor_name": vendor_name,
            "total_invoices": len(invoices),
            "total_amount": total_amount,
            "processed": processed,
            "flagged": flagged,
            "average_amount": total_amount / len(invoices) if invoices else 0,
        }
    except Exception as exc:
        logger.error(f"Error fetching vendor stats for {vendor_name}: {exc}")
        return None
