import uuid
from datetime import datetime
from typing import Any, Dict
from decimal import Decimal


def generate_id() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    return datetime.utcnow()


def format_currency(amount: float) -> str:
    return f"₹{amount:,.2f}"


def format_date(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d") if dt else ""


def calculate_percentage(part: int, total: int) -> int:
    if total == 0:
        return 0
    return round((part / total) * 100)


def safe_decimal(value: Any) -> Decimal:
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal("0")


def dict_to_camel_case(d: Dict[str, Any]) -> Dict[str, Any]:
    """Convert snake_case keys to camelCase"""
    result = {}
    for key, value in d.items():
        parts = key.split("_")
        camel_key = parts[0] + "".join(p.capitalize() for p in parts[1:])
        result[camel_key] = value
    return result


RISK_LEVEL_COLORS = {
    "LOW": "#10B981",
    "MEDIUM": "#F59E0B",
    "HIGH": "#EF4444",
    "CRITICAL": "#DC2626",
}

STATUS_COLORS = {
    "PENDING": "#6B7280",
    "PROCESSING": "#3B82F6",
    "PROCESSED": "#10B981",
    "FLAGGED": "#F59E0B",
    "APPROVED": "#1E40AF",
    "REJECTED": "#EF4444",
}