import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class AuditTrail(Base):
    __tablename__ = "audit_trail"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(50), nullable=False, index=True)
    action_category = Column(String(20), nullable=False)
    actor = Column(String(100))
    details = Column(Text)
    action_metadata = Column(JSON)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    invoice = relationship("Invoice", back_populates="audit_trail")

    __table_args__ = (
        CheckConstraint("action_category IN ('SYSTEM', 'USER', 'AI', 'BATCH')"),
    )