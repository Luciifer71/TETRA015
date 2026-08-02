from sqlalchemy import Column, String, Integer, Text, DateTime, Float, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(50), unique=True, index=True, nullable=True)
    original_filename = Column(String(255), nullable=True)
    stored_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, default=0)
    file_type = Column(String(100), nullable=True)
    file_extension = Column(String(20), nullable=True)
    upload_status = Column(String(50), default="PENDING")
    error_message = Column(Text, nullable=True)

    extracted_data = Column(JSON, nullable=True)
    confidence_scores = Column(JSON, nullable=True)
    ocr_confidence = Column(Float, nullable=True)

    risk_score = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=True)
    validation_errors = Column(JSON, nullable=True)

    audit_report = Column(Text, nullable=True)

    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    processed_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<Upload(id={self.id}, filename={self.original_filename}, status={self.upload_status})>"