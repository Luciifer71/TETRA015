import hashlib
from typing import Dict, List, Any, Tuple, Optional


class InvoiceFingerprintEngine:
    """
    AI Invoice Fingerprint Engine™
    Generates a semantic representation of an invoice to detect duplicates even when
    invoice numbers, dates, or minor details are modified.
    """

    @staticmethod
    def _normalize_text(text: Optional[str]) -> str:
        if not text:
            return ""
        return "".join(e.lower() for e in str(text) if e.isalnum())

    @staticmethod
    def _safe_float(val: Any) -> float:
        if val is None:
            return 0.0
        if isinstance(val, (int, float)):
            return float(val)
        # Handle string formats like "$1,200.50" or "1.200,50"
        cleaned = str(val).replace(",", "").replace("$", "").replace("₹", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    @classmethod
    def generate_fingerprint_vector(cls, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a structured semantic signature and feature vector from real extracted JSON.
        """
        # Normalize fields safely
        vendor_gst = cls._normalize_text(
            invoice_data.get("vendor_gst") or invoice_data.get("gstin")
        )
        vendor_name = cls._normalize_text(invoice_data.get("vendor_name"))
        
        total_amount = cls._safe_float(invoice_data.get("total_amount"))
        tax_amount = cls._safe_float(invoice_data.get("tax_amount"))
        net_amount = cls._safe_float(invoice_data.get("net_amount")) or (total_amount - tax_amount)

        # Line items signature
        line_items = invoice_data.get("line_items") or []
        if not isinstance(line_items, list):
            line_items = []

        line_signatures = []
        for item in line_items:
            if isinstance(item, dict):
                desc = cls._normalize_text(item.get("description", ""))
                qty = cls._safe_float(item.get("quantity"))
                amt = cls._safe_float(item.get("amount"))
                line_signatures.append(f"{desc[:10]}:{qty:.2f}:{amt:.2f}")

        line_count = len(line_signatures)
        line_structure_hash = hashlib.sha256(
            ",".join(sorted(line_signatures)).encode()
        ).hexdigest()[:16]

        # Financial Hash: Vendor GST + Amounts
        financial_hash = hashlib.sha256(
            f"{vendor_gst}:{total_amount:.2f}:{tax_amount:.2f}".encode()
        ).hexdigest()

        return {
            "vendor_gst": vendor_gst,
            "vendor_name_norm": vendor_name,
            "total_amount": total_amount,
            "tax_amount": tax_amount,
            "net_amount": net_amount,
            "line_item_count": line_count,
            "financial_hash": financial_hash,
            "line_structure_hash": line_structure_hash,
        }

    @classmethod
    def calculate_similarity(
        cls, fp1: Dict[str, Any], fp2: Dict[str, Any]
    ) -> Tuple[float, List[str]]:
        """
        Calculates similarity score (0-100%) and returns explainable match reasons.
        """
        score = 0.0
        reasons = []

        # 1. Vendor Match (25% weight)
        if fp1["vendor_gst"] and fp1["vendor_gst"] == fp2["vendor_gst"]:
            score += 0.25
            reasons.append("Exact Vendor GSTIN Match")
        elif fp1["vendor_name_norm"] and fp1["vendor_name_norm"] == fp2["vendor_name_norm"]:
            score += 0.20
            reasons.append("Exact Vendor Name Match")

        # 2. Total Amount Match (35% weight)
        if fp1["total_amount"] > 0 and fp2["total_amount"] > 0:
            diff = abs(fp1["total_amount"] - fp2["total_amount"])
            if diff == 0.0:
                score += 0.35
                reasons.append("Exact Total Amount Match")
            elif (diff / fp1["total_amount"]) <= 0.01:  # 1% tolerance
                score += 0.25
                reasons.append("Total Amount within 1% variation")

        # 3. Tax Amount Match (15% weight)
        if fp1["tax_amount"] > 0 and fp2["tax_amount"] > 0:
            diff = abs(fp1["tax_amount"] - fp2["tax_amount"])
            if diff == 0.0:
                score += 0.15
                reasons.append("Exact Tax Amount Match")

        # 4. Line Items & Layout Structure (25% weight)
        if fp1["line_structure_hash"] == fp2["line_structure_hash"] and fp1["line_item_count"] > 0:
            score += 0.25
            reasons.append("Identical Line Item details & breakdown")
        elif fp1["line_item_count"] == fp2["line_item_count"] and fp1["line_item_count"] > 0:
            score += 0.10
            reasons.append("Matching Line Item Count")

        similarity_pct = round(min(score, 1.0) * 100, 2)
        return similarity_pct, reasons


async def check_duplicate_invoice(
    current_invoice: Dict[str, Any],
    existing_invoices: List[Dict[str, Any]],
    threshold: float = 70.0,
) -> Dict[str, Any]:
    """
    Scans real extracted invoice against database records.
    """
    current_fp = InvoiceFingerprintEngine.generate_fingerprint_vector(current_invoice)

    highest_similarity = 0.0
    matched_invoice = None
    match_reasons = []

    for prev in existing_invoices:
        prev_fp = InvoiceFingerprintEngine.generate_fingerprint_vector(prev)
        similarity, reasons = InvoiceFingerprintEngine.calculate_similarity(current_fp, prev_fp)

        if similarity > highest_similarity:
            highest_similarity = similarity
            matched_invoice = prev
            match_reasons = reasons

    is_duplicate = highest_similarity >= threshold

    return {
        "is_duplicate": is_duplicate,
        "fingerprint_score": highest_similarity,
        "matched_invoice_number": matched_invoice.get("invoice_number") if matched_invoice else None,
        "matched_vendor": matched_invoice.get("vendor_name") if matched_invoice else None,
        "match_reasons": match_reasons if is_duplicate else [],
        "fingerprint": current_fp,
    }