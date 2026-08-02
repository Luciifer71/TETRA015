from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from app.services.duplicate_detector import InvoiceFingerprintEngine


@dataclass
class RiskResult:
    risk_score: float
    risk_level: str
    risk_factors: List[Dict[str, Any]]
    recommendations: List[str]


class RiskEngine:
    def __init__(self):
        self.weights = {
            "duplicate_risk": 0.30,
            "vendor_risk": 0.20,
            "amount_anomaly": 0.15,
            "gst_mismatch": 0.15,
            "po_mismatch": 0.10,
            "missing_fields": 0.10,
        }

    def calculate_risk(
        self,
        invoice_data: Dict[str, Any],
        validation_result: Any,
        ocr_confidence: float = 100.0
    ) -> RiskResult:
        risk_factors = []
        total_score = 0.0

        if validation_result.duplicate_check and validation_result.duplicate_check.get("is_duplicate"):
            score = validation_result.duplicate_check.get("fingerprint_score", 0) / 100
            weighted = score * self.weights["duplicate_risk"] * 100
            total_score += weighted
            risk_factors.append({
                "factor": "duplicate_risk",
                "score": round(weighted, 2),
                "description": f"Duplicate detected: {validation_result.duplicate_check.get('matched_invoice_number')}",
                "severity": "HIGH" if score > 0.85 else "MEDIUM"
            })

        if validation_result.vendor_info is None and invoice_data.get("vendor_gst"):
            weighted = self.weights["vendor_risk"] * 100
            total_score += weighted
            risk_factors.append({
                "factor": "vendor_risk",
                "score": round(weighted, 2),
                "description": "Vendor not found in master data",
                "severity": "MEDIUM"
            })

        if validation_result.po_match and validation_result.po_match.get("matched"):
            if not validation_result.po_match.get("amount_match"):
                variance_pct = abs(validation_result.po_match.get("variance", 0)) / validation_result.po_match.get("po_amount", 1)
                score = min(variance_pct * 2, 1.0)
                weighted = score * self.weights["po_mismatch"] * 100
                total_score += weighted
                risk_factors.append({
                    "factor": "po_mismatch",
                    "score": round(weighted, 2),
                    "description": f"Invoice amount differs from PO by {variance_pct*100:.1f}%",
                    "severity": "HIGH" if variance_pct > 0.2 else "MEDIUM"
                })

        vendor_gst = invoice_data.get("vendor_gst", "")
        if vendor_gst and len(vendor_gst) == 15:
            if not self._validate_gst_checksum(vendor_gst):
                weighted = self.weights["gst_mismatch"] * 100
                total_score += weighted
                risk_factors.append({
                    "factor": "gst_mismatch",
                    "score": round(weighted, 2),
                    "description": "Invalid GST checksum",
                    "severity": "HIGH"
                })

        required = ["invoice_number", "vendor_name", "vendor_gst", "invoice_date", "total_amount"]
        missing = sum(1 for f in required if not invoice_data.get(f))
        if missing > 0:
            score = missing / len(required)
            weighted = score * self.weights["missing_fields"] * 100
            total_score += weighted
            risk_factors.append({
                "factor": "missing_fields",
                "score": round(weighted, 2),
                "description": f"{missing} required fields missing",
                "severity": "MEDIUM"
            })

        if ocr_confidence < 70:
            weighted = ((100 - ocr_confidence) / 100) * 10 * 0.1
            total_score += weighted
            risk_factors.append({
                "factor": "low_ocr_confidence",
                "score": round(weighted, 2),
                "description": f"Low OCR confidence: {ocr_confidence:.1f}%",
                "severity": "MEDIUM"
            })

        if validation_result.vendor_history:
            history = validation_result.vendor_history
            recent = history.get("recent_invoices", [])
            if len(recent) > 5:
                amounts = [float(i.get("total_amount", 0)) for i in recent]
                avg_amount = sum(amounts) / len(amounts)
                current = float(invoice_data.get("total_amount", 0))
                if current > avg_amount * 3:
                    weighted = self.weights["amount_anomaly"] * 100 * 0.5
                    total_score += weighted
                    risk_factors.append({
                        "factor": "amount_anomaly",
                        "score": round(weighted, 2),
                        "description": f"Amount {current:,.2f} is 3x vendor average {avg_amount:,.2f}",
                        "severity": "MEDIUM"
                    })

        risk_score = round(min(total_score, 100), 2)
        risk_level = self._get_risk_level(risk_score)
        recommendations = self._get_recommendations(risk_factors, risk_level)

        return RiskResult(
            risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=risk_factors,
            recommendations=recommendations
        )

    def _validate_gst_checksum(self, gst: str) -> bool:
        if len(gst) != 15:
            return False
        try:
            weights = [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]
            total = 0
            for i, char in enumerate(gst[:14]):
                val = int(char, 36)
                total += val * weights[i]
            check_digit = (10 - (total % 10)) % 10
            return check_digit == int(gst[14], 36)
        except Exception:
            return False

    def _get_risk_level(self, score: float) -> str:
        if score >= 70:
            return "CRITICAL"
        elif score >= 50:
            return "HIGH"
        elif score >= 30:
            return "MEDIUM"
        elif score >= 15:
            return "LOW"
        return "MINIMAL"

    def _get_recommendations(self, risk_factors: List[Dict], risk_level: str) -> List[str]:
        recs = []
        factor_names = {f["factor"] for f in risk_factors}

        if "duplicate_risk" in factor_names:
            recs.append("Manual review required - potential duplicate invoice detected")
        if "vendor_risk" in factor_names:
            recs.append("Verify vendor credentials and add to master data")
        if "po_mismatch" in factor_names:
            recs.append("Reconcile invoice amount with purchase order")
        if "gst_mismatch" in factor_names:
            recs.append("Validate vendor GST number with government portal")
        if "missing_fields" in factor_names:
            recs.append("Request missing invoice information from vendor")
        if "low_ocr_confidence" in factor_names:
            recs.append("Re-scan invoice at higher resolution or manually verify extracted data")
        if "amount_anomaly" in factor_names:
            recs.append("Review unusual invoice amount against vendor history")

        if risk_level in ["CRITICAL", "HIGH"]:
            recs.insert(0, "ESCALATE: Requires finance team approval before payment")
        elif risk_level == "MEDIUM":
            recs.insert(0, "REVIEW: Requires supervisor sign-off")

        return recs


risk_engine = RiskEngine()