import base64
from dataclasses import dataclass
import io
import json
import time
from typing import Any, Dict, List, Optional

import httpx
import google.generativeai as genai

from app.config import settings
from app.utils.file_handler import convert_to_images


@dataclass
class OCRResult:
    text: str
    bounding_boxes: List[Dict[str, Any]]
    tables: List[Dict[str, Any]]
    confidence_scores: List[float]
    avg_confidence: float


@dataclass
class ExtractionResult:
    data: Dict[str, Any]
    confidence_scores: Dict[str, float]
    raw_response: str
    processing_time_ms: int
    ocr_result: Optional[OCRResult]


EXTRACTION_PROMPT_WITH_OCR = """
You are an expert invoice data extraction assistant. Below is OCR text extracted from an invoice using PaddleOCR, along with confidence scores and table structures.

OCR TEXT (with confidence):
---
{ocr_text}
---

TABLES DETECTED:
{tables}

BOUNDING BOXES (for layout understanding):
{bounding_boxes}

OVERALL OCR CONFIDENCE: {avg_confidence:.2f}%

Extract invoice data and return ONLY valid JSON. If a field is not visible, use null.

{
  "invoice_number": "string",
  "vendor_name": "string",
  "vendor_gst": "string (15-char Indian GST)",
  "vendor_address": "string",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "buyer_name": "string",
  "buyer_gst": "string",
  "buyer_address": "string",
  "currency": "INR",
  "subtotal": number,
  "tax_amount": number,
  "total_amount": number,
  "gst_rate_percent": number,
  "other_taxes": number,
  "discount": number,
  "line_items": [{"description": "string", "quantity": number, "unit_price": number, "amount": number, "gst_rate": number, "hsn_code": "string"}],
  "notes": "string"
}
"""

