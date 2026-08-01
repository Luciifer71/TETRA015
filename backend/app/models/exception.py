import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Exception(Base):
    __tablename__ = "exceptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    exception_type = Column(String(50), nullable=False, index=True)
    exception_category = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False, index=True)
    field_name = Column(String(100))
    expected_value = Column(String(255))
    actual_value = Column(String(255))
    auto_detected = Column(Boolean, default=True)
    resolved = Column(Boolean, default=False, index=True)
    resolved_by = Column(String(100))
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="exceptions")

    __table_args__ = (
        CheckConstraint("exception_category IN ('VALIDATION', 'MATCHING', 'COMPLIANCE', 'DUPLICATE')"),
        CheckConstraint("severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')"),
    )