import base64
import json
import time
import google.generativeai as genai
from typing import Dict, Any, Optional
from dataclasses import dataclass

from app.config import settings
from app.utils import convert_to_images


@dataclass
class ExtractionResult:
    data: Dict[str, Any]
    confidence_scores: Dict[str, float]
    raw_response: str
    processing_time_ms: int


EXTRACTION_PROMPT = """
Extract invoice data from this document (PDF page, JPEG, or PNG).
Return JSON only. If a field is not visible, use null.

{
  "invoice_number": "string",
  "vendor_name": "string",
  "vendor_gst": "string (15-char Indian GST)",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "subtotal": number,
  "tax_amount": number,
  "total_amount": number,
  "currency": "INR",
  "line_items": [{"item": "string", "quantity": number, "rate": number, "amount": number}]
}
"""


class RateLimiter:
    def __init__(self, max_requests: int = 15, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = []

    def acquire(self):
        now = time.time()
        self.requests = [req for req in self.requests if now - req < self.window_seconds]
        if len(self.requests) >= self.max_requests:
            sleep_time = self.window_seconds - (now - self.requests[0])
            if sleep_time > 0:
                time.sleep(sleep_time)
        self.requests.append(time.time())


_rate_limiter = RateLimiter()


def _configure_gemini():
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    genai.configure(api_key=settings.gemini_api_key)


async def extract_invoice_data(file_path: str, mime_type: str) -> ExtractionResult:
    start_time = time.time()
    
    _configure_gemini()
    _rate_limiter.acquire()
    
    # Convert incoming PDF/image to byte arrays
    images = convert_to_images(file_path, mime_type)
    primary_image = images[0]
    
    # Priority list of model names to attempt
    candidate_models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-2.5-pro",
    ]
    
    # Try initializing and calling with candidates
    response = None
    last_error = None
    
    image_part = {
        "mime_type": "image/png",
        "data": base64.b64encode(primary_image).decode("utf-8"),
    }

    for model_name in candidate_models:
        try:
            model = genai.GenerativeModel(model_name)
            response = await model.generate_content_async([EXTRACTION_PROMPT, image_part])
            if response:
                break
        except Exception as e:
            last_error = e
            continue

    if response is None:
        raise RuntimeError(f"All Gemini model attempts failed. Last error: {last_error}")
    
    raw_text = response.text if response.text else "{}"
    
    # Sanitize markdown code blocks from response text if present
    cleaned_text = raw_text.strip()
    if cleaned_text.startswith("```"):
        lines = cleaned_text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned_text = "\n".join(lines).strip()
    
    try:
        extracted = json.loads(cleaned_text)
    except json.JSONDecodeError:
        extracted = {}
    
    confidence_scores = _calculate_confidence(extracted, raw_text)
    
    processing_time = int((time.time() - start_time) * 1000)
    
    return ExtractionResult(
        data=extracted,
        confidence_scores=confidence_scores,
        raw_response=raw_text,
        processing_time_ms=processing_time,
    )


def _calculate_confidence(extracted: Dict[str, Any], raw_text: str) -> Dict[str, float]:
    required_fields = [
        "invoice_number", "vendor_name", "vendor_gst",
        "invoice_date", "total_amount", "currency"
    ]
    
    scores = {}
    for field in required_fields:
        value = extracted.get(field)
        if value is not None and value != "":
            scores[field] = 0.9
        else:
            scores[field] = 0.3
    
    scores["overall"] = sum(scores.values()) / len(scores) if scores else 0.0
    return scores