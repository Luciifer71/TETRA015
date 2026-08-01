import uuid
import mimetypes
from pathlib import Path
from typing import Tuple, List
from fastapi import UploadFile, HTTPException
from pdfplumber import open as open_pdf
from PIL import Image
import io

from app.config import settings, UPLOAD_DIR, ALLOWED_TYPES


async def save_upload(file: UploadFile, file_id: str) -> Tuple[str, str]:
    """Save uploaded file, return (file_path, mime_type)"""
    mime = file.content_type
    if mime not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {mime}. Allowed: {ALLOWED_TYPES}"
        )

    ext = ALLOWED_TYPES[mime]
    stored_name = f"{file_id}{ext}"
    stored_path = UPLOAD_DIR / stored_name

    content = await file.read()
    if len(content) > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds {settings.max_file_size // (1024*1024)}MB limit"
        )

    stored_path.write_bytes(content)
    return str(stored_path), mime


def convert_to_images(file_path: str, mime_type: str) -> List[bytes]:
    """Convert PDF/image to list of image bytes for Gemini"""
    if mime_type == "application/pdf":
        images = []
        with open_pdf(file_path) as pdf:
            for page in pdf.pages[:3]:
                img = page.to_image(resolution=150)
                buf = io.BytesIO()
                img.original.save(buf, format="PNG")
                images.append(buf.getvalue())
        return images

    return [Path(file_path).read_bytes()]


def get_file_info(file_path: str) -> dict:
    """Get file metadata"""
    path = Path(file_path)
    stat = path.stat()
    mime, _ = mimetypes.guess_type(str(path))
    return {
        "filename": path.name,
        "size": stat.st_size,
        "mime_type": mime,
        "extension": path.suffix,
    }


def delete_file(file_path: str) -> bool:
    """Delete uploaded file"""
    try:
        Path(file_path).unlink(missing_ok=True)
        return True
    except Exception:
        return False