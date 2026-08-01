import mimetypes
from app.services.ai_extractor import extract_invoice_data

async def get_ocr_fusion(file_path: str) -> dict:
    # 1. Determine MIME type automatically
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/pdf" if file_path.endswith(".pdf") else "image/png"
    
    # 2. Pass both file_path AND mime_type to extract_invoice_data
    extracted_data = await extract_invoice_data(file_path, mime_type)
    return extracted_data
