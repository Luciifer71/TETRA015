"""
Supabase integration service for saving processed invoices
"""
from typing import Dict, Any, Optional
from datetime import datetime
from app.supabase_client import get_supabase
import logging

logger = logging.getLogger(__name__)


async def save_invoice_to_supabase(
    invoice_data: Dict[str, Any],
    extraction_result: Dict[str, Any],
    validation_result: Dict[str, Any],
    risk_result: Dict[str, Any],
    upload_id: str,
    user_email: str = "system"
) -> Optional[str]:
    """
    Save processed invoice to Supabase
    Returns: invoice_id if successful, None otherwise
    """
    try:
        supabase = get_supabase()

        # 1. Save Invoice
        invoice_record = {
            "invoice_number": invoice_data.get("invoice_number"),
            "vendor_name": invoice_data.get("vendor_name"),
            "vendor_gst": invoice_data.get("vendor_gst"),
            "invoice_date": str(invoice_data.get("invoice_date")) if invoice_data.get("invoice_date") else None,
            "due_date": str(invoice_data.get("due_date")) if invoice_data.get("due_date") else None,
            "subtotal": float(invoice_data.get("subtotal", 0)) if invoice_data.get("subtotal") else None,
            "tax_amount": float(invoice_data.get("tax_amount", 0)) if invoice_data.get("tax_amount") else None,
            "total_amount": float(invoice_data.get("total_amount", 0)),
            "currency": invoice_data.get("currency", "INR"),
            "line_items": invoice_data.get("line_items"),
            "extracted_data": extraction_result,
            "confidence_scores": extraction_result.get("confidence_scores"),
            "status": "PROCESSED",
            "is_duplicate": validation_result.get("duplicate_check", {}).get("is_duplicate", False),
            "uploaded_by": user_email,
            "processed_at": datetime.utcnow().isoformat()
        }

        invoice_response = supabase.table("invoices").insert(invoice_record).execute()
        
        if not invoice_response.data or len(invoice_response.data) == 0:
            logger.error(f"Failed to insert invoice: {invoice_response}")
            return None
            
        invoice_id = invoice_response.data[0]["id"]
        logger.info(f"✅ Invoice saved to Supabase: {invoice_id}")

        # 2. Save Risk Report
        risk_record = {
            "invoice_id": invoice_id,
            "risk_score": float(risk_result.risk_score) if risk_result.risk_score else 0,
            "risk_level": risk_result.risk_level,
            "risk_factors": risk_result.risk_factors,
            "recommendations": risk_result.recommendations
        }

        supabase.table("risk_reports").insert(risk_record).execute()
        logger.info(f"✅ Risk report saved: {risk_result.risk_level}")

        # 3. Save Audit Trail
        audit_record = {
            "invoice_id": invoice_id,
            "action": "INVOICE_PROCESSED",
            "details": {
                "extraction_confidence": extraction_result.get("avg_confidence"),
                "risk_score": risk_result.risk_score,
                "validation_errors": validation_result.get("errors", [])
            },
            "performed_by": user_email
        }

        supabase.table("audit_trail").insert(audit_record).execute()
        logger.info(f"✅ Audit trail saved")

        # 4. Save Exceptions (if any)
        if validation_result.get("errors"):
            for error in validation_result["errors"]:
                exception_record = {
                    "invoice_id": invoice_id,
                    "exception_type": error.get("code", "UNKNOWN"),
                    "description": error.get("message"),
                    "severity": error.get("severity", "MEDIUM")
                }
                try:
                    supabase.table("exceptions").insert(exception_record).execute()
                except Exception as e:
                    logger.warning(f"Failed to save exception: {e}")

        logger.info(f"✅ Exceptions saved: {len(validation_result.get('errors', []))} errors")

        return invoice_id

    except Exception as e:
        logger.error(f"❌ Error saving to Supabase: {str(e)}")
        return None


async def get_invoice_from_supabase(invoice_id: str) -> Optional[Dict[str, Any]]:
    """Get invoice details from Supabase"""
    try:
        supabase = get_supabase()
        
        response = supabase.table("invoices").select("*").eq("id", invoice_id).single().execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching invoice: {e}")
        return None


async def get_vendor_stats_from_supabase(vendor_name: str) -> Optional[Dict[str, Any]]:
    """Get vendor statistics from Supabase"""
    try:
        supabase = get_supabase()
        
        # Get all invoices from this vendor
        response = supabase.table("invoices").select("*").eq("vendor_name", vendor_name).execute()
        invoices = response.data or []
        
        if not invoices:
            return None
        
        total_amount = sum(float(i.get("total_amount", 0)) for i in invoices)
        processed = len([i for i in invoices if i.get("status") == "PROCESSED"])
        flagged = len([i for i in invoices if i.get("status") == "FLAGGED"])
        
        return {
            "vendor_name": vendor_name,
            "total_invoices": len(invoices),
            "total_amount": total_amount,
            "processed": processed,
            "flagged": flagged,
            "average_amount": total_amount / len(invoices) if invoices else 0
        }
    except Exception as e:
        logger.error(f"Error fetching vendor stats: {e}")
        return None
