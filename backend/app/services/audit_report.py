from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import json


@dataclass
class AuditReport:
    invoice_id: str
    generated_at: str
    invoice_data: Dict[str, Any]
    extraction_confidence: Dict[str, float]
    ocr_confidence: float
    validation_result: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    overall_status: str
    summary: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(asdict(self))


class AuditReportGenerator:
    def generate(
        self,
        invoice_id: str,
        invoice_data: Dict[str, Any],
        extraction_result: Any,
        validation_result: Any,
        risk_result: Any
    ) -> AuditReport:
        ocr_conf = extraction_result.ocr_result.avg_confidence if extraction_result.ocr_result else 0

        overall_status = self._determine_status(validation_result, risk_result)
        summary = self._generate_summary(invoice_data, validation_result, risk_result, ocr_conf)

        return AuditReport(
            invoice_id=invoice_id,
            generated_at=datetime.utcnow().isoformat(),
            invoice_data=invoice_data,
            extraction_confidence=extraction_result.confidence_scores,
            ocr_confidence=ocr_conf,
            validation_result={
                "is_valid": validation_result.is_valid,
                "errors": validation_result.errors,
                "warnings": validation_result.warnings,
                "vendor_verified": validation_result.vendor_info is not None,
                "duplicate_detected": validation_result.duplicate_check.get("is_duplicate") if validation_result.duplicate_check else False,
                "po_matched": validation_result.po_match.get("matched") if validation_result.po_match else False,
            },
            risk_assessment={
                "risk_score": risk_result.risk_score,
                "risk_level": risk_result.risk_level,
                "risk_factors": risk_result.risk_factors,
                "recommendations": risk_result.recommendations,
            },
            overall_status=overall_status,
            summary=summary
        )

    def _determine_status(self, validation_result: Any, risk_result: Any) -> str:
        if not validation_result.is_valid:
            return "REJECTED"
        if risk_result.risk_level in ["CRITICAL", "HIGH"]:
            return "FLAGGED"
        if risk_result.risk_level == "MEDIUM":
            return "REVIEW_REQUIRED"
        return "APPROVED"

    def _generate_summary(
        self,
        invoice_data: Dict[str, Any],
        validation_result: Any,
        risk_result: Any,
        ocr_conf: float
    ) -> str:
        vendor = invoice_data.get("vendor_name", "Unknown Vendor")
        amount = invoice_data.get("total_amount", 0)
        invoice_num = invoice_data.get("invoice_number", "N/A")

        lines = [
            f"Audit Report for Invoice {invoice_num}",
            f"Vendor: {vendor} | Amount: ₹{amount:,.2f}",
            f"OCR Confidence: {ocr_conf:.1f}%",
            f"Risk Level: {risk_result.risk_level} (Score: {risk_result.risk_score})",
            f"Validation: {'PASSED' if validation_result.is_valid else 'FAILED'}",
        ]

        if validation_result.errors:
            lines.append(f"Errors: {len(validation_result.errors)}")
            for err in validation_result.errors[:3]:
                lines.append(f"  - {err['message']}")

        if validation_result.warnings:
            lines.append(f"Warnings: {len(validation_result.warnings)}")

        if risk_result.risk_factors:
            lines.append("Risk Factors:")
            for rf in risk_result.risk_factors[:3]:
                lines.append(f"  - {rf['description']} ({rf['severity']})")

        if risk_result.recommendations:
            lines.append("Recommendations:")
            for rec in risk_result.recommendations[:3]:
                lines.append(f"  - {rec}")

        return "\n".join(lines)

    def to_json(self, report: AuditReport) -> str:
        return json.dumps(asdict(report), indent=2, default=str)

    def to_markdown(self, report: AuditReport) -> str:
        md = [
            f"# Invoice Audit Report",
            f"**Invoice ID:** {report.invoice_id}",
            f"**Generated:** {report.generated_at}",
            f"**Overall Status:** {report.overall_status}",
            "",
            "## Invoice Details",
            f"- **Invoice Number:** {report.invoice_data.get('invoice_number', 'N/A')}",
            f"- **Vendor:** {report.invoice_data.get('vendor_name', 'N/A')}",
            f"- **Vendor GST:** {report.invoice_data.get('vendor_gst', 'N/A')}",
            f"- **Invoice Date:** {report.invoice_data.get('invoice_date', 'N/A')}",
            f"- **Due Date:** {report.invoice_data.get('due_date', 'N/A')}",
            f"- **Total Amount:** ₹{report.invoice_data.get('total_amount', 0):,.2f}",
            f"- **Currency:** {report.invoice_data.get('currency', 'INR')}",
            "",
            "## Extraction Confidence",
            f"- **OCR Confidence:** {report.ocr_confidence:.1f}%",
        ]

        for field, score in report.extraction_confidence.items():
            md.append(f"- **{field}:** {score*100:.0f}%")

        md.extend([
            "",
            "## Validation Results",
            f"- **Valid:** {'✅ Yes' if report.validation_result['is_valid'] else '❌ No'}",
            f"- **Vendor Verified:** {'✅' if report.validation_result['vendor_verified'] else '❌'}",
            f"- **Duplicate Check:** {'⚠️ Duplicate Found' if report.validation_result['duplicate_detected'] else '✅ Clean'}",
            f"- **PO Matched:** {'✅' if report.validation_result['po_matched'] else '❌'}",
        ])

        if report.validation_result.get("errors"):
            md.append("\n### Errors")
            for err in report.validation_result["errors"]:
                md.append(f"- ❌ {err['message']}")

        if report.validation_result.get("warnings"):
            md.append("\n### Warnings")
            for warn in report.validation_result["warnings"]:
                md.append(f"- ⚠️ {warn['message']}")

        md.extend([
            "",
            "## Risk Assessment",
            f"- **Risk Score:** {report.risk_assessment['risk_score']}/100",
            f"- **Risk Level:** {report.risk_assessment['risk_level']}",
        ])

        if report.risk_assessment.get("risk_factors"):
            md.append("\n### Risk Factors")
            for rf in report.risk_assessment["risk_factors"]:
                md.append(f"- **{rf['factor']}** ({rf['severity']}): {rf['description']} (Score: {rf['score']})")

        if report.risk_assessment.get("recommendations"):
            md.append("\n### Recommendations")
            for rec in report.risk_assessment["recommendations"]:
                md.append(f"- {rec}")

        md.extend([
            "",
            "## Summary",
            f"```\n{report.summary}\n```",
        ])

        return "\n".join(md)


audit_report_generator = AuditReportGenerator()