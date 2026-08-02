"""
Pydantic schemas for API requests/responses
"""

from typing import Optional, Any, Dict, List
from pydantic import BaseModel
from datetime import datetime


class UploadResponse(BaseModel):
    """Response for file upload"""
    invoice_id: str
    file_name: str
    file_size: int
    status: str
    uploaded_at: str


class UploadDetailResponse(BaseModel):
    """Detailed upload status with extraction results"""
    id: str
    original_filename: Optional[str] = None
    file_size: int = 0
    file_type: Optional[str] = None
    upload_status: str
    extracted_data: Optional[Dict[str, Any]] = None
    confidence_scores: Optional[Dict[str, float]] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    validation_errors: Optional[List[Dict]] = None
    uploaded_at: Optional[str] = None
    processed_at: Optional[str] = None

    class Config:
        from_attributes = True


class BaseResponse(BaseModel):
    """Generic API response wrapper"""
    success: bool
    data: Optional[Any] = None
    message: str = ""
    error: Optional[str] = None