EXTRACTION_PROMPT_VISION_ONLY = """
Extract invoice data from this document (PDF page, JPEG, or PNG).
Return JSON only. If a field is not visible, use null.

{
  "invoice_number": "string",
  "vendor_name": "string",
  "vendor_gst": "string (15-char Indian GST)",
  "vendor_address": "string",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "buyer_name": "string",
  "buyer_gst": "string",
  "buyer_address": "string",
  "currency": "INR",
  "subtotal": number,
  "tax_amount": number,
  "total_amount": number,
  "gst_rate_percent": number,
  "other_taxes": number,
  "discount": number,
  "line_items": [{"description": "string", "quantity": number, "unit_price": number, "amount": number, "gst_rate": number, "hsn_code": "string"}],
  "notes": "string"
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


def _clean_json_text(raw_text: str) -> str:
    cleaned_text = (raw_text or "{}").strip()
    if cleaned_text.startswith("```"):
        lines = cleaned_text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned_text = "\n".join(lines).strip()
    return cleaned_text


def _parse_json(raw_text: str) -> Dict[str, Any]:
    try:
        return json.loads(_clean_json_text(raw_text))
    except json.JSONDecodeError:
        return {}


def _configure_gemini():
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY not configured")
    genai.configure(api_key=settings.gemini_api_key)


async def _call_gemini(prompt: str, image_part: Dict[str, str]) -> str:
    _configure_gemini()
    candidate_models = [
        settings.GEMINI_MODEL,
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-2.5-pro",
    ]

    response = None
    last_error = None
    for model_name in candidate_models:
        if not model_name:
            continue
        try:
            model = genai.GenerativeModel(model_name)
            response = await model.generate_content_async([prompt, image_part])
            if response and response.text:
                return response.text
        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"All Gemini model attempts failed. Last error: {last_error}")


async def _call_groq(prompt: str) -> str:
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY not configured")

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0,
    }
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _call_openrouter(prompt: str) -> str:
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY not configured")

    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0,
    }
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _generate_extraction(prompt: str, image_part: Dict[str, str]) -> str:
    provider = settings.active_llm_provider
    if provider == "groq":
        return await _call_groq(prompt)
    if provider == "openrouter":
        return await _call_openrouter(prompt)
    return await _call_gemini(prompt, image_part)


def _run_paddleocr(image_path: str) -> Optional[OCRResult]:
    try:
        from paddleocr import PaddleOCR
    except ImportError:
        return None

    try:
        ocr = PaddleOCR(use_angle_cls=True, lang="en", use_gpu=False, show_log=False)
        result = ocr.ocr(image_path, cls=True)

        text_lines = []
        bounding_boxes = []
        all_confidences = []
        tables = []

        for page in result:
            if not page:
                continue
            for entry in page:
                bbox = entry[0]
                text = entry[1][0]
                confidence = entry[1][1]

                text_lines.append(text)
                bounding_boxes.append({
                    "text": text,
                    "bbox": bbox,
                    "confidence": confidence,
                })
                all_confidences.append(confidence)

        avg_conf = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0

        return OCRResult(
            text="\n".join(text_lines),
            bounding_boxes=bounding_boxes,
            tables=tables,
            confidence_scores=all_confidences,
            avg_confidence=avg_conf * 100,
        )
    except Exception:
        return None


async def extract_invoice_data(file_path: str, mime_type: str) -> ExtractionResult:
    start_time = time.time()
    _rate_limiter.acquire()

    images = convert_to_images(file_path, mime_type)
    primary_image = images[0]

    img_byte_arr = io.BytesIO()
    primary_image.save(img_byte_arr, format="PNG")
    primary_image_bytes = img_byte_arr.getvalue()

    import os
    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(primary_image_bytes)
        tmp_path = tmp.name

    try:
        ocr_result = _run_paddleocr(tmp_path)
    finally:
        os.unlink(tmp_path)

    image_part = {
        "mime_type": "image/png",
        "data": base64.b64encode(primary_image_bytes).decode("utf-8"),
    }

    if ocr_result and ocr_result.text.strip():
        tables_str = json.dumps(ocr_result.tables, indent=2) if ocr_result.tables else "None detected"
        bbox_str = json.dumps(ocr_result.bounding_boxes[:20], indent=2)
        prompt = EXTRACTION_PROMPT_WITH_OCR.format(
            ocr_text=ocr_result.text,
            tables=tables_str,
            bounding_boxes=bbox_str,
            avg_confidence=ocr_result.avg_confidence,
        )
        ocr_confidence = ocr_result.avg_confidence
    else:
        prompt = EXTRACTION_PROMPT_VISION_ONLY
        ocr_result = OCRResult(
            text="",
            bounding_boxes=[],
            tables=[],
            confidence_scores=[],
            avg_confidence=0.0,
        )
        ocr_confidence = 85.0

    raw_text = await _generate_extraction(prompt, image_part)
    extracted = _parse_json(raw_text)
    confidence_scores = _calculate_confidence(extracted, raw_text, ocr_confidence)
    processing_time = int((time.time() - start_time) * 1000)

    return ExtractionResult(
        data=extracted,
        confidence_scores=confidence_scores,
        raw_response=raw_text,
        processing_time_ms=processing_time,
        ocr_result=ocr_result,
    )


def _calculate_confidence(extracted: Dict[str, Any], raw_text: str, ocr_confidence: float) -> Dict[str, float]:
    required_fields = [
        "invoice_number",
        "vendor_name",
        "vendor_gst",
        "invoice_date",
        "total_amount",
        "currency",
    ]

    scores: Dict[str, float] = {}
    for field in required_fields:
        value = extracted.get(field)
        if value is not None and value != "":
            scores[field] = 0.9 * (ocr_confidence / 100)
        else:
            scores[field] = 0.3

    scores["overall"] = sum(scores.values()) / len(scores) if scores else 0.0
    scores["ocr_confidence"] = ocr_confidence / 100
    return scores
