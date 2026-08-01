from datetime import datetime
from typing import Optional, Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class BaseResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    message: str
    timestamp: datetime = datetime.utcnow()


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    timestamp: datetime = datetime.utcnow()


class MessageResponse(BaseModel):
    success: bool = True
    message: str
    timestamp: datetime = datetime.utcnow()