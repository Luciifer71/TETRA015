import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False, unique=True)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String(100), nullable=False)
    file_extension = Column(String(10), nullable=False)
    upload_status = Column(String(20), default="PENDING", index=True)
    processing_time_ms = Column(Integer)
    error_message = Column(Text)
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=True, index=True)
    uploaded_by = Column(String(100))
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    processed_at = Column(DateTime)

    invoice = relationship("Invoice", back_populates="upload")

    __table_args__ = (
        CheckConstraint("upload_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')"),
    )