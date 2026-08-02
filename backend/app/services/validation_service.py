import httpx
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from app.config import settings
from app.services.duplicate_detector import check_duplicate_invoice, InvoiceFingerprintEngine


@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    vendor_info: Optional[Dict[str, Any]] = None
    duplicate_check: Optional[Dict[str, Any]] = None
    po_match: Optional[Dict[str, Any]] = None
    vendor_history: Optional[Dict[str, Any]] = None


class ValidationService:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.client = None
        if self.supabase_url and self.supabase_key:
            self.client = httpx.AsyncClient(
                base_url=f"{self.supabase_url}/rest/v1",
                headers={
                    "apikey": self.supabase_key,
                    "Authorization": f"Bearer {self.supabase_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                timeout=30.0
            )

    async def close(self):
        if self.client:
            await self.client.aclose()

    async def validate_invoice(self, invoice_data: Dict[str, Any], existing_invoices: List[Dict[str, Any]] = None) -> ValidationResult:
        errors = []
        warnings = []
        vendor_info = None
        duplicate_check = None
        po_match = None
        vendor_history = None

        if not self.client:
            warnings.append({"code": "SUPABASE_NOT_CONFIGURED", "message": "Supabase not configured, skipping verification"})
            return ValidationResult(
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings
            )

        vendor_gst = invoice_data.get("vendor_gst")
        invoice_number = invoice_data.get("invoice_number")
        total_amount = invoice_data.get("total_amount")

        if vendor_gst:
            vendor_info = await self._check_vendor_master(vendor_gst)
            if not vendor_info:
                warnings.append({"code": "VENDOR_NOT_FOUND", "message": f"Vendor GST {vendor_gst} not found in master data"})
            vendor_history = await self._get_vendor_history(vendor_gst)

        if invoice_number and vendor_gst:
            duplicate_check = await self._check_duplicate(invoice_data, existing_invoices or [])
            if duplicate_check.get("is_duplicate"):
                errors.append({
                    "code": "DUPLICATE_INVOICE",
                    "message": f"Potential duplicate of invoice {duplicate_check.get('matched_invoice_number')}",
                    "details": duplicate_check
                })

        po_match = await self._match_purchase_order(invoice_data)

        required_fields = ["invoice_number", "vendor_name", "vendor_gst", "invoice_date", "total_amount"]
        for field in required_fields:
            if not invoice_data.get(field):
                errors.append({"code": "MISSING_FIELD", "message": f"Required field missing: {field}"})

        if vendor_gst and len(vendor_gst) != 15:
            errors.append({"code": "INVALID_GST", "message": "Vendor GST must be 15 characters"})

        if total_amount is not None and total_amount <= 0:
            errors.append({"code": "INVALID_AMOUNT", "message": "Total amount must be positive"})

        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            vendor_info=vendor_info,
            duplicate_check=duplicate_check,
            po_match=po_match,
            vendor_history=vendor_history
        )

    async def _check_vendor_master(self, vendor_gst: str) -> Optional[Dict[str, Any]]:
        try:
            resp = await self.client.get(
                "/vendors",
                params={"gstin": f"eq.{vendor_gst}", "select": "*", "limit": "1"}
            )
            if resp.status_code == 200:
                data = resp.json()
                return data[0] if data else None
        except Exception:
            pass
        return None

    async def _get_vendor_history(self, vendor_gst: str) -> Optional[Dict[str, Any]]:
        try:
            resp = await self.client.get(
                "/invoices",
                params={"vendor_gst": f"eq.{vendor_gst}", "select": "invoice_number,invoice_date,total_amount,status", "order": "invoice_date.desc", "limit": "10"}
            )
            if resp.status_code == 200:
                invoices = resp.json()
                return {
                    "total_invoices": len(invoices),
                    "total_amount": sum(float(i.get("total_amount", 0)) for i in invoices),
                    "recent_invoices": invoices[:5]
                }
        except Exception:
            pass
        return None

    async def _check_duplicate(self, invoice_data: Dict[str, Any], existing_invoices: List[Dict[str, Any]]) -> Dict[str, Any]:
        return await check_duplicate_invoice(invoice_data, existing_invoices, threshold=70.0)

    async def _match_purchase_order(self, invoice_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        po_number = invoice_data.get("po_number")
        if not po_number:
            return {"matched": False, "reason": "No PO number on invoice"}

        try:
            resp = await self.client.get(
                "/purchase_orders",
                params={"po_number": f"eq.{po_number}", "select": "*", "limit": "1"}
            )
            if resp.status_code == 200:
                data = resp.json()
                if data:
                    po = data[0]
                    invoice_total = float(invoice_data.get("total_amount", 0))
                    po_amount = float(po.get("total_amount", 0))
                    tolerance = po_amount * 0.05
                    amount_match = abs(invoice_total - po_amount) <= tolerance

                    return {
                        "matched": True,
                        "po_number": po_number,
                        "po_amount": po_amount,
                        "invoice_amount": invoice_total,
                        "amount_match": amount_match,
                        "variance": invoice_total - po_amount,
                        "po_status": po.get("status")
                    }
        except Exception:
            pass
        return {"matched": False, "reason": f"PO {po_number} not found"}


validation_service = ValidationService()