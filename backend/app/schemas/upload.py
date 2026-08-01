from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UploadResponse(BaseModel):
    invoice_id: str
    file_name: str
    file_size: int
    status: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UploadDetailResponse(BaseModel):
    upload_id: str
    original_filename: str
    file_size: int
    file_type: str
    status: str
    invoice_id: Optional[str] = None
    processing_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    uploaded_at: datetime
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)