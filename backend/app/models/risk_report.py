import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Numeric, Text, JSON, ForeignKey, CheckConstraint, Index, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class RiskReport(Base):
    __tablename__ = "risk_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    risk_score = Column(Integer, nullable=False, index=True)
    risk_level = Column(String(20), nullable=False, index=True)
    risk_factors = Column(JSON, nullable=False)
    rule_results = Column(JSON)
    confidence_score = Column(Numeric(5, 2))
    explanation = Column(Text)
    recommendations = Column(Text)
    duplicate_of = Column(String(36))
    similarity_score = Column(Numeric(5, 2))
    requires_review = Column(Boolean, default=False, index=True)
    reviewed = Column(Boolean, default=False)
    reviewed_by = Column(String(100))
    reviewed_at = Column(DateTime)
    review_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="risk_report")

    __table_args__ = (
        CheckConstraint("risk_score >= 0 AND risk_score <= 100"),
        CheckConstraint("risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')"),
        Index("idx_risk_level_score", "risk_level", "risk_score"),
    )