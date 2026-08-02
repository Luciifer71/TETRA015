"""
Utility functions for the application
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import List
from pathlib import Path

try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

logger = logging.getLogger(__name__)


def generate_id() -> str:
    """Generate a unique ID for uploads"""
    return str(uuid.uuid4())


def now_utc() -> str:
    """Get current UTC timestamp as ISO format string"""
    return datetime.now(timezone.utc).isoformat()


def convert_to_images(file_path: str, mime_type: str) -> List[bytes]:
    """
    Convert PDF or image file to list of image bytes (PNG format)
    
    Supports:
    - PDF: Converts all pages to PNG images
    - PNG: Returns as-is
    - JPG/JPEG: Converts to PNG
    - TIFF: Converts to PNG
    
    Args:
        file_path: Path to the file
        mime_type: MIME type of the file
    
    Returns:
        List of image bytes in PNG format, or empty list if conversion failed
    """
    try:
        file_path = str(file_path)
        logger.info(f"Converting {mime_type} to images: {file_path}")
        
        if mime_type == "application/pdf":
            return _convert_pdf_to_images(file_path)
        elif mime_type in ["image/png", "image/jpeg", "image/jpg", "image/tiff"]:
            return _convert_image_to_bytes(file_path, mime_type)
        else:
            logger.error(f"Unsupported MIME type: {mime_type}")
            return []
            
    except Exception as e:
        logger.error(f"Image conversion failed: {str(e)}")
        return []


def _convert_pdf_to_images(pdf_path: str) -> List[bytes]:
    """
    Convert PDF to list of PNG image bytes
    
    Uses pdf2image library to convert PDF pages to PIL Images,
    then converts to PNG bytes
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        List of PNG image bytes, one per PDF page
    """
    if not PDF2IMAGE_AVAILABLE:
        logger.error("pdf2image not installed. Install with: pip install pdf2image")
        return []
    
    if not PIL_AVAILABLE:
        logger.error("Pillow not installed. Install with: pip install Pillow")
        return []
    
    try:
        import io
        
        # Convert PDF pages to PIL Images
        logger.info(f"Converting PDF to images: {pdf_path}")
        pil_images = convert_from_path(
            pdf_path,
            dpi=150,  # Standard DPI for document scanning
            fmt="ppm"  # Faster format for conversion
        )
        
        if not pil_images:
            logger.error(f"No pages extracted from PDF: {pdf_path}")
            return []
        
        logger.info(f"Extracted {len(pil_images)} pages from PDF")
        
        # Convert PIL Images to PNG bytes
        image_bytes_list = []
        for idx, pil_image in enumerate(pil_images):
            try:
                # Convert to RGB if necessary (remove alpha channel)
                if pil_image.mode in ('RGBA', 'LA', 'P'):
                    pil_image = pil_image.convert('RGB')
                
                # Convert to PNG bytes
                png_buffer = io.BytesIO()
                pil_image.save(png_buffer, format='PNG', quality=95)
                image_bytes = png_buffer.getvalue()
                
                image_bytes_list.append(image_bytes)
                logger.debug(f"Converted PDF page {idx + 1} to PNG ({len(image_bytes)} bytes)")
                
            except Exception as e:
                logger.error(f"Failed to convert PDF page {idx + 1}: {str(e)}")
                continue
        
        logger.info(f"Successfully converted {len(image_bytes_list)} pages to PNG")
        return image_bytes_list
        
    except Exception as e:
        logger.error(f"PDF conversion failed: {str(e)}")
        return []


def _convert_image_to_bytes(image_path: str, mime_type: str) -> List[bytes]:
    """
    Convert image file (PNG, JPG, TIFF) to PNG bytes
    
    Args:
        image_path: Path to image file
        mime_type: MIME type (image/png, image/jpeg, image/tiff)
    
    Returns:
        List with single PNG image bytes
    """
    if not PIL_AVAILABLE:
        logger.error("Pillow not installed. Install with: pip install Pillow")
        return []
    
    try:
        import io
        
        logger.info(f"Converting image to PNG: {image_path}")
        
        # Open image
        pil_image = Image.open(image_path)
        
        # Convert to RGB if necessary
        if pil_image.mode in ('RGBA', 'LA', 'P'):
            pil_image = pil_image.convert('RGB')
        
        # If already PNG, return as-is
        if mime_type == "image/png" and pil_image.format == 'PNG':
            with open(image_path, 'rb') as f:
                image_bytes = f.read()
            logger.info(f"Returned PNG image as-is ({len(image_bytes)} bytes)")
            return [image_bytes]
        
        # Convert to PNG
        png_buffer = io.BytesIO()
        pil_image.save(png_buffer, format='PNG', quality=95)
        image_bytes = png_buffer.getvalue()
        
        logger.info(f"Converted {mime_type} to PNG ({len(image_bytes)} bytes)")
        return [image_bytes]
        
    except Exception as e:
        logger.error(f"Image conversion failed: {str(e)}")
        return []


def validate_file_size(file_path: str, max_size_mb: int = 50) -> bool:
    """
    Validate file size
    
    Args:
        file_path: Path to file
        max_size_mb: Maximum size in MB
    
    Returns:
        True if file is within size limit
    """
    try:
        file_size_bytes = Path(file_path).stat().st_size
        max_size_bytes = max_size_mb * 1024 * 1024
        
        if file_size_bytes > max_size_bytes:
            logger.warning(f"File {file_path} exceeds {max_size_mb}MB limit")
            return False
        
        logger.debug(f"File size validated: {file_size_bytes / 1024 / 1024:.2f}MB")
        return True
        
    except Exception as e:
        logger.error(f"File size validation failed: {str(e)}")
        return False
