import fitz  # PyMuPDF
from PIL import Image
import io
from typing import List

def convert_to_images(file_path_or_bytes, mime_type: str = "application/pdf") -> List[Image.Image]:
    """
    Converts a PDF or image file into PIL Image objects for multi-modal AI processing.
    """
    images = []

    # If it's already an image format
    if "image" in mime_type:
        if isinstance(file_path_or_bytes, str):
            images.append(Image.open(file_path_or_bytes).convert("RGB"))
        else:
            images.append(Image.open(io.BytesIO(file_path_or_bytes)).convert("RGB"))
        return images

    # Handle PDF conversion using PyMuPDF (fitz)
    if isinstance(file_path_or_bytes, str):
        doc = fitz.open(file_path_or_bytes)
    else:
        doc = fitz.open(stream=file_path_or_bytes, filetype="pdf")

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=200)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)

    doc.close()
    return images