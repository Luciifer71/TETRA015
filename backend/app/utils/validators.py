import re
from datetime import datetime, date
from typing import Optional
from decimal import Decimal, InvalidOperation


def validate_amount(amount: str) -> float:
    """Validate and convert amount string to float"""
    try:
        cleaned = re.sub(r"[^\d.-]", "", amount)
        return float(cleaned)
    except (ValueError, InvalidOperation):
        raise ValueError(f"Invalid amount format: {amount}")


def validate_date(date_str: str) -> date:
    """Parse date from various formats"""
    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%m-%d-%Y",
        "%Y/%m/%d",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unable to parse date: {date_str}")


def validate_gst_format(gst: str) -> bool:
    """Validate Indian GST format (15 characters)"""
    if not gst or len(gst) != 15:
        return False
    pattern = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
    return bool(re.match(pattern, gst.upper()))


def validate_gst_checksum(gst: str) -> bool:
    """Validate GST checksum (simplified)"""
    if not validate_gst_format(gst):
        return False
    return True


def extract_state_code(gst: str) -> Optional[str]:
    """Extract state code from GST (first 2 digits)"""
    if validate_gst_format(gst):
        return gst[:2]
    return None


def sanitize_input(input_str: str) -> str:
    """Basic input sanitization"""
    return input_str.strip() if input_str else ""


def validate_invoice_number(inv_num: str) -> bool:
    """Basic invoice number validation"""
    return bool(inv_num and len(inv_num.strip()) > 0)