import uuid
from datetime import datetime, timezone
from .file_handler import convert_to_images


def generate_id() -> str:
    """Generate a unique ID"""
    return str(uuid.uuid4())


def now_utc() -> str:
    """Get current UTC timestamp as ISO format string"""
    return datetime.now(timezone.utc).isoformat()


__all__ = ["convert_to_images", "generate_id", "now_utc"]