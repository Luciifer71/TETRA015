import uuid
from datetime import datetime
from sqlalchemy import Column, String, Date, DateTime, Numeric, Boolean, Text, JSON, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String(100), nullable=False, index=True)
    vendor_name = Column(String(255), nullable=False, index=True)
    vendor_gst = Column(String(15))
    invoice_date = Column(Date, nullable=False, index=True)
    due_date = Column(Date)
    subtotal = Column(Numeric(15, 2), nullable=False)
    tax_amount = Column(Numeric(15, 2), default=0)
    total_amount = Column(Numeric(15, 2), nullable=False, index=True)
    currency = Column(String(3), default="INR")
    line_items = Column(JSON)
    extracted_data = Column(JSON)
    confidence_scores = Column(JSON)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING", index=True)
    ledger_match_id = Column(String(36), ForeignKey("purchase_ledger.id"), nullable=True)
    vendor_match_id = Column(String(36), ForeignKey("vendor_master.id"), nullable=True)
    is_duplicate = Column(Boolean, default=False, index=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, index=True)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ledger_match = relationship("PurchaseLedger", foreign_keys="Invoice.ledger_match_id")
    vendor_match = relationship("VendorMaster", back_populates="invoices")
    risk_report = relationship("RiskReport", back_populates="invoice", uselist=False)
    exceptions = relationship("Exception", back_populates="invoice", cascade="all, delete-orphan")
    audit_trail = relationship("AuditTrail", back_populates="invoice", cascade="all, delete-orphan")
    upload = relationship("Upload", back_populates="invoice", uselist=False)

    __table_args__ = (
        CheckConstraint("status IN ('PENDING', 'PROCESSING', 'PROCESSED', 'FLAGGED', 'APPROVED', 'REJECTED')"),
        Index("idx_invoice_vendor_date", "vendor_name", "invoice_date"),
        Index("idx_invoice_status_date", "status", "uploaded_at"),
    )