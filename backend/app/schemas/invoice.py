from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal


class LineItem(BaseModel):
    item: str
    quantity: int
    rate: float
    amount: float


class InvoiceBase(BaseModel):
    invoice_number: str
    vendor_name: str
    vendor_gst: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    subtotal: float
    tax_amount: float = 0
    total_amount: float
    currency: str = "INR"
    line_items: Optional[List[LineItem]] = None


class InvoiceCreate(InvoiceBase):
    file_path: str
    file_type: str
    confidence_scores: Optional[dict] = None
    extracted_data: Optional[dict] = None
    ledger_match_id: Optional[str] = None
    vendor_match_id: Optional[str] = None


class InvoiceUpdate(BaseModel):
    vendor_name: Optional[str] = None
    vendor_gst: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    line_items: Optional[List[LineItem]] = None
    status: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    id: str
    status: str
    confidence_scores: Optional[dict] = None
    file_path: str
    file_type: str
    ledger_match_id: Optional[str] = None
    vendor_match_id: Optional[str] = None
    is_duplicate: bool = False
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceListResponse(BaseModel):
    id: str
    invoice_number: str
    vendor_name: str
    invoice_date: date
    total_amount: float
    currency: str
    status: str
    risk_level: Optional[str] = None
    risk_score: Optional[int] = None
    uploaded_at: datetime
    has_exceptions: bool = False
    exception_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(25, ge=1, le=100)
    sort_by: str = "uploaded_at"
    sort_order: str = "desc"


class InvoiceFilters(BaseModel):
    status: Optional[str] = None
    risk_level: Optional[str] = None
    vendor: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None


class PaginatedResponse(BaseModel):
    invoices: List[InvoiceListResponse]
    pagination: dict