import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, DateTime, Numeric, Text, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class PurchaseLedger(Base):
    __tablename__ = "purchase_ledger"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_number = Column(String(100), nullable=False, unique=True, index=True)
    invoice_number = Column(String(100), index=True)
    vendor_name = Column(String(255), nullable=False, index=True)
    vendor_gst = Column(String(15))
    po_date = Column(Date, nullable=False, index=True)
    expected_amount = Column(Numeric(15, 2), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="OPEN", index=True)
    matched_invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    matched_invoice = relationship("Invoice", foreign_keys="PurchaseLedger.matched_invoice_id", uselist=False)

    __table_args__ = (
        CheckConstraint("status IN ('OPEN', 'MATCHED', 'CLOSED', 'CANCELLED')"),
    )